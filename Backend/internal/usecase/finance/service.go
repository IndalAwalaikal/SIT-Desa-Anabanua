package finance

import (
	"context"
	"time"

	"desa-anabanua-api/internal/domain"
	"desa-anabanua-api/internal/pkg/apputil"
)

type Service struct {
	statistik StatistikRepository
	apbdes    ApbdesRepository
	agenda    AgendaRepository
}

func NewService(statistik StatistikRepository, apbdes ApbdesRepository, agenda AgendaRepository) *Service {
	return &Service{statistik: statistik, apbdes: apbdes, agenda: agenda}
}

// ---- Statistik ----

func (s *Service) GetStatistik(ctx context.Context, tahun int) (domain.StatistikPenduduk, error) {
	if tahun > 0 {
		return s.statistik.GetByTahun(ctx, tahun)
	}
	return s.statistik.GetLatest(ctx)
}

// UpdateTrenBulanan validates and persists the per-month demographic trend for a
// year using replace semantics (caller supplies all 12 months).
// Bulan must be in 1..12 and unique; all counters must be non-negative.
func (s *Service) UpdateTrenBulanan(ctx context.Context, tahun int, rows []domain.StatistikBulanan) error {
	if tahun < 1 {
		tahun = time.Now().Year()
	}
	seen := make(map[int]bool, len(rows))
	for _, b := range rows {
		if b.Bulan < 1 || b.Bulan > 12 || seen[b.Bulan] {
			return domain.ErrValidation
		}
		if b.Lahir < 0 || b.Meninggal < 0 || b.PindahMasuk < 0 || b.PindahKeluar < 0 {
			return domain.ErrValidation
		}
		seen[b.Bulan] = true
	}
	return s.statistik.UpsertTrenBulanan(ctx, tahun, rows)
}
func (s *Service) GetTrenBulanan(ctx context.Context, tahun int) (domain.StatistikTrenBulanan, error) {
	if tahun < 1 {
		tahun = time.Now().Year()
	}
	data, err := s.statistik.GetTrenBulanan(ctx, tahun)
	if err != nil {
		return domain.StatistikTrenBulanan{}, err
	}
	if data == nil {
		data = []domain.StatistikBulanan{}
	}
	return domain.StatistikTrenBulanan{Tahun: tahun, Data: data}, nil
}

func (s *Service) UpdateStatistik(ctx context.Context, st domain.StatistikPenduduk) (domain.StatistikPenduduk, error) {
	st.Tahun = int(st.Data.Tahun)
	if st.Tahun == 0 {
		st.Tahun = time.Now().Year()
	}
	if err := s.statistik.Upsert(ctx, st); err != nil {
		return st, err
	}
	return st, nil
}

// ---- APBDes ----

func (s *Service) GetApbdes(ctx context.Context, tahun, bulan, triwulan int) (domain.ApbdesRingkasan, error) {
	if tahun < 1 {
		tahun = time.Now().Year()
	}
	items, err := s.apbdes.ListForPeriode(ctx, tahun, bulan, triwulan)
	if err != nil {
		return domain.ApbdesRingkasan{}, err
	}
	var income, spend float64
	for _, it := range items {
		if it.Kategori == "pendapatan" {
			income += it.Jumlah
		} else {
			spend += it.Jumlah
		}
	}
	ringkasan := domain.ApbdesRingkasan{
		Tahun: tahun, Bulan: bulan, Triwulan: triwulan,
		TotalPendapatan: income, TotalBelanja: spend, Items: items,
	}
	computePercentages(&ringkasan)
	return ringkasan, nil
}

func (s *Service) UpdateApbdes(ctx context.Context, tahun, bulan, triwulan int, items []domain.ApbdesItem) (domain.ApbdesRingkasan, error) {
	if tahun < 1 {
		tahun = time.Now().Year()
	}
	for i := range items {
		items[i].Tahun = tahun
		items[i].ID = apputil.NewID()
	}
	// Replace baris untuk periode tsb, lalu hitung ulang total.
	cleaned := []domain.ApbdesItem{}
	for _, it := range items {
		if it.SubKategori != "" {
			cleaned = append(cleaned, it)
		}
	}
	if err := s.apbdes.ReplaceForPeriode(ctx, tahun, bulan, triwulan, cleaned); err != nil {
		return domain.ApbdesRingkasan{}, err
	}
	return s.GetApbdes(ctx, tahun, bulan, triwulan)
}

func computePercentages(r *domain.ApbdesRingkasan) {
	for i := range r.Items {
		total := r.TotalBelanja
		if r.Items[i].Kategori == "pendapatan" {
			total = r.TotalPendapatan
		}
		if total > 0 {
			r.Items[i].Persentase = r.Items[i].Jumlah * 100 / total
		} else {
			r.Items[i].Persentase = 0
		}
	}
}

// ---- Agenda ----

func (s *Service) ListAgenda(ctx context.Context, tahun int) ([]domain.AgendaKegiatan, error) {
	return s.agenda.List(ctx, tahun)
}

func (s *Service) CreateAgenda(ctx context.Context, a domain.AgendaKegiatan) (domain.AgendaKegiatan, error) {
	a.ID = apputil.NewID()
	if err := s.agenda.Create(ctx, a); err != nil {
		return a, err
	}
	return a, nil
}

func (s *Service) UpdateAgenda(ctx context.Context, id string, a domain.AgendaKegiatan) (domain.AgendaKegiatan, error) {
	cur, err := s.agenda.GetByID(ctx, id)
	if err != nil {
		return cur, err
	}
	if a.Judul != "" {
		cur.Judul = a.Judul
	}
	if a.Deskripsi != "" {
		cur.Deskripsi = a.Deskripsi
	}
	if !a.TanggalMulai.IsZero() {
		cur.TanggalMulai = a.TanggalMulai
	}
	cur.TanggalSelesai = a.TanggalSelesai
	if a.Lokasi != "" {
		cur.Lokasi = a.Lokasi
	}
	if a.Penyelenggara != "" {
		cur.Penyelenggara = a.Penyelenggara
	}
	if a.Kategori != "" {
		cur.Kategori = a.Kategori
	}
	if err := s.agenda.Update(ctx, cur); err != nil {
		return cur, err
	}
	return cur, nil
}

func (s *Service) DeleteAgenda(ctx context.Context, id string) error {
	return s.agenda.Delete(ctx, id)
}
