package berita

import (
	"context"
	"strings"
	"testing"

	"desa-anabanua-api/internal/domain"
	"desa-anabanua-api/internal/pkg/apputil"
)

// ---- fake ----

type fakeRepo struct {
	Repository // embed nil; hanya metode yang di-override yang boleh terpanggil
	stored     domain.Berita
	bySlug     domain.Berita
	reads      int
	gotFilter  ListFilter
}

func (f *fakeRepo) List(_ context.Context, f2 ListFilter) ([]domain.Berita, int, error) {
	f.gotFilter = f2
	return []domain.Berita{}, 0, nil
}
func (f *fakeRepo) Create(_ context.Context, b domain.Berita) error { f.stored = b; return nil }
func (f *fakeRepo) GetBySlug(_ context.Context, _ string) (domain.Berita, error) {
	return f.bySlug, nil
}
func (f *fakeRepo) IncrementRead(_ context.Context, _ string) error { f.reads++; return nil }

// ---- tests ----

func TestListDefaultsPagination(t *testing.T) {
	repo := &fakeRepo{}
	svc := NewService(repo, nil)

	cases := []struct {
		name      string
		page, lim int
		wantPage  int
		wantLimit int
	}{
		{"default", 0, 0, 1, 10},
		{"limit besar di-clamp", 2, 500, 2, 100},
		{"page nol", 0, 25, 1, 25},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			repo.gotFilter = ListFilter{}
			svc.List(context.Background(), ListFilter{Page: c.page, Limit: c.lim})
			if repo.gotFilter.Page != c.wantPage || repo.gotFilter.Limit != c.wantLimit {
				t.Errorf("filter = %+v, want page=%d limit=%d", repo.gotFilter, c.wantPage, c.wantLimit)
			}
		})
	}
}

func TestGetBySlugPublishedIncrementsRead(t *testing.T) {
	repo := &fakeRepo{bySlug: domain.Berita{ID: "b-1", Slug: "jalan-rusak", Status: domain.BeritaTerbit}}
	svc := NewService(repo, nil)

	b, err := svc.GetBySlug(context.Background(), "jalan-rusak")
	if err != nil {
		t.Fatalf("GetBySlug() error = %v", err)
	}
	if b.ID != "b-1" {
		t.Errorf("ID = %q, want b-1", b.ID)
	}
	if repo.reads != 1 {
		t.Errorf("IncrementRead dipanggil %d kali, want 1", repo.reads)
	}
}

func TestGetBySlugDraftHiddenFromPublic(t *testing.T) {
	repo := &fakeRepo{bySlug: domain.Berita{ID: "b-2", Status: domain.BeritaDraft}}
	svc := NewService(repo, nil)

	if _, err := svc.GetBySlug(context.Background(), "draf"); err != domain.ErrNotFound {
		t.Errorf("GetBySlug(draft) error = %v, want ErrNotFound", err)
	}
	if repo.reads != 0 {
		t.Error("draft tidak boleh menaikkan counter pembacaan")
	}
}

func TestCreatePublishedSetsMetadata(t *testing.T) {
	repo := &fakeRepo{}
	svc := NewService(repo, nil)

	b, err := svc.Create(context.Background(), domain.Berita{Judul: "Pembangunan Jalan Desa", Konten: "isi"}, nil)
	if err != nil {
		t.Fatalf("Create() error = %v", err)
	}
	if repo.stored.ID == "" {
		t.Error("ID harus dibuat oleh service")
	}
	wantPrefix := apputil.Slug("Pembangunan Jalan Desa")
	if !strings.HasPrefix(b.Slug, wantPrefix+"-") {
		t.Errorf("Slug = %q, want prefix %q + suffix unik", b.Slug, wantPrefix)
	}
	if b.Status != domain.BeritaTerbit {
		t.Errorf("Status default = %q, want %q", b.Status, domain.BeritaTerbit)
	}
	if b.TanggalTerbit == nil {
		t.Error("TanggalTerbit harus terisi untuk status terbit")
	}
	if b.Tags == nil {
		t.Error("Tags harus slice kosong (bukan nil)")
	}
}

func TestCreateInvalidStatus(t *testing.T) {
	svc := NewService(&fakeRepo{}, nil)

	if _, err := svc.Create(context.Background(), domain.Berita{Judul: "X", Status: "arsip"}, nil); err != domain.ErrValidation {
		t.Errorf("Create() error = %v, want ErrValidation", err)
	}
}

func TestCreateDraftHasNoPublishDate(t *testing.T) {
	repo := &fakeRepo{}
	svc := NewService(repo, nil)

	b, err := svc.Create(context.Background(), domain.Berita{Judul: "Draf Berita", Status: domain.BeritaDraft}, nil)
	if err != nil {
		t.Fatalf("Create() error = %v", err)
	}
	if b.TanggalTerbit != nil {
		t.Errorf("TanggalTerbit = %v, want nil untuk draft", *b.TanggalTerbit)
	}
}
