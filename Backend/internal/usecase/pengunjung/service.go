// Package pengunjung implements the public site visitor-counting use cases.
package pengunjung

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"strings"
	"time"

	"desa-anabanua-api/internal/domain"
)

// Repository persists visitor counts.
type Repository interface {
	// Track records a visit for the given day and IP hash. It returns whether the
	// IP is a brand-new unique visitor for that day.
	Track(ctx context.Context, tanggal, ipHash string) (isNew bool, err error)
	// Stats reads the aggregated visitor summary.
	Stats(ctx context.Context) (domain.PengunjungStats, error)
}

type Service struct {
	repo   Repository
	secret []byte
	loc    *time.Location
}

func NewService(repo Repository, secret string) *Service {
	loc := time.FixedZone("WITA", 8*60*60)
	return &Service{repo: repo, secret: []byte(secret), loc: loc}
}

// Track records a visit from the given client IP, hashing it so the raw address
// is never persisted.
func (s *Service) Track(ctx context.Context, ip string) error {
	tanggal := time.Now().In(s.loc).Format("2006-01-02")
	_, err := s.repo.Track(ctx, tanggal, s.hashIP(ip))
	return err
}

// Stats returns the current visitor summary (today, last 7 days, totals).
func (s *Service) Stats(ctx context.Context) (domain.PengunjungStats, error) {
	return s.repo.Stats(ctx)
}

// hashIP deterministically hashes a client IP so raw addresses are not stored
// (privacy) while still allowing daily unique-visitor deduplication.
func (s *Service) hashIP(ip string) string {
	if ip == "" {
		ip = "unknown"
	}
	mac := hmac.New(sha256.New, s.secret)
	_, _ = mac.Write([]byte(strings.TrimSpace(ip)))
	return hex.EncodeToString(mac.Sum(nil))
}
