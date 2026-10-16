package pengunjung

import (
	"context"
	"testing"

	"desa-anabanua-api/internal/domain"
)

// ---- fakes ----

type fakeRepo struct {
	Repository
	trackedTanggal string
	trackedIPHash  string
	trackCalls     int
	trackIsNew     bool
	trackErr       error
	stats          domain.PengunjungStats
	statsErr       error
	statsCalls     int
}

func (f *fakeRepo) Track(_ context.Context, tanggal, ipHash string) (bool, error) {
	f.trackCalls++
	f.trackedTanggal = tanggal
	f.trackedIPHash = ipHash
	return f.trackIsNew, f.trackErr
}

func (f *fakeRepo) Stats(_ context.Context) (domain.PengunjungStats, error) {
	f.statsCalls++
	return f.stats, f.statsErr
}

// ---- tests ----

func TestTrackDelegatesToRepoWithHashedIP(t *testing.T) {
	repo := &fakeRepo{}
	svc := NewService(repo, "test-visitor-secret")

	if err := svc.Track(context.Background(), "10.0.0.7"); err != nil {
		t.Fatalf("Track returned error: %v", err)
	}
	if repo.trackCalls != 1 {
		t.Errorf("Track call count = %d, want 1", repo.trackCalls)
	}
	if repo.trackedIPHash == "" {
		t.Error("expected a non-empty hashed IP to be forwarded to the repo")
	}
	if repo.trackedIPHash == "10.0.0.7" {
		t.Error("raw IP must not be forwarded to the repo; expected a hash")
	}
	// Same input always hashes to the same value (deterministic).
	if h := svc.hashIP("10.0.0.7"); h != repo.trackedIPHash {
		t.Errorf("forwarded hash = %s, want %s", repo.trackedIPHash, h)
	}
	// The tanggal forwarded must be today's date (yyyy-mm-dd).
	if len(repo.trackedTanggal) != 10 {
		t.Errorf("tanggal format = %q, want yyyy-mm-dd", repo.trackedTanggal)
	}
}

func TestTrackEmptyIPIsHashedAsUnknown(t *testing.T) {
	repo := &fakeRepo{}
	svc := NewService(repo, "test-visitor-secret")

	if err := svc.Track(context.Background(), ""); err != nil {
		t.Fatalf("Track returned error: %v", err)
	}
	if repo.trackedIPHash != svc.hashIP("") {
		t.Error("empty IP should hash to the 'unknown' sentinel")
	}
}

func TestStatsDelegatesToRepo(t *testing.T) {
	want := domain.PengunjungStats{
		HariIni:         domain.PengunjungHarian{Tanggal: "2026-01-02", Pengunjung: 12, Kunjungan: 34},
		TotalPengunjung: 100,
		TotalKunjungan:  400,
	}
	repo := &fakeRepo{stats: want}
	svc := NewService(repo, "test-visitor-secret")

	got, err := svc.Stats(context.Background())
	if err != nil {
		t.Fatalf("Stats returned error: %v", err)
	}
	if repo.statsCalls != 1 {
		t.Errorf("Stats call count = %d, want 1", repo.statsCalls)
	}
	if got.TotalPengunjung != want.TotalPengunjung || got.HariIni.Pengunjung != want.HariIni.Pengunjung {
		t.Errorf("Stats = %+v, want %+v", got, want)
	}
}

func TestHashIPIsDeterministicAndDistinct(t *testing.T) {
	svc := NewService(&fakeRepo{}, "test-visitor-secret")
	a := svc.hashIP("1.2.3.4")
	b := svc.hashIP("1.2.3.4")
	c := svc.hashIP("9.9.9.9")
	if a != b {
		t.Error("hashIP must be deterministic for the same input")
	}
	if a == c {
		t.Error("different IPs must produce different hashes")
	}
	if len(a) != 64 {
		t.Errorf("hashIP should return a 64-char hex (sha256), got %d", len(a))
	}
}
