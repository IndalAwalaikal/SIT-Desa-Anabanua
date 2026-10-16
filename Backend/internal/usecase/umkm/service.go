package umkm

import (
	"context"
	"strings"
	"time"

	"desa-anabanua-api/internal/domain"
	"desa-anabanua-api/internal/pkg/apputil"
)

type Service struct{ repo Repository }

func NewService(repo Repository) *Service { return &Service{repo: repo} }

func (s *Service) List(ctx context.Context, kategori string, limit int) ([]domain.Umkm, error) {
	return s.repo.List(ctx, strings.TrimSpace(kategori), limit)
}

func (s *Service) GetBySlug(ctx context.Context, slug string) (domain.Umkm, error) {
	return s.repo.GetBySlug(ctx, slug)
}

func (s *Service) Create(ctx context.Context, u domain.Umkm) (domain.Umkm, error) {
	u.ID = apputil.NewID()
	u.Slug = apputil.Slug(u.NamaUsaha) + "-" + time.Now().Format("0601")
	if u.Foto == nil {
		u.Foto = []string{}
	}
	if u.ProdukUnggulan == nil {
		u.ProdukUnggulan = []string{}
	}
	if err := s.repo.Create(ctx, u); err != nil {
		return u, err
	}
	return u, nil
}

func (s *Service) Update(ctx context.Context, id string, u domain.Umkm) (domain.Umkm, error) {
	cur, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return cur, err
	}
	if u.NamaUsaha != "" {
		cur.NamaUsaha = u.NamaUsaha
		cur.Slug = apputil.Slug(u.NamaUsaha) + "-" + cur.ID[len(cur.ID)-4:]
	}
	if u.Pemilik != "" {
		cur.Pemilik = u.Pemilik
	}
	if u.Kategori != "" {
		cur.Kategori = u.Kategori
	}
	if u.Deskripsi != "" {
		cur.Deskripsi = u.Deskripsi
	}
	if u.Foto != nil {
		cur.Foto = u.Foto
	}
	if u.Kontak != "" {
		cur.Kontak = u.Kontak
	}
	if u.Alamat != "" {
		cur.Alamat = u.Alamat
	}
	if u.ProdukUnggulan != nil {
		cur.ProdukUnggulan = u.ProdukUnggulan
	}
	cur.JamOperasional = u.JamOperasional
	if err := s.repo.Update(ctx, cur); err != nil {
		return cur, err
	}
	return cur, nil
}

func (s *Service) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
