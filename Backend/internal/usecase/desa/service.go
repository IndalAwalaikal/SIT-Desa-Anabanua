package desa

import (
	"context"
	"strings"

	"desa-anabanua-api/internal/domain"
	"desa-anabanua-api/internal/pkg/apputil"
)

type Service struct {
	profil    ProfilRepository
	perangkat PerangkatRepository
	dusun     DusunRepository
	potensi   PotensiRepository
	fasilitas FasilitasRepository
}

func NewService(profil ProfilRepository, perangkat PerangkatRepository, dusun DusunRepository, potensi PotensiRepository, fasilitas FasilitasRepository) *Service {
	return &Service{profil: profil, perangkat: perangkat, dusun: dusun, potensi: potensi, fasilitas: fasilitas}
}

func (s *Service) GetProfil(ctx context.Context) (domain.ProfilDesa, error) {
	return s.profil.Get(ctx)
}

func (s *Service) UpdateProfil(ctx context.Context, p domain.ProfilDesa) (domain.ProfilDesa, error) {
	if err := s.profil.Upsert(ctx, p); err != nil {
		return p, err
	}
	return p, nil
}

func (s *Service) ListPerangkat(ctx context.Context) ([]domain.PerangkatDesa, error) {
	return s.perangkat.List(ctx)
}

func (s *Service) CreatePerangkat(ctx context.Context, p domain.PerangkatDesa) (domain.PerangkatDesa, error) {
	p.ID = apputil.NewID()
	if err := s.perangkat.Create(ctx, p); err != nil {
		return p, err
	}
	return p, nil
}

func (s *Service) UpdatePerangkat(ctx context.Context, id string, p domain.PerangkatDesa) (domain.PerangkatDesa, error) {
	p.ID = id
	if err := s.perangkat.Update(ctx, p); err != nil {
		return p, err
	}
	return p, nil
}

func (s *Service) DeletePerangkat(ctx context.Context, id string) error {
	return s.perangkat.Delete(ctx, id)
}

func (s *Service) ListDusun(ctx context.Context) ([]domain.Dusun, error) {
	return s.dusun.List(ctx)
}

func (s *Service) ListPotensi(ctx context.Context) ([]domain.PotensiDesa, error) {
	return s.potensi.List(ctx)
}

func (s *Service) ListFasilitas(ctx context.Context, kategori string) ([]domain.FasilitasDesa, error) {
	return s.fasilitas.List(ctx, strings.TrimSpace(kategori))
}

func (s *Service) CreateFasilitas(ctx context.Context, f domain.FasilitasDesa) (domain.FasilitasDesa, error) {
	f.ID = apputil.NewID()
	if err := s.fasilitas.Create(ctx, f); err != nil {
		return f, err
	}
	return f, nil
}

func (s *Service) UpdateFasilitas(ctx context.Context, id string, f domain.FasilitasDesa) (domain.FasilitasDesa, error) {
	f.ID = id
	if err := s.fasilitas.Update(ctx, f); err != nil {
		return f, err
	}
	return f, nil
}

func (s *Service) DeleteFasilitas(ctx context.Context, id string) error {
	return s.fasilitas.Delete(ctx, id)
}
