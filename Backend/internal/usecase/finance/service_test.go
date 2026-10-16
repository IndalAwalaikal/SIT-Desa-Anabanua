package finance

import (
	"context"
	"testing"

	"desa-anabanua-api/internal/domain"
)

// ---- fakes (embed interface agar hanya metode yang dipakai perlu di-override) ----

type fakeStatistik struct {
	StatistikRepository
	byTahun     domain.StatistikPenduduk
	latest      domain.StatistikPenduduk
	upserted    domain.StatistikPenduduk
	tren        []domain.StatistikBulanan
	upsertTren  []domain.StatistikBulanan
	upsertTahun int
	getTrenNil  bool
}

func (f *fakeStatistik) GetByTahun(_ context.Context, _ int) (domain.StatistikPenduduk, error) {
	return f.byTahun, nil
}
func (f *fakeStatistik) GetLatest(_ context.Context) (domain.StatistikPenduduk, error) {
	return f.latest, nil
}
func (f *fakeStatistik) Upsert(_ context.Context, s domain.StatistikPenduduk) error {
	f.upserted = s
	return nil
}
func (f *fakeStatistik) GetTrenBulanan(_ context.Context, _ int) ([]domain.StatistikBulanan, error) {
	return f.tren, nil
}
func (f *fakeStatistik) UpsertTrenBulanan(_ context.Context, tahun int, rows []domain.StatistikBulanan) error {
	f.upsertTahun = tahun
	f.upsertTren = rows
	return nil
}

type fakeApbdes struct {
	ApbdesRepository
	items    []domain.ApbdesItem
	gotT     int
	replaced []domain.ApbdesItem
}

func (f *fakeApbdes) ListForPeriode(_ context.Context, tahun, _, _ int) ([]domain.ApbdesItem, error) {
	f.gotT = tahun
	return f.items, nil
}
func (f *fakeApbdes) ReplaceForPeriode(_ context.Context, _ int, _, _ int, items []domain.ApbdesItem) error {
	f.replaced = items
	return nil
}

// ---- tests ----

func TestGetStatistikByTahunVsLatest(t *testing.T) {
	st := &fakeStatistik{
		byTahun: domain.StatistikPenduduk{Tahun: 2020},
		latest:  domain.StatistikPenduduk{Tahun: 2026},
	}
	svc := NewService(st, &fakeApbdes{}, nil)

	if got, _ := svc.GetStatistik(context.Background(), 2020); got.Tahun != 2020 {
		t.Errorf("GetStatistik(2020).Tahun = %d, want 2020", got.Tahun)
	}
	if got, _ := svc.GetStatistik(context.Background(), 0); got.Tahun != 2026 {
		t.Errorf("GetStatistik(0).Tahun = %d, want fallback ke latest (2026)", got.Tahun)
	}
}

func TestUpdateTrenBulananValidation(t *testing.T) {
	st := &fakeStatistik{}
	svc := NewService(st, nil, nil)

	cases := []struct {
		name string
		rows []domain.StatistikBulanan
	}{
		{"bulan di luar rentang", []domain.StatistikBulanan{{Bulan: 13}}},
		{"bulan nol", []domain.StatistikBulanan{{Bulan: 0}}},
		{"bulan duplikat", []domain.StatistikBulanan{{Bulan: 1}, {Bulan: 1}}},
		{"angka negatif", []domain.StatistikBulanan{{Bulan: 2, Lahir: -1}}},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if err := svc.UpdateTrenBulanan(context.Background(), 2026, c.rows); err != domain.ErrValidation {
				t.Errorf("UpdateTrenBulanan() error = %v, want ErrValidation", err)
			}
		})
	}

	valid := []domain.StatistikBulanan{
		{Bulan: 1, Lahir: 3, Meninggal: 1, PindahMasuk: 2, PindahKeluar: 0},
		{Bulan: 12, Lahir: 0, Meninggal: 0, PindahMasuk: 1, PindahKeluar: 4},
	}
	if err := svc.UpdateTrenBulanan(context.Background(), 2026, valid); err != nil {
		t.Fatalf("UpdateTrenBulanan(valid) error = %v", err)
	}
	if st.upsertTahun != 2026 || len(st.upsertTren) != 2 {
		t.Errorf("upsert tidak dipanggil benar: tahun=%d rows=%d", st.upsertTahun, len(st.upsertTren))
	}
}

func TestGetTrenBulananNilData(t *testing.T) {
	st := &fakeStatistik{getTrenNil: true}
	svc := NewService(st, nil, nil)

	got, err := svc.GetTrenBulanan(context.Background(), 2026)
	if err != nil {
		t.Fatalf("GetTrenBulanan() error = %v", err)
	}
	if got.Data == nil || len(got.Data) != 0 {
		t.Error("Data harus slice kosong (bukan nil) agar tidak serialisasi null")
	}
}

func TestGetApbdesAggregatesAndPercentages(t *testing.T) {
	ap := &fakeApbdes{items: []domain.ApbdesItem{
		{Kategori: "pendapatan", SubKategori: "PADes", Jumlah: 100},
		{Kategori: "pendapatan", SubKategori: "DD", Jumlah: 100},
		{Kategori: "belanja", SubKategori: "Operasional", Jumlah: 60},
		{Kategori: "belanja", SubKategori: "Pembangunan", Jumlah: 40},
	}}
	svc := NewService(nil, ap, nil)

	got, err := svc.GetApbdes(context.Background(), 2026, 0, 0)
	if err != nil {
		t.Fatalf("GetApbdes() error = %v", err)
	}
	if got.TotalPendapatan != 200 {
		t.Errorf("TotalPendapatan = %v, want 200", got.TotalPendapatan)
	}
	if got.TotalBelanja != 100 {
		t.Errorf("TotalBelanja = %v, want 100", got.TotalBelanja)
	}
	if got.Items[0].Persentase != 50 {
		t.Errorf("Persentase item[0] = %v, want 50", got.Items[0].Persentase)
	}
	if got.Items[2].Persentase != 60 {
		t.Errorf("Persentase belanja item[2] = %v, want 60", got.Items[2].Persentase)
	}
}

func TestUpdateApbdesCleansAndTagsItems(t *testing.T) {
	ap := &fakeApbdes{items: []domain.ApbdesItem{}}
	svc := NewService(nil, ap, nil)

	_, err := svc.UpdateApbdes(context.Background(), 2026, 0, 0, []domain.ApbdesItem{
		{Kategori: "pendapatan", SubKategori: "PADes", Jumlah: 500},
		{Kategori: "belanja", SubKategori: "", Jumlah: 999}, // baris kosong → dibuang
	})
	if err != nil {
		t.Fatalf("UpdateApbdes() error = %v", err)
	}
	if len(ap.replaced) != 1 {
		t.Fatalf("baris tersimpan = %d, want 1 (baris tanpa subKategori dibuang)", len(ap.replaced))
	}
	if ap.replaced[0].Tahun != 2026 || ap.replaced[0].ID == "" {
		t.Errorf("item tidak ditandai tahun/ID: %+v", ap.replaced[0])
	}
}
