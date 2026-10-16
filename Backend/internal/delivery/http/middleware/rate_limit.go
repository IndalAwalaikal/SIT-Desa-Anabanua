package middleware

import (
	"net"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	apiresponse "desa-anabanua-api/internal/delivery/http/apiresponse"
	"desa-anabanua-api/internal/domain"
)

type visitor struct {
	tokens  float64
	updated time.Time
}
type RateLimiter struct {
	mu                  sync.Mutex
	visitors            map[string]visitor
	capacity, perSecond float64
	lastCleanup         time.Time
}

func NewRateLimiter(capacity int, window time.Duration) *RateLimiter {
	return &RateLimiter{visitors: map[string]visitor{}, capacity: float64(capacity), perSecond: float64(capacity) / window.Seconds()}
}
func (l *RateLimiter) Allow(ip string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := time.Now()
	if now.Sub(l.lastCleanup) >= 10*time.Minute {
		for key, candidate := range l.visitors {
			if now.Sub(candidate.updated) > 2*time.Hour {
				delete(l.visitors, key)
			}
		}
		l.lastCleanup = now
	}
	v := l.visitors[ip]
	if v.updated.IsZero() {
		v = visitor{tokens: l.capacity, updated: now}
	}
	v.tokens = min(l.capacity, v.tokens+now.Sub(v.updated).Seconds()*l.perSecond)
	v.updated = now
	if v.tokens < 1 {
		l.visitors[ip] = v
		return false
	}
	v.tokens--
	l.visitors[ip] = v
	return true
}
func (l *RateLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Honor X-Forwarded-For ONLY from trusted proxies. Default to no trust
		// (production should set TRUSTED_PROXIES). When untrusted, fall back to
		// RemoteAddr to prevent spoofing the rate limit bucket.
		host := clientIP(r)
		if !l.Allow(host) {
			w.Header().Set("Retry-After", "60")
			apiresponse.Error(w, domain.ErrRateLimited)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// clientIP returns the originating client IP, preferring X-Forwarded-For only
// when the immediate hop is a trusted proxy.
func clientIP(r *http.Request) string {
	if isTrustedProxy(r.RemoteAddr) {
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			// Leftmost entry in XFF chain is the original client.
			if i := strings.Index(xff, ","); i >= 0 {
				xff = xff[:i]
			}
			xff = strings.TrimSpace(xff)
			if xff != "" {
				return xff
			}
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

// isTrustedProxy is a ponytail: set TRUSTED_PROXIES=cidr1,cidr2 to allow
// X-Forwarded-For; default behavior rejects forwarded headers (safe default).
// Add when deploying behind a known reverse proxy.
func isTrustedProxy(remoteAddr string) bool {
	host, _, err := net.SplitHostPort(remoteAddr)
	if err != nil {
		host = remoteAddr
	}
	trusted := os.Getenv("TRUSTED_PROXIES")
	if trusted == "" {
		return false
	}
	for _, cidr := range strings.Split(trusted, ",") {
		cidr = strings.TrimSpace(cidr)
		if cidr == "" {
			continue
		}
		_, ipnet, err := net.ParseCIDR(cidr)
		if err != nil {
			continue
		}
		if ip := net.ParseIP(host); ip != nil && ipnet.Contains(ip) {
			return true
		}
	}
	return false
}
func min(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}
