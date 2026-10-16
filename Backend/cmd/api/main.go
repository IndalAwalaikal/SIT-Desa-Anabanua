package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	httpapi "desa-anabanua-api/internal/delivery/http"
	"desa-anabanua-api/internal/delivery/http/handler"
	"desa-anabanua-api/internal/delivery/http/middleware"
	iauth "desa-anabanua-api/internal/infrastructure/auth"
	"desa-anabanua-api/internal/infrastructure/config"
	email "desa-anabanua-api/internal/infrastructure/email"
	"desa-anabanua-api/internal/infrastructure/jobs"
	mysqlstore "desa-anabanua-api/internal/infrastructure/mysql"
	"desa-anabanua-api/internal/infrastructure/storage"
	whatsapp "desa-anabanua-api/internal/infrastructure/whatsapp"
	"desa-anabanua-api/internal/pkg/apputil"
	"desa-anabanua-api/internal/pkg/notif"
	"desa-anabanua-api/internal/usecase"
	asecase "desa-anabanua-api/internal/usecase/auth"
	"desa-anabanua-api/internal/usecase/berita"
	"desa-anabanua-api/internal/usecase/desa"
	"desa-anabanua-api/internal/usecase/finance"
	"desa-anabanua-api/internal/usecase/galeri"
	"desa-anabanua-api/internal/usecase/notifikasi"
	"desa-anabanua-api/internal/usecase/pajak"
	"desa-anabanua-api/internal/usecase/pengaduan"
	"desa-anabanua-api/internal/usecase/pengunjung"
	"desa-anabanua-api/internal/usecase/persuratan"
	"desa-anabanua-api/internal/usecase/sekilas_info"
	"desa-anabanua-api/internal/usecase/sembako"
	"desa-anabanua-api/internal/usecase/umkm"
	ucuser "desa-anabanua-api/internal/usecase/user"
)

// asyncMailer wraps an EmailSender and enqueues jobs instead of sending synchronously.
type asyncMailer struct {
	worker *jobs.Worker
	inner  email.Sender
}

func (a *asyncMailer) Send(ctx context.Context, to, subject, htmlBody string) error {
	payload, err := jobs.MarshalPayload(jobs.EmailJobPayload{
		To:       to,
		Subject:  subject,
		HTMLBody: htmlBody,
	})
	if err != nil {
		return err
	}
	a.worker.Enqueue(jobs.Job{
		ID:         apputil.NewID(),
		Type:       jobs.JobTypeSendEmail,
		Payload:    payload,
		CreatedAt:  time.Now(),
		MaxRetries: 3,
	})
	return nil
}

// asyncWhatsapp wraps a WhatsAppSender and enqueues jobs instead of sending synchronously.
type asyncWhatsapp struct {
	worker *jobs.Worker
	inner  whatsapp.Sender
}

func (a *asyncWhatsapp) Send(ctx context.Context, to, text string) error {
	payload, err := jobs.MarshalPayload(jobs.WhatsAppJobPayload{To: to, Text: text})
	if err != nil {
		return err
	}
	a.worker.Enqueue(jobs.Job{
		ID:         apputil.NewID(),
		Type:       jobs.JobTypeSendWhatsApp,
		Payload:    payload,
		CreatedAt:  time.Now(),
		MaxRetries: 3,
	})
	return nil
}

func main() {
	log := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	cfg, err := config.Load()
	if err != nil {
		log.Error("configuration is invalid", "error", err)
		os.Exit(1)
	}

	db, err := mysqlstore.Open(cfg)
	if err != nil {
		log.Error("database connection failed", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	tokens := iauth.New(cfg.JWTSecret, cfg.AccessTTL)
	hasher := iauth.NewBcryptHasher()
	tx := mysqlstore.NewTx(db)
	fileStorage, err := storage.NewLocal(cfg.StoragePath, "/uploads")
	if err != nil {
		log.Error("storage init failed", "error", err)
		os.Exit(1)
	}

	mailer := email.New(cfg.MailjetAPIKey, cfg.MailjetAPISecret, cfg.MailjetFromEmail)
	waSender := whatsapp.New(cfg.FlowKirimAPIKey, cfg.FlowKirimBaseURL)

	// Background job worker for async email, WhatsApp, PDF, and cleanup tasks.
	jobWorker := jobs.NewWorker(100, log)
	jobWorker.Register(jobs.JobTypeSendEmail, func(ctx context.Context, job jobs.Job) error {
		payload, err := jobs.UnmarshalEmailPayload(job.Payload)
		if err != nil {
			return err
		}
		return mailer.Send(ctx, payload.To, payload.Subject, payload.HTMLBody)
	})
	jobWorker.Register(jobs.JobTypeSendWhatsApp, func(ctx context.Context, job jobs.Job) error {
		payload, err := jobs.UnmarshalWhatsAppPayload(job.Payload)
		if err != nil {
			return err
		}
		return waSender.Send(ctx, payload.To, payload.Text)
	})
	jobWorker.Start(4)

	// Persist jobs to DB so email/WA delivery survives process restarts.
	jobStore := mysqlstore.NewJobStore(db, log)
	jobWorker.WithStore(jobStore)

	// Recover jobs that were pending/processing before a crash.
	recovered := jobWorker.RecoverPending(context.Background(), 200)
	log.Info("job worker started", "workers", 4, "recoveredJobs", recovered)

	asyncMail := &asyncMailer{worker: jobWorker, inner: mailer}
	asyncWa := &asyncWhatsapp{worker: jobWorker, inner: waSender}

	// Repositories (infrastructure adapters).
	userRepo := mysqlstore.NewUserRepo(db)
	refreshRepo := mysqlstore.NewRefreshTokenRepo(db)
	otpRepo := mysqlstore.NewOTPRepo(db)
	pendingRepo := mysqlstore.NewPendingRegistrationRepo(db)
	beritaRepo := mysqlstore.NewBeritaRepo(db)
	jenisRepo := mysqlstore.NewJenisSuratRepo(db)
	pengajuanRepo := mysqlstore.NewPengajuanRepo(db)
	pendudukRepo := mysqlstore.NewPendudukRepo(db)
	pengaduanRepo := mysqlstore.NewPengaduanRepo(db)
	profilRepo := mysqlstore.NewProfilRepo(db)
	perangkatRepo := mysqlstore.NewPerangkatRepo(db)
	dusunRepo := mysqlstore.NewDusunRepo(db)
	potensiRepo := mysqlstore.NewPotensiRepo(db)
	fasilitasRepo := mysqlstore.NewFasilitasRepo(db)
	statistikRepo := mysqlstore.NewStatistikRepo(db)
	apbdesRepo := mysqlstore.NewApbdesRepo(db)
	agendaRepo := mysqlstore.NewAgendaRepo(db)
	galeriRepo := mysqlstore.NewGaleriRepo(db)
	umkmRepo := mysqlstore.NewUmkmRepo(db)
	adminUserRepo := mysqlstore.NewAdminUserRepo(db)
	pajakRepo := mysqlstore.NewPajakRepo(db)
	notifikasiRepo := mysqlstore.NewNotifikasiRepo(db)
	sekilasInfoRepo := mysqlstore.NewSekilasInfoRepo(db)
	sembakoRepo := mysqlstore.NewSembakoRepo(db)
	pengunjungRepo := mysqlstore.NewPengunjungRepo(db)

	// Use case services (business logic).
	authSvc := asecase.NewService(userRepo, refreshRepo, otpRepo, pendingRepo, asyncMail, hasher, tokens, tx, cfg.RefreshTTL, cfg.OTPTTL)
	if cfg.BootstrapSuperAdminEmail != "" {
		if err := authSvc.BootstrapSuperAdmin(context.Background(), cfg.BootstrapSuperAdminName, cfg.BootstrapSuperAdminEmail, cfg.BootstrapSuperAdminPassword); err != nil {
			log.Error("super admin bootstrap failed", "error", err)
			os.Exit(1)
		}
	}
	notifSvc := notifikasi.NewService(notifikasiRepo, adminUserRepo)
	beritaSvc := berita.NewService(beritaRepo, notifSvc)
	notifDeduper := notif.NewDeduplicator(5 * time.Second)
	persSvc := persuratan.NewService(jenisRepo, pengajuanRepo, pendudukRepo, fileStorage, tx, userRepo, asyncMail, asyncWa, cfg.AppURL, cfg.HMACSecret, perangkatRepo, notifikasiRepo, notifDeduper)
	aduanSvc := pengaduan.NewService(pengaduanRepo, notifSvc)
	desaSvc := desa.NewService(profilRepo, perangkatRepo, dusunRepo, potensiRepo, fasilitasRepo)
	finSvc := finance.NewService(statistikRepo, apbdesRepo, agendaRepo)
	galSvc := galeri.NewService(galeriRepo, notifSvc)
	umkmSvc := umkm.NewService(umkmRepo)
	userSvc := ucuser.NewService(adminUserRepo)
	pajakSvc := pajak.NewService(pajakRepo)
	sekilasInfoSvc := sekilasinfo.NewService(sekilasInfoRepo)
	sembakoSvc := sembako.NewService(sembakoRepo)
	pengunjungSvc := pengunjung.NewService(pengunjungRepo, cfg.VisitorHMACSecret)

	app := usecase.New(authSvc, beritaSvc, persSvc, aduanSvc, desaSvc, finSvc, galSvc, umkmSvc, userSvc, pajakSvc, notifSvc, sekilasInfoSvc, sembakoSvc, pengunjungSvc)
	h := handler.New(app)
	r := httpapi.NewRouter(h, tokens, db)

	// Enqueue periodic cleanup job.
	cleanupCtx, cleanupCancel := context.WithCancel(context.Background())
	go func() {
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				cutoff := time.Now().Add(-30 * 24 * time.Hour)
				payload, _ := jobs.MarshalPayload(jobs.CleanupJobPayload{OlderThan: cutoff})
				jobWorker.Enqueue(jobs.Job{
					ID:         apputil.NewID(),
					Type:       jobs.JobTypeCleanupExpired,
					Payload:    payload,
					CreatedAt:  time.Now(),
					MaxRetries: 1,
				})
			case <-cleanupCtx.Done():
				return
			}
		}
	}()
	defer cleanupCancel()

	// Serve locally-uploaded files (lampiran, galeri, UMKM) from the configured path.
	mux := http.NewServeMux()
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir(cfg.StoragePath))))
	mux.Handle("/", r)

	s := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           middleware.Common(cfg.CORSOrigins, cfg.Env, log)(middleware.BodyLimit(middleware.MaxBodyBytes)(mux)),
		ReadHeaderTimeout: 10 * time.Second, // protects against slow-header attacks
		// ReadTimeout / WriteTimeout are intentionally 0 (disabled).
		// The /api/notifikasi/stream endpoint is a long-lived SSE connection
		// (heartbeat every 15s). A non-zero Read/WriteTimeout can prematurely
		// terminate the streaming response on the Go runtime side.
		// IdleTimeout handles cleanup of truly idle TCP connections.
		ReadTimeout:  0,
		WriteTimeout: 0,
		IdleTimeout:  120 * time.Second,
	}
	go func() {
		log.Info("server started", "addr", s.Addr)
		if err := s.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("server failed", "error", err)
		}
	}()

	ch := make(chan os.Signal, 1)
	signal.Notify(ch, syscall.SIGINT, syscall.SIGTERM)
	<-ch
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = s.Shutdown(ctx)
	jobWorker.Shutdown(5 * time.Second)
}
