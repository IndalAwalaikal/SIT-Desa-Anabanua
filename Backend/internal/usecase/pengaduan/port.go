// Package pengaduan implements the complaint use cases.
package pengaduan

import (
	"context"

	"desa-anabanua-api/internal/domain"
)

// Repository persists complaints.
type Repository interface {
	Create(ctx context.Context, p domain.Pengaduan) error
	GetByNomorTiket(ctx context.Context, tiket string) (domain.Pengaduan, error)
	GetByID(ctx context.Context, id string) (domain.Pengaduan, error)
	ListByPelapor(ctx context.Context, pelaporID string) ([]domain.Pengaduan, error)
	ListByPelaporPage(ctx context.Context, pelaporID string, page, limit int) ([]domain.Pengaduan, int, error)
	ListAll(ctx context.Context, status string) ([]domain.Pengaduan, error)
	ListPage(ctx context.Context, status, search, sort string, page, limit int) ([]domain.Pengaduan, int, error)
	CountByStatus(ctx context.Context) (map[string]int, error)
	Update(ctx context.Context, p domain.Pengaduan) error
}
