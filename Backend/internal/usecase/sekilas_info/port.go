// Package sekilasinfo implements the sekilas-info (quick-info ticker) use cases.
package sekilasinfo

import (
	"context"

	"desa-anabanua-api/internal/domain"
)

// Repository persists sekilas-info records.
type Repository interface {
	List(ctx context.Context) ([]domain.SekilasInfo, error)
	ListActive(ctx context.Context) ([]domain.SekilasInfo, error)
	GetByID(ctx context.Context, id string) (domain.SekilasInfo, error)
	Create(ctx context.Context, s domain.SekilasInfo) error
	Update(ctx context.Context, s domain.SekilasInfo) error
	Delete(ctx context.Context, id string) error
}
