// Package berita implements the berita (news) use cases.
package berita

import (
	"context"

	"desa-anabanua-api/internal/domain"
)

// ListFilter captures pagination / filtering for the news list.
type ListFilter struct {
	Kategori     string
	Search       string
	Page, Limit  int
	IncludeDraft bool
}

// Repository persists berita records.
type Repository interface {
	List(ctx context.Context, f ListFilter) ([]domain.Berita, int, error)
	GetByID(ctx context.Context, id string) (domain.Berita, error)
	GetBySlug(ctx context.Context, slug string) (domain.Berita, error)
	Create(ctx context.Context, b domain.Berita) error
	Update(ctx context.Context, b domain.Berita) error
	Delete(ctx context.Context, id string) error
	IncrementRead(ctx context.Context, id string) error
	ListKomentar(ctx context.Context, beritaID string) ([]domain.BeritaKomentar, error)
	CreateKomentar(ctx context.Context, k domain.BeritaKomentar) error
	DeleteKomentar(ctx context.Context, id string, userID *string) error
}
