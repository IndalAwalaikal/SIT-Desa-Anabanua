package httpapi

import (
	"database/sql"
	"net/http"
	"time"

	apiresponse "desa-anabanua-api/internal/delivery/http/apiresponse"
	"desa-anabanua-api/internal/delivery/http/handler"
	"desa-anabanua-api/internal/delivery/http/middleware"
	iauth "desa-anabanua-api/internal/infrastructure/auth"
)

func NewRouter(h *handler.Handler, tokens *iauth.Service, db *sql.DB) http.Handler {
	m := http.NewServeMux()
	auth := middleware.Auth(tokens)
	admin := middleware.Role("admin", "super_admin")
	super := middleware.Role("super_admin")
	limit := middleware.NewRateLimiter(10, time.Minute).Middleware
	csrfMiddleware := middleware.NewCSRF()
	csrf := csrfMiddleware.Middleware

	public := func(pattern string, fn http.HandlerFunc) { m.Handle(pattern, fn) }
	rateLimited := func(pattern string, fn http.HandlerFunc) { m.Handle(pattern, limit(fn)) }
	// ponytail: soft read-rate-limit on public GET endpoints (60/min/IP)
	// protects against brute-force tracking-number enumeration and scraping.
	readLimit := middleware.NewRateLimiter(60, time.Minute).Middleware
	readLimited := func(pattern string, fn http.HandlerFunc) { m.Handle(pattern, readLimit(fn)) }
	csrfSecure := func(pattern string, fn http.HandlerFunc) { m.Handle(pattern, csrf(auth(fn))) }
	csrfAdministrate := func(pattern string, fn http.HandlerFunc) { m.Handle(pattern, csrf(auth(admin(fn)))) }

	public("/healthz", func(w http.ResponseWriter, r *http.Request) {
		apiresponse.JSON(w, 200, map[string]string{"status": "ok"})
	})
	public("/readyz", func(w http.ResponseWriter, r *http.Request) {
		if db.PingContext(r.Context()) != nil {
			apiresponse.JSON(w, 503, map[string]string{"status": "not ready"})
			return
		}
		apiresponse.JSON(w, 200, map[string]string{"status": "ready"})
	})
	// Endpoint ini selalu men-generate token CSRF baru dan menyetelnya sebagai cookie.
	// Frontend wajib memanggil endpoint ini sekali (saat inisialisasi / sebelum form mutasi)
	// agar cookie csrf_token_v2 tersedia untuk dikirim ulang sebagai header X-CSRF-Token.
	public("/api/csrf-token", func(w http.ResponseWriter, r *http.Request) {
		token := csrfMiddleware.GenerateAndSetCookie(w)
		apiresponse.JSON(w, 200, map[string]string{"csrfToken": token})
	})
	public("/api/metrics", func(w http.ResponseWriter, r *http.Request) {
		apiresponse.JSON(w, 200, map[string]string{"status": "ok"})
	})

	rateLimited("POST /api/auth/register", h.Register)
	rateLimited("POST /api/auth/verify-otp", h.VerifyOTP)
	rateLimited("POST /api/auth/resend-otp", h.ResendOTP)
	rateLimited("POST /api/auth/forgot-password", h.ForgotPassword)
	rateLimited("POST /api/auth/reset-password", h.ResetPassword)
	rateLimited("POST /api/auth/login", h.Login)
	rateLimited("POST /api/auth/refresh", h.Refresh)
	csrfSecure("POST /api/auth/logout", h.Logout)
	csrfSecure("GET /api/auth/me", h.Me)
	csrfSecure("POST /api/auth/change-password", h.ChangePassword)
	csrfSecure("PUT /api/users/profile", h.UpdateProfile)
	m.Handle("GET /api/users", auth(super(http.HandlerFunc(h.UsersList))))
	m.Handle("PUT /api/users/{id}", csrf(auth(super(http.HandlerFunc(h.UserUpdate)))))

	public("GET /api/berita", h.BeritaList)
	public("GET /api/berita/{slug}", h.BeritaGet)
	csrfAdministrate("GET /api/admin/berita", h.BeritaAdminList)
	csrfAdministrate("POST /api/berita", h.BeritaCreate)
	csrfAdministrate("PUT /api/berita/{id}", h.BeritaUpdate)
	csrfAdministrate("DELETE /api/berita/{id}", h.BeritaDelete)
	public("GET /api/berita/{slug}/komentar", h.BeritaKomentarList)
	csrfSecure("POST /api/berita/{slug}/komentar", h.BeritaKomentarCreate)
	csrfSecure("DELETE /api/berita/{slug}/komentar/{id}", h.BeritaKomentarDelete)

	public("GET /api/layanan", h.JenisList)
	public("GET /api/layanan/{kode}", h.JenisGet)
	csrfAdministrate("GET /api/admin/layanan", h.JenisAdminList)
	csrfAdministrate("POST /api/layanan", h.JenisCreate)
	csrfAdministrate("PUT /api/layanan/{kode}", h.JenisUpdate)
	csrfAdministrate("DELETE /api/layanan/{kode}", h.JenisDelete)
	csrfSecure("POST /api/pengajuan", h.PengajuanCreate)
	csrfSecure("GET /api/pengajuan/{id}/lampiran/{lampiranID}", h.PengajuanLampiran)
	readLimited("GET /api/pengajuan/{nomorResi}", h.PengajuanGet)
	readLimited("GET /api/surat/{nomorResi}", h.PengajuanGetSurat)
	readLimited("GET /api/verifikasi/surat/{code}", h.VerifikasiSurat)
	csrfSecure("GET /api/penduduk/nik/{nik}", h.GetPendudukByNIK)
	csrfSecure("GET /api/pengajuan/saya", h.PengajuanSaya)
	csrfAdministrate("GET /api/pengajuan", h.PengajuanList)
	csrfAdministrate("GET /api/admin/pengajuan/buku-agenda", h.PengajuanBukuAgenda)
	csrfAdministrate("PATCH /api/pengajuan/{id}/status", h.PengajuanStatus)
	csrfAdministrate("POST /api/pengajuan/{id}/publish", h.PengajuanPublish)
	csrfAdministrate("DELETE /api/admin/pengajuan/{id}", h.PengajuanDelete)

	csrfSecure("POST /api/pengaduan", h.PengaduanCreate)
	readLimited("GET /api/pengaduan/{nomorTiket}", h.PengaduanGet)
	csrfSecure("GET /api/pengaduan/saya", h.PengaduanSaya)
	csrfAdministrate("GET /api/pengaduan", h.PengaduanList)
	csrfAdministrate("PATCH /api/pengaduan/{id}/status", h.PengaduanStatus)

	public("GET /api/profil-desa", h.ProfilGet)
	csrfAdministrate("PUT /api/profil-desa", h.ProfilUpdate)
	public("GET /api/perangkat-desa", h.PerangkatList)
	csrfAdministrate("POST /api/perangkat-desa", h.PerangkatCreate)
	csrfAdministrate("PUT /api/perangkat-desa/{id}", h.PerangkatUpdate)
	csrfAdministrate("DELETE /api/perangkat-desa/{id}", h.PerangkatDelete)
	public("GET /api/dusun", h.DusunList)
	public("GET /api/sekilas-info", h.SekilasInfoGet)
	csrfAdministrate("GET /api/admin/sekilas-info", h.SekilasInfoAdminList)
	csrfAdministrate("POST /api/sekilas-info", h.SekilasInfoCreate)
	csrfAdministrate("PUT /api/sekilas-info/{id}", h.SekilasInfoUpdate)
	csrfAdministrate("DELETE /api/sekilas-info/{id}", h.SekilasInfoDelete)
	public("GET /api/potensi-desa", h.PotensiList)

	public("GET /api/fasilitas", h.FasilitasList)
	csrfAdministrate("POST /api/fasilitas", h.FasilitasCreate)
	csrfAdministrate("PUT /api/fasilitas/{id}", h.FasilitasUpdate)
	csrfAdministrate("DELETE /api/fasilitas/{id}", h.FasilitasDelete)

	public("GET /api/statistik/penduduk", h.StatistikGet)
	public("GET /api/statistik/penduduk/tren", h.StatistikTrenGet)
	csrfAdministrate("PUT /api/admin/statistik/penduduk/tren", h.StatistikTrenUpdate)
	csrfAdministrate("PUT /api/statistik/penduduk", h.StatistikUpdate)
	public("GET /api/apbdes", h.ApbdesGet)
	csrfAdministrate("PUT /api/apbdes", h.ApbdesUpdate)
	public("GET /api/agenda", h.AgendaList)
	csrfAdministrate("POST /api/agenda", h.AgendaCreate)
	csrfAdministrate("PUT /api/agenda/{id}", h.AgendaUpdate)
	csrfAdministrate("DELETE /api/agenda/{id}", h.AgendaDelete)

	public("GET /api/galeri", h.GaleriList)
	public("GET /api/galeri/{id}", h.GaleriGet)
	csrfAdministrate("POST /api/galeri", h.GaleriCreate)
	csrfAdministrate("PUT /api/galeri/{id}", h.GaleriUpdate)
	csrfAdministrate("DELETE /api/galeri/{id}", h.GaleriDelete)
	public("GET /api/umkm", h.UmkmList)
	public("GET /api/umkm/{slug}", h.UmkmGet)
	csrfAdministrate("POST /api/umkm", h.UmkmCreate)
	csrfAdministrate("PUT /api/umkm/{id}", h.UmkmUpdate)
	csrfAdministrate("DELETE /api/umkm/{id}", h.UmkmDelete)

	// Pembagian sembako — publik untuk transparansi, admin untuk pengelolaan.
	readLimited("GET /api/sembako", h.SembakoList)
	readLimited("GET /api/sembako/{id}", h.SembakoGet)
	csrfAdministrate("POST /api/admin/sembako", h.SembakoCreate)
	csrfAdministrate("PUT /api/admin/sembako/{id}", h.SembakoUpdate)
	csrfAdministrate("DELETE /api/admin/sembako/{id}", h.SembakoDelete)

	public("GET /api/pajak/ringkasan", h.PajakRingkasan)
	public("GET /api/pajak/jenis", h.PajakJenisList)
	public("GET /api/pajak/transaksi", h.PajakTransaksiPublicList)
	public("GET /api/pajak/transaksi/{nomorBukti}", h.PajakTransaksiGetNomor)
	public("GET /api/pajak/setoran", h.PajakSetoranList)
	public("GET /api/pajak/setoran/{id}", h.PajakSetoranGet)
	csrfSecure("GET /api/pajak/saya", h.PajakTransaksiSaya)

	csrfAdministrate("GET /api/admin/pajak/jenis", h.PajakJenisAdminList)
	csrfAdministrate("POST /api/admin/pajak/jenis", h.PajakJenisSave)
	csrfAdministrate("PUT /api/admin/pajak/jenis/{id}", h.PajakJenisSave)
	csrfAdministrate("DELETE /api/admin/pajak/jenis/{id}", h.PajakJenisDelete)

	csrfAdministrate("GET /api/admin/pajak/wajib-pajak", h.PajakWajibList)
	csrfAdministrate("GET /api/admin/pajak/wajib-pajak/{id}", h.PajakWajibGet)
	csrfAdministrate("POST /api/admin/pajak/wajib-pajak", h.PajakWajibSave)
	csrfAdministrate("PUT /api/admin/pajak/wajib-pajak/{id}", h.PajakWajibSave)
	csrfAdministrate("DELETE /api/admin/pajak/wajib-pajak/{id}", h.PajakWajibDelete)

	csrfAdministrate("GET /api/admin/pajak/transaksi", h.PajakTransaksiAdminList)
	csrfAdministrate("POST /api/admin/pajak/transaksi", h.PajakTransaksiCreate)
	csrfAdministrate("PATCH /api/admin/pajak/transaksi/{id}/status", h.PajakTransaksiStatus)

	csrfAdministrate("GET /api/admin/pajak/setoran", h.PajakSetoranList)
	csrfAdministrate("POST /api/admin/pajak/setoran", h.PajakSetoranCreate)
	csrfAdministrate("POST /api/admin/pajak/setoran/{id}/konfirmasi", h.PajakSetoranKonfirmasi)
	csrfAdministrate("GET /api/admin/pajak/audit", h.PajakAuditList)

	csrfSecure("GET /api/notifikasi", h.NotifikasiList)
	csrfSecure("GET /api/notifikasi/unread-count", h.NotifikasiCountUnread)
	csrfSecure("POST /api/notifikasi/{id}/read", h.NotifikasiMarkRead)
	csrfSecure("POST /api/notifikasi/mark-all-read", h.NotifikasiMarkAllRead)
	csrfSecure("GET /api/notifikasi/stream", h.NotifikasiStream)
	csrfAdministrate("GET /api/admin/analytics", h.AnalyticsDashboard)

	// Statistik pengunjung situs publik (per hari).
	// track = catat kunjungan (dedup per hash IP per hari); stats = ringkasan harian.
	public("GET /api/pengunjung", h.PengunjungStats)
	public("POST /api/pengunjung/track", h.PengunjungTrack)

	// Webhook FlowKirim — dipanggil oleh server FlowKirim (bukan browser),
	// sehingga tidak memerlukan autentikasi sesi atau CSRF token.
	public("POST /webhook/whatsapp", h.WebhookWhatsApp)

	return m
}
