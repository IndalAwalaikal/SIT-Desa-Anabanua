package galeri

import (
	"context"
	"fmt"

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

func (s *Service) List(ctx context.Context) ([]domain.GaleriAlbum, error) {
	return s.repo.List(ctx)
}

func (s *Service) ListPreview(ctx context.Context, limit int) ([]domain.GaleriAlbum, error) {
	return s.repo.ListPreview(ctx, limit)
}

func (s *Service) GetByID(ctx context.Context, id string) (domain.GaleriAlbum, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) Create(ctx context.Context, album domain.GaleriAlbum) (domain.GaleriAlbum, error) {
	album.ID = apputil.NewID()
	for i := range album.Fotos {
		if album.Fotos[i].ID == "" {
			album.Fotos[i].ID = apputil.NewID()
		}
	}
	if err := s.repo.Create(ctx, album); err != nil {
		return album, err
	}
	// Notify admins of new galeri album.
	if s.notif != nil {
		_ = s.notif.BroadcastToAdmins(ctx, "Galeri Baru",
			fmt.Sprintf("Foto galeri baru: \"%s\".", album.Judul),
			"/galeri")
	}
	return album, nil
}

func (s *Service) Update(ctx context.Context, id string, album domain.GaleriAlbum) (domain.GaleriAlbum, error) {
	cur, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return cur, err
	}
	if album.Judul != "" {
		cur.Judul = album.Judul
	}
	if album.Deskripsi != "" {
		cur.Deskripsi = album.Deskripsi
	}
	if album.Tanggal != "" {
		cur.Tanggal = album.Tanggal
	}
	cur.Kategori = album.Kategori
	if album.CoverFoto != "" {
		cur.CoverFoto = album.CoverFoto
	}
	if album.Fotos != nil {
		for i := range album.Fotos {
			if album.Fotos[i].ID == "" {
				album.Fotos[i].ID = apputil.NewID()
			}
		}
		cur.Fotos = album.Fotos
	}
	if err := s.repo.Update(ctx, cur); err != nil {
		return cur, err
	}
	return cur, nil
}

func (s *Service) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
