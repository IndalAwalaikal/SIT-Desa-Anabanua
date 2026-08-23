// Package sembako implements the pembagian-sembako use cases.
package sembako

import (
	"context"

	"desa-borong-api/internal/domain"
	"desa-borong-api/internal/pkg/apputil"
)

// Repository persists sembako periods and their items.
type Repository interface {
	List(ctx context.Context) ([]domain.SembakoPeriod, error)
	Get(ctx context.Context, id string) (domain.SembakoPeriod, error)
	Create(ctx context.Context, p domain.SembakoPeriod) error
	Update(ctx context.Context, p domain.SembakoPeriod) error
	Delete(ctx context.Context, id string) error
}

type Service struct{ repo Repository }

func NewService(repo Repository) *Service { return &Service{repo: repo} }

// List returns all periods (newest start date first) with their items attached.
func (s *Service) List(ctx context.Context) ([]domain.SembakoPeriod, error) {
	return s.repo.List(ctx)
}

func (s *Service) Get(ctx context.Context, id string) (domain.SembakoPeriod, error) {
	return s.repo.Get(ctx, id)
}

func (s *Service) Create(ctx context.Context, p domain.SembakoPeriod) (domain.SembakoPeriod, error) {
	p.ID = apputil.NewID()
	if err := s.repo.Create(ctx, p); err != nil {
		return p, err
	}
	return p, nil
}

func (s *Service) Update(ctx context.Context, id string, p domain.SembakoPeriod) (domain.SembakoPeriod, error) {
	p.ID = id
	if err := s.repo.Update(ctx, p); err != nil {
		return p, err
	}
	return s.repo.Get(ctx, id)
}

func (s *Service) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
