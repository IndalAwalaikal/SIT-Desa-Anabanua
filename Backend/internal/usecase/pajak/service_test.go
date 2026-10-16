package pajak

import (
	"context"
	"testing"
	"time"

	"desa-anabanua-api/internal/domain"
)

// ---- fake (embed interface nil; hanya metode yang dipakai di-override) ----

type fakeRepo struct {
	Repository
	jenis            []domain.JenisPajak
	jenisDipakai     bool
	transaksi        map[string]domain.TransaksiPajak
	setoranCount     int
	createdSetoran   *domain.SetoranPajak
	createdDetil     []SetoranDetil
	confirmedSetoran *domain.SetoranPajak
	confirmedDetil   []SetoranDetil
	auditCount       int
	ringkasanTahun   int
}

func (f *fakeRepo) ListJenisPajak(_ context.Context, _ bool) ([]domain.JenisPajak, error) {
	return f.jenis, nil
}
func (f *fakeRepo) CreateJenisPajak(_ context.Context, jp domain.JenisPajak) error {
	f.jenis = append(f.jenis, jp)
	return nil
}
func (f *fakeRepo) JenisPajakDipakai(context.Context, string) (bool, error) {
	return f.jenisDipakai, nil
}
func (f *fakeRepo) DeleteJenisPajak(context.Context, string) error { return nil }

func (f *fakeRepo) GetTransaksi(_ context.Context, id string) (domain.TransaksiPajak, error) {
	t, ok := f.transaksi[id]
	if !ok {
		return domain.TransaksiPajak{}, domain.ErrNotFound
	}
	return t, nil
}
func (f *fakeRepo) CountSetoranTahun(context.Context, int) (int, error) { return f.setoranCount, nil }
func (f *fakeRepo) CreateSetoran(_ context.Context, s domain.SetoranPajak, detil []SetoranDetil) error {
	f.createdSetoran = &s
	f.createdDetil = detil
	return nil
}
func (f *fakeRepo) GetSetoran(_ context.Context, id string) (domain.SetoranPajak, error) {
	if f.confirmedSetoran != nil && f.confirmedSetoran.ID == id {
		return *f.confirmedSetoran, nil
	}
	if f.createdSetoran != nil && f.createdSetoran.ID == id {
		return *f.createdSetoran, nil
	}
	return domain.SetoranPajak{}, domain.ErrNotFound
}
func (f *fakeRepo) AppendAudit(context.Context, domain.AuditLogPajak) error {
	f.auditCount++
	return nil
}
func (f *fakeRepo) GetTransaksiBySetoran(_ context.Context, _ string) ([]domain.TransaksiPajak, error) {
	items := []domain.TransaksiPajak{}
	for _, t := range f.transaksi {
		if t.SetoranID != "" {
			items = append(items, t)
		}
	}
	return items, nil
}
func (f *fakeRepo) ConfirmSetoran(_ context.Context, s domain.SetoranPajak, detil []SetoranDetil) error {
	f.confirmedSetoran = &s
	f.confirmedDetil = detil
	return nil
}
func (f *fakeRepo) Ringkasan(_ context.Context, tahun int) (domain.RingkasanPajak, error) {
	f.ringkasanTahun = tahun
	return domain.RingkasanPajak{Tahun: tahun}, nil
}

// ---- tests: master jenis pajak ----

func TestNomorUrut(t *testing.T) {
	if got := nomorUrut("ST", 2026, 42); got != "ST-2026-00042" {
		t.Errorf("nomorUrut() = %q, want ST-2026-00042", got)
	}
}

func TestSaveJenisPajakCreateDefaults(t *testing.T) {
	repo := &fakeRepo{}
	svc := NewService(repo)

	jp, err := svc.SaveJenisPajak(context.Background(), "", domain.JenisPajak{
		Kode: "  pbb ", Nama: " PBB Desa ",
	})
	if err != nil {
		t.Fatalf("SaveJenisPajak() error = %v", err)
	}
	if jp.Kode != "PBB" {
		t.Errorf("Kode = %q, want 'PBB' (uppercase + trimmed)", jp.Kode)
	}
	if jp.Kategori != "lainnya" || jp.Periode != "TAHUNAN" {
		t.Errorf("default kategori/periode = %q/%q, want lainnya/TAHUNAN", jp.Kategori, jp.Periode)
	}
	if !jp.Aktif || jp.ID == "" {
		t.Error("jenis pajak baru harus Aktif dan punya ID")
	}
}

func TestSaveJenisPajakValidationAndConflict(t *testing.T) {
	repo := &fakeRepo{jenis: []domain.JenisPajak{{ID: "j-1", Kode: "PBB"}}}
	svc := NewService(repo)

	cases := []struct {
		name string
		in   domain.JenisPajak
		want error
	}{
		{"kode terlalu pendek", domain.JenisPajak{Kode: "P", Nama: "Nama"}, domain.ErrValidation},
		{"nama kosong", domain.JenisPajak{Kode: "ABC"}, domain.ErrValidation},
		{"kode duplikat", domain.JenisPajak{Kode: "pbb", Nama: "Baru"}, domain.ErrConflict},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if _, err := svc.SaveJenisPajak(context.Background(), "", c.in); err != c.want {
				t.Errorf("SaveJenisPajak() error = %v, want %v", err, c.want)
			}
		})
	}
}

func TestDeleteJenisPajakInUse(t *testing.T) {
	repo := &fakeRepo{jenisDipakai: true}
	svc := NewService(repo)

	if err := svc.DeleteJenisPajak(context.Background(), "j-1"); err != domain.ErrConflict {
		t.Errorf("DeleteJenisPajak() error = %v, want ErrConflict saat masih dipakai", err)
	}
}

// ---- tests: setoran ----

func TestCreateSetoranValidation(t *testing.T) {
	svc := NewService(&fakeRepo{})

	cases := []struct {
		name string
		in   SetoranInput
	}{
		{"tujuan kosong", SetoranInput{TransaksiIDs: []string{"t-1"}}},
		{"tanpa transaksi", SetoranInput{Tujuan: "BPD"}},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if _, err := svc.CreateSetoran(context.Background(), "admin", "Admin", c.in); err != domain.ErrValidation {
				t.Errorf("CreateSetoran() error = %v, want ErrValidation", err)
			}
		})
	}
}

func TestCreateSetoranStatusHarusDiverifikasi(t *testing.T) {
	repo := &fakeRepo{transaksi: map[string]domain.TransaksiPajak{
		"t-1": {ID: "t-1", Status: domain.StatusPajakTercatat, Nominal: 100000},
	}}
	svc := NewService(repo)

	_, err := svc.CreateSetoran(context.Background(), "admin", "Admin",
		SetoranInput{Tujuan: "BPD", TransaksiIDs: []string{"t-1"}})
	if err != domain.ErrInvalidState {
		t.Errorf("CreateSetoran() error = %v, want ErrInvalidState untuk transaksi belum diverifikasi", err)
	}
}

func TestCreateSetoranSuccess(t *testing.T) {
	repo := &fakeRepo{
		transaksi: map[string]domain.TransaksiPajak{
			"t-1": {ID: "t-1", Status: domain.StatusPajakDiverifikasi, Nominal: 150000},
			"t-2": {ID: "t-2", Status: domain.StatusPajakDiverifikasi, Nominal: 250000},
		},
		setoranCount: 41,
	}
	svc := NewService(repo)

	in := SetoranInput{
		Tujuan:       " BPD Kabupaten ",
		TanggalSetor: time.Date(2026, 8, 25, 0, 0, 0, 0, time.UTC),
		Catatan:      " setoran Agustus ",
		// t-1 sengaja diduplikasi — harus di-deduplicate.
		TransaksiIDs: []string{"t-1", "t-2", "t-1"},
	}
	got, err := svc.CreateSetoran(context.Background(), "admin-1", "Admin Desa", in)
	if err != nil {
		t.Fatalf("CreateSetoran() error = %v", err)
	}

	if got.NomorSetoran != "ST-2026-00042" {
		t.Errorf("NomorSetoran = %q, want ST-2026-00042 (seq 41+1)", got.NomorSetoran)
	}
	if got.Tujuan != "BPD Kabupaten" || got.Catatan != "setoran Agustus" {
		t.Errorf("trim gagal: tujuan=%q catatan=%q", got.Tujuan, got.Catatan)
	}
	if got.TotalSetor != 400000 {
		t.Errorf("TotalSetor = %v, want 400000 (duplikat tidak dihitung dua kali)", got.TotalSetor)
	}
	if len(repo.createdDetil) != 2 {
		t.Fatalf("detil = %d entri, want 2 (deduplicated)", len(repo.createdDetil))
	}
	for _, d := range repo.createdDetil {
		if d.Transaksi.Status != domain.StatusPajakDisetor || d.Transaksi.SetoranID != got.ID {
			t.Errorf("transaksi %s tidak berpindah ke 'disetor': %+v", d.Transaksi.ID, d.Transaksi)
		}
		if d.Audit.StatusBaru != "disetor" {
			t.Errorf("audit StatusBaru = %q, want 'disetor'", d.Audit.StatusBaru)
		}
	}
	if repo.auditCount < 1 {
		t.Error("audit setoran harus dicatat")
	}
}

func TestKonfirmasiSetoranSuccess(t *testing.T) {
	setoran := domain.SetoranPajak{ID: "s-1", Status: domain.StatusSetoranDisetor}
	repo := &fakeRepo{
		transaksi: map[string]domain.TransaksiPajak{
			"t-1": {ID: "t-1", Status: domain.StatusPajakDisetor, SetoranID: "s-1"},
		},
	}
	svc := NewService(repo)
	// Suntikkan setoran awal lewat GetSetoran fake.
	repo.confirmedSetoran = nil
	repo.createdSetoran = &setoran

	got, err := svc.KonfirmasiSetoran(context.Background(), "admin-1", "s-1", " BPD/2026/09 ", " Bendahara BPD ", " ok ")
	if err != nil {
		t.Fatalf("KonfirmasiSetoran() error = %v", err)
	}
	if got.Status != domain.StatusSetoranDikonfirmasi {
		t.Errorf("Status = %q, want %q", got.Status, domain.StatusSetoranDikonfirmasi)
	}
	if got.NomorBuktiPenerimaan != "BPD/2026/09" {
		t.Errorf("NomorBuktiPenerimaan = %q, want trimmed", got.NomorBuktiPenerimaan)
	}
	if got.TglKonfirmasi == nil {
		t.Error("TglKonfirmasi harus terisi")
	}
	if len(repo.confirmedDetil) != 1 {
		t.Fatalf("detil konfirmasi = %d entri, want 1", len(repo.confirmedDetil))
	}
	d := repo.confirmedDetil[0]
	if d.Transaksi.Status != domain.StatusPajakDikonfirmasi {
		t.Errorf("transaksi %s status = %q, want %q", d.Transaksi.ID, d.Transaksi.Status, domain.StatusPajakDikonfirmasi)
	}
	if d.Audit.StatusBaru != "dikonfirmasi_bpd" {
		t.Errorf("audit StatusBaru = %q, want 'dikonfirmasi_bpd'", d.Audit.StatusBaru)
	}
}

func TestKonfirmasiSetoranInvalidState(t *testing.T) {
	repo := &fakeRepo{}
	svc := NewService(repo)
	_ = repo // GetSetoran default → ErrNotFound

	if _, err := svc.KonfirmasiSetoran(context.Background(), "a", "tidak-ada", "NOMOR", "x", ""); err != domain.ErrNotFound {
		t.Errorf("KonfirmasiSetoran() error = %v, want ErrNotFound", err)
	}

	// Setoran yang sudah dikonfirmasi tidak boleh dikonfirmasi ulang.
	repo.confirmedSetoran = &domain.SetoranPajak{ID: "s-9", Status: domain.StatusSetoranDikonfirmasi}
	if _, err := svc.KonfirmasiSetoran(context.Background(), "a", "s-9", "NOMOR", "x", ""); err != domain.ErrInvalidState {
		t.Errorf("KonfirmasiSetoran() error = %v, want ErrInvalidState", err)
	}
}

func TestRingkasanDefaultsToCurrentYear(t *testing.T) {
	repo := &fakeRepo{}
	svc := NewService(repo)

	if _, err := svc.Ringkasan(context.Background(), 0); err != nil {
		t.Fatalf("Ringkasan() error = %v", err)
	}
	if repo.ringkasanTahun < 2000 {
		t.Errorf("tahun fallback = %d, want tahun berjalan", repo.ringkasanTahun)
	}
}
