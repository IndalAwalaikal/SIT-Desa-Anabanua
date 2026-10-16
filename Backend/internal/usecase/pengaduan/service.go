package pengaduan

import (
	"context"
	"fmt"
	"strings"
	"time"

	"desa-anabanua-api/internal/domain"
	"desa-anabanua-api/internal/pkg/apputil"
	"desa-anabanua-api/internal/usecase/notifikasi"
)

type Service struct {
	repo  Repository
	notif *notifikasi.Service
}

func NewService(repo Repository, notif *notifikasi.Service) *Service {
	return &Service{repo: repo, notif: notif}
}

func (s *Service) Submit(ctx context.Context, pelapor domain.User, kategori, judul, deskripsi, lokasi string) (domain.Pengaduan, error) {
	p := domain.Pengaduan{
		ID:         apputil.NewID(),
		NomorTiket: apputil.Tiket(),
		PelaporID:  pelapor.ID,
		Kategori:   kategori,
		Judul:      judul,
		Deskripsi:  deskripsi,
		Status:     domain.PengaduanDiterima,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}
	if v := strings.TrimSpace(lokasi); v != "" {
		p.Lokasi = &v
	}
	if err := s.repo.Create(ctx, p); err != nil {
		return p, err
	}
	// Notify admins of new complaint submission.
	if s.notif != nil {
		_ = s.notif.BroadcastToAdmins(ctx, "Pengaduan Baru",
			fmt.Sprintf("Pengaduan baru dari %s (resi: %s): \"%s\".", pelapor.Nama, p.NomorTiket, judul),
			"/admin/pengaduan")
	}
	return p, nil
}

func (s *Service) GetByTiket(ctx context.Context, tiket string) (domain.Pengaduan, error) {
	return s.repo.GetByNomorTiket(ctx, strings.ToUpper(strings.TrimSpace(tiket)))
}

func (s *Service) ListByPelapor(ctx context.Context, pelaporID string) ([]domain.Pengaduan, error) {
	return s.repo.ListByPelapor(ctx, pelaporID)
}

func (s *Service) ListByPelaporPage(ctx context.Context, pelaporID string, page, limit int) ([]domain.Pengaduan, int, error) {
	return s.repo.ListByPelaporPage(ctx, pelaporID, page, limit)
}

func (s *Service) ListAll(ctx context.Context, status string) ([]domain.Pengaduan, error) {
	return s.repo.ListAll(ctx, strings.TrimSpace(status))
}

func (s *Service) ListPage(ctx context.Context, status, search, sort string, page, limit int) ([]domain.Pengaduan, int, error) {
	return s.repo.ListPage(ctx, strings.TrimSpace(status), strings.TrimSpace(search), sort, page, limit)
}

func (s *Service) CountByStatus(ctx context.Context) (map[string]int, error) {
	return s.repo.CountByStatus(ctx)
}

func (s *Service) Respond(ctx context.Context, id string, status domain.StatusPengaduan, tanggapan string, changedBy *string) (domain.Pengaduan, error) {
	cur, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return cur, err
	}
	cur.Status = status
	cur.ChangedBy = changedBy
	if v := strings.TrimSpace(tanggapan); v != "" {
		cur.TanggapanAdmin = &v
	}
	cur.UpdatedAt = time.Now()
	if err := s.repo.Update(ctx, cur); err != nil {
		return cur, err
	}
	return cur, nil
}
