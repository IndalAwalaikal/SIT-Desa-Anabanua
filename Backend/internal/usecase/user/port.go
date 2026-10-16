// Package user implements admin user-management use cases (role, status).
package user

import (
	"context"

	"desa-anabanua-api/internal/domain"
)

// Repository exposes user records for administration.
type Repository interface {
	ListAll(ctx context.Context) ([]domain.User, error)
	ListPage(ctx context.Context, search string, page, limit int) ([]domain.User, int, error)
	GetByID(ctx context.Context, id string) (domain.User, error)
	UpdateRole(ctx context.Context, id string, role domain.Role, isActive bool) error
}
