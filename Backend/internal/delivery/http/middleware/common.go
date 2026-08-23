package middleware

import (
	"github.com/oklog/ulid/v2"
	"log/slog"
	"net/http"
	"strings"
	"time"
)

// MaxBodyBytes is the global cap for non-multipart request bodies (JSON etc.).
// Multipart uploads have their own per-handler limit (see pengajuan_handler.go).
const MaxBodyBytes int64 = 2 << 20 // 2 MiB

// securityHeaders applied to every response. CSP is intentionally permissive
// enough for a Next.js frontend (inline RSC payload/scripts) while still
// blocking object/embed, inline frame embedding, and foreign origins. Tighten
// to nonce-based 'strict-src' on script-src only after instrumenting Next.js
// with per-request nonces. In production, CORS_ALLOWED_ORIGINS must be exact
// origins (no wildcards) to prevent credential-bearing cross-origin requests
// from untrusted domains.
const cspHeader = "default-src 'self'; " +
	"script-src 'self' 'unsafe-inline' 'unsafe-eval'; " + // Next.js RSC runtime + dev overlay
	"img-src 'self' data: https:; " + // next/image & unsplash
	"media-src 'self' https:; " +
	"style-src 'self' 'unsafe-inline'; " + // Tailwind inline styles
	"font-src 'self' https: data:; " +
	"connect-src 'self'; " +
	"frame-ancestors 'none'; " + // equivalent to X-Frame-Options DENY
	"base-uri 'self'; " +
	"form-action 'self'"

// addSecurityHeaders sets defensive HTTP headers on every response. HSTS is only
// emitted when the request arrived over TLS (or behind an https proxy) AND we
// are not in development, so local `http://localhost` stays usable.
func addSecurityHeaders(w http.ResponseWriter, r *http.Request, env string) {
	header := w.Header()
	header.Set("X-Content-Type-Options", "nosniff")
	header.Set("Referrer-Policy", "strict-origin-when-cross-origin")
	header.Set("X-Frame-Options", "DENY")
	header.Set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()")
	header.Set("Content-Security-Policy", cspHeader)
	if env == "production" && (r.TLS != nil || strings.EqualFold(r.Header.Get("X-Forwarded-Proto"), "https")) {
		header.Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
	}
}

// BodyLimit rejects requests whose Content-Length exceeds maxBytes and wraps
// the body in an io.LimitReader for chunked / unknown-length requests. Apply
// at the outermost middleware so a missing handler-side limit still caps
// memory use.
func BodyLimit(maxBytes int64) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.ContentLength > maxBytes {
				http.Error(w, "request body too large", http.StatusRequestEntityTooLarge)
				return
			}
			if r.Body != nil {
				r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
			}
			next.ServeHTTP(w, r)
		})
	}
}

func Common(origins []string, env string, log *slog.Logger) func(http.Handler) http.Handler {
	allowed := map[string]bool{}
	for _, x := range origins {
		allowed[x] = true
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			id := r.Header.Get("X-Request-ID")
			if id == "" || len(id) > 128 {
				id = ulid.Make().String()
			}
			w.Header().Set("X-Request-ID", id)
			addSecurityHeaders(w, r, env)
			if o := r.Header.Get("Origin"); o != "" && allowed[o] {
				w.Header().Set("Access-Control-Allow-Origin", o)
				w.Header().Set("Vary", "Origin")
				w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Request-ID, X-CSRF-Token")
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
				w.Header().Set("Access-Control-Allow-Credentials", "true")
			}
			if r.Method == http.MethodOptions {
				w.WriteHeader(204)
				return
			}
			start := time.Now()
			defer func() {
				if v := recover(); v != nil {
					http.Error(w, "internal server error", 500)
					log.Error("panic", "requestID", id, "panic", v)
				}
			}()
			next.ServeHTTP(w, r)
			log.Info("request", "method", r.Method, "path", r.URL.Path, "duration", time.Since(start), "requestID", id)
		})
	}
}
