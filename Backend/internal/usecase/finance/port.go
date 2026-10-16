// Package finance implements statistik penduduk, APBDes & agenda use cases.
package finance

import (
	"context"

	"desa-anabanua-api/internal/domain"
)

// StatistikRepository persists statistik penduduk (per-tahun JSON document).
type StatistikRepository interface {
	GetByTahun(ctx context.Context, tahun int) (domain.StatistikPenduduk, error)
	GetLatest(ctx context.Context) (domain.StatistikPenduduk, error)
	Upsert(ctx context.Context, s domain.StatistikPenduduk) error
	GetTrenBulanan(ctx context.Context, tahun int) ([]domain.StatistikBulanan, error)
	// UpsertTrenBulanan replaces every monthly row for the given year with the
	// supplied set (caller supplies all 12 rows). Bulan must be 1..12.
	UpsertTrenBulanan(ctx context.Context, tahun int, rows []domain.StatistikBulanan) error
}

// ApbdesRepository persists APBDes line items per periode (tahun/bulan/triwulan).
// Bulan=0 & triwulan=0 berarti periode "tahunan" (baris tanpa bulan & triwulan).
type ApbdesRepository interface {
	ListForPeriode(ctx context.Context, tahun, bulan, triwulan int) ([]domain.ApbdesItem, error)
	ReplaceForPeriode(ctx context.Context, tahun, bulan, triwulan int, items []domain.ApbdesItem) error
}

// AgendaRepository persists agenda/kegiatan records.
type AgendaRepository interface {
	List(ctx context.Context, tahun int) ([]domain.AgendaKegiatan, error)
	GetByID(ctx context.Context, id string) (domain.AgendaKegiatan, error)
	Create(ctx context.Context, a domain.AgendaKegiatan) error
	Update(ctx context.Context, a domain.AgendaKegiatan) error
	Delete(ctx context.Context, id string) error
}
