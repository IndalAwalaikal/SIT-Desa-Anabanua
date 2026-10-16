package sekilasinfo

import (
	"context"
	"time"

	"desa-anabanua-api/internal/domain"
	"desa-anabanua-api/internal/pkg/apputil"
)

type Service struct{ repo Repository }

func NewService(repo Repository) *Service { return &Service{repo: repo} }

// List returns all sekilas-info records (for admin panel).
func (s *Service) List(ctx context.Context) ([]domain.SekilasInfo, error) {
	return s.repo.List(ctx)
}

// ListActive returns only active sekilas-info records (for public display).
func (s *Service) ListActive(ctx context.Context) ([]domain.SekilasInfo, error) {
	return s.repo.ListActive(ctx)
}

func (s *Service) GetByID(ctx context.Context, id string) (domain.SekilasInfo, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) Create(ctx context.Context, info domain.SekilasInfo) (domain.SekilasInfo, error) {
	info.ID = apputil.NewID()
	info.CreatedAt = time.Now()
	info.UpdatedAt = time.Now()
	if err := s.repo.Create(ctx, info); err != nil {
		return info, err
	}
	return info, nil
}

func (s *Service) Update(ctx context.Context, id string, info domain.SekilasInfo) (domain.SekilasInfo, error) {
	cur, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return cur, err
	}
	cur.Konten = info.Konten
	cur.Aktif = info.Aktif
	cur.UpdatedAt = time.Now()
	if err := s.repo.Update(ctx, cur); err != nil {
		return cur, err
	}
	return cur, nil
}

func (s *Service) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
