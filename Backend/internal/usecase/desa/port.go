// Package desa implements profil desa, perangkat, dusun, potensi & fasilitas.
package desa

import (
	"context"

	"desa-anabanua-api/internal/domain"
)

// ProfilRepository stores the singleton profil desa JSON document.
type ProfilRepository interface {
	Get(ctx context.Context) (domain.ProfilDesa, error)
	Upsert(ctx context.Context, p domain.ProfilDesa) error
}

// PerangkatRepository manages the aparatur list.
type PerangkatRepository interface {
	List(ctx context.Context) ([]domain.PerangkatDesa, error)
	Create(ctx context.Context, p domain.PerangkatDesa) error
	Update(ctx context.Context, p domain.PerangkatDesa) error
	Delete(ctx context.Context, id string) error
}

// DusunRepository lists administrative dusun.
type DusunRepository interface {
	List(ctx context.Context) ([]domain.Dusun, error)
}

// PotensiRepository lists village potentials.
type PotensiRepository interface {
	List(ctx context.Context) ([]domain.PotensiDesa, error)
}

// FasilitasRepository manages fasilitas desa.
type FasilitasRepository interface {
	List(ctx context.Context, kategori string) ([]domain.FasilitasDesa, error)
	GetByID(ctx context.Context, id string) (domain.FasilitasDesa, error)
	Create(ctx context.Context, f domain.FasilitasDesa) error
	Update(ctx context.Context, f domain.FasilitasDesa) error
	Delete(ctx context.Context, id string) error
}
