package pengaduan

import (
	"context"
	"errors"
	"strings"
	"testing"

	"desa-anabanua-api/internal/domain"
	"desa-anabanua-api/internal/pkg/apputil"
	"desa-anabanua-api/internal/usecase/notifikasi"
)

// ---- fakes ----

type fakeRepo struct {
	createErr   error
	updateErr   error
	created     domain.Pengaduan
	updated     domain.Pengaduan
	byTiket     domain.Pengaduan
	byID        domain.Pengaduan
	listPelapor []domain.Pengaduan
	listAll     []domain.Pengaduan

	gotTiket      string
	gotListStatus string
}

func (f *fakeRepo) Create(_ context.Context, p domain.Pengaduan) error {
	if f.createErr != nil {
		return f.createErr
	}
	f.created = p
	return nil
}
func (f *fakeRepo) GetByNomorTiket(_ context.Context, tiket string) (domain.Pengaduan, error) {
	f.gotTiket = tiket
	return f.byTiket, nil
}
func (f *fakeRepo) GetByID(_ context.Context, id string) (domain.Pengaduan, error) {
	if id != f.byID.ID {
		return domain.Pengaduan{}, domain.ErrNotFound
	}
	return f.byID, nil
}
func (f *fakeRepo) ListByPelapor(_ context.Context, _ string) ([]domain.Pengaduan, error) {
	return f.listPelapor, nil
}
func (f *fakeRepo) ListByPelaporPage(_ context.Context, _ string, _, _ int) ([]domain.Pengaduan, int, error) {
	return f.listPelapor, len(f.listPelapor), nil
}
func (f *fakeRepo) ListAll(_ context.Context, status string) ([]domain.Pengaduan, error) {
	f.gotListStatus = status
	return f.listAll, nil
}
func (f *fakeRepo) ListPage(_ context.Context, status, search, sort string, page, limit int) ([]domain.Pengaduan, int, error) {
	f.gotListStatus = status
	return f.listAll, len(f.listAll), nil
}
func (f *fakeRepo) CountByStatus(_ context.Context) (map[string]int, error) {
	counts := map[string]int{}
	for _, item := range f.listAll {
		counts[string(item.Status)]++
	}
	return counts, nil
}
func (f *fakeRepo) Update(_ context.Context, p domain.Pengaduan) error {
	if f.updateErr != nil {
		return f.updateErr
	}
	f.updated = p
	return nil
}

type fakeNotifRepo struct{ created []domain.Notifikasi }

func (f *fakeNotifRepo) Create(_ context.Context, n domain.Notifikasi) error {
	f.created = append(f.created, n)
	return nil
}
func (f *fakeNotifRepo) ListByUser(_ context.Context, _ string, _ int) ([]domain.Notifikasi, error) {
	return nil, nil
}
func (f *fakeNotifRepo) MarkAsRead(_ context.Context, _, _ string) error      { return nil }
func (f *fakeNotifRepo) MarkAllAsRead(_ context.Context, _ string) error      { return nil }
func (f *fakeNotifRepo) CountUnread(_ context.Context, _ string) (int, error) { return 0, nil }

type fakeUserReader struct{ users []domain.User }

func (f *fakeUserReader) ListAll(_ context.Context) ([]domain.User, error) { return f.users, nil }

// ---- helpers ----

func newNotif() *notifikasi.Service {
	users := &fakeUserReader{users: []domain.User{
		{ID: "admin-1", Role: domain.RoleAdmin},
	}}
	return notifikasi.NewService(&fakeNotifRepo{}, users)
}

// ---- tests ----

func TestSubmit(t *testing.T) {
	repo := &fakeRepo{}
	svc := NewService(repo, newNotif())

	pelapor := domain.User{ID: "u-1", Nama: "Andi"}
	p, err := svc.Submit(context.Background(), pelapor, "infrastruktur", "  Jalan rusak  ", "Berlubang", "  Dusun I  ")
	if err != nil {
		t.Fatalf("Submit() error = %v", err)
	}

	if repo.created.ID == "" {
		t.Error("Submit() harus menghasilkan ID")
	}
	if repo.created.NomorTiket == "" {
		t.Error("Submit() harus menghasilkan NomorTiket")
	}
	if repo.created.Status != domain.PengaduanDiterima {
		t.Errorf("Status awal = %q, want %q", repo.created.Status, domain.PengaduanDiterima)
	}
	if repo.created.PelaporID != "u-1" {
		t.Errorf("PelaporID = %q, want %q", repo.created.PelaporID, "u-1")
	}
	if repo.created.Lokasi == nil || *repo.created.Lokasi != "Dusun I" {
		t.Errorf("Lokasi = %v, want 'Dusun I' (trimmed)", repo.created.Lokasi)
	}
	if p.NomorTiket != repo.created.NomorTiket {
		t.Errorf("returned tiket = %q, want %q", p.NomorTiket, repo.created.NomorTiket)
	}
}

func TestSubmitLokasiKosong(t *testing.T) {
	repo := &fakeRepo{}
	svc := NewService(repo, nil)

	if _, err := svc.Submit(context.Background(), domain.User{ID: "u-1"}, "lainnya", "Judul", "Deskripsi", "   "); err != nil {
		t.Fatalf("Submit() error = %v", err)
	}
	if repo.created.Lokasi != nil {
		t.Errorf("Lokasi = %v, want nil untuk input kosong", *repo.created.Lokasi)
	}
}

func TestGetByTiketNormalizesInput(t *testing.T) {
	repo := &fakeRepo{byTiket: domain.Pengaduan{NomorTiket: "PGD-001"}}
	svc := NewService(repo, nil)

	got, err := svc.GetByTiket(context.Background(), "  pgd-001 ")
	if err != nil {
		t.Fatalf("GetByTiket() error = %v", err)
	}
	if repo.gotTiket != "PGD-001" {
		t.Errorf("tiket yang dicari = %q, want %q", repo.gotTiket, "PGD-001")
	}
	if got.NomorTiket != "PGD-001" {
		t.Errorf("NomorTiket = %q, want %q", got.NomorTiket, "PGD-001")
	}
}

func TestRespond(t *testing.T) {
	admin := "admin-1"
	tanggapan := "Segera ditindaklanjuti"
	repo := &fakeRepo{byID: domain.Pengaduan{ID: "p-1", Status: domain.PengaduanDiterima}}
	svc := NewService(repo, nil)

	got, err := svc.Respond(context.Background(), "p-1", domain.PengaduanDitindaklanjuti, "  "+tanggapan+"  ", &admin)
	if err != nil {
		t.Fatalf("Respond() error = %v", err)
	}
	if got.Status != domain.PengaduanDitindaklanjuti {
		t.Errorf("Status = %q, want %q", got.Status, domain.PengaduanDitindaklanjuti)
	}
	if got.TanggapanAdmin == nil || *got.TanggapanAdmin != tanggapan {
		t.Errorf("TanggapanAdmin = %v, want %q (trimmed)", got.TanggapanAdmin, tanggapan)
	}
	if got.ChangedBy == nil || *got.ChangedBy != admin {
		t.Errorf("ChangedBy = %v, want %q", got.ChangedBy, admin)
	}
	if repo.updated.ID != "p-1" {
		t.Error("Respond() harus menyimpan perubahan ke repository")
	}
}

func TestRespondNotFound(t *testing.T) {
	svc := NewService(&fakeRepo{}, nil)

	if _, err := svc.Respond(context.Background(), "tidak-ada", domain.PengaduanSelesai, "", nil); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("Respond() error = %v, want ErrNotFound", err)
	}
}

func TestListAllTrimsStatus(t *testing.T) {
	repo := &fakeRepo{}
	svc := NewService(repo, nil)

	if _, err := svc.ListAll(context.Background(), "  diterima  "); err != nil {
		t.Fatalf("ListAll() error = %v", err)
	}
	if repo.gotListStatus != "diterima" {
		t.Errorf("status filter = %q, want %q", repo.gotListStatus, "diterima")
	}
}

func TestTicketFormat(t *testing.T) {
	// NomorTiket tidak boleh kosong dan tidak boleh mengandung spasi.
	for i := 0; i < 20; i++ {
		tk := apputil.Tiket()
		if tk == "" || strings.ContainsAny(tk, " \t\n") {
			t.Fatalf("NomorTiket tidak valid: %q", tk)
		}
	}
}
