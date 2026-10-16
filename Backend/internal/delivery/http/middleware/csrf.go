package middleware

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"os"
	"strings"
	"time"

	httpapi "desa-anabanua-api/internal/delivery/http/apiresponse"
	"desa-anabanua-api/internal/domain"
)

// CSRF protects state-changing endpoints using a double-submit cookie pattern.
// It sets a csrf_token cookie and requires the same value in the X-CSRF-Token header.

// csrfCookieName is deliberately versioned ("_v2"). Migrasi ke HttpOnly:false krusial
// agar token bisa dibaca JavaScript untuk di-echo sebagai header X-CSRF-Token; cookie
// lama "csrf_token" (HttpOnly) di browser lama tetap diabaikan dan otomatis diganti.
const csrfCookieName = "csrf_token_v2"

type CSRF struct {
	cookieName string
	headerName string
	maxAge     int
}

func NewCSRF() *CSRF {
	return &CSRF{
		cookieName: csrfCookieName,
		headerName: "X-CSRF-Token",
		maxAge:     86400,
	}
}

// Middleware enforces CSRF double-submit cookie validation for all state-changing
// requests (POST, PUT, PATCH, DELETE). GET/HEAD/OPTIONS are always passed through.
// If the cookie is missing or the header does not match, the request is rejected
// with 403 Forbidden — there is no "first-request bypass".
func (c *CSRF) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet || r.Method == http.MethodHead || r.Method == http.MethodOptions {
			next.ServeHTTP(w, r)
			return
		}

		cookie, err := r.Cookie(c.cookieName)
		if err != nil || cookie.Value == "" {
			// Cookie belum ada — tolak langsung.
			// Frontend harus memanggil GET /api/csrf-token terlebih dahulu
			// untuk mendapatkan cookie sebelum melakukan request mutasi.
			httpapi.Error(w, domain.ErrForbidden)
			return
		}

		header := r.Header.Get(c.headerName)
		if header == "" || header != cookie.Value {
			httpapi.Error(w, domain.ErrForbidden)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// GenerateAndSetCookie membuat token CSRF baru, menyetelnya sebagai cookie pada
// response, dan mengembalikan nilai token. Dipanggil oleh handler GET /api/csrf-token
// agar browser selalu mendapatkan cookie segar sebelum melakukan request mutasi.
func (c *CSRF) GenerateAndSetCookie(w http.ResponseWriter) string {
	token := c.generateToken()
	c.setCookie(w, token)
	// Ekspos token di response header agar klien non-browser juga bisa membacanya.
	w.Header().Set("X-CSRF-Token", token)
	return token
}

func (c *CSRF) generateToken() string {
	buf := make([]byte, 32)
	// ponytail: CSPRNG failure is critical — fall through to panic instead
	// of silently emitting a zero-value token (predictable = CSRF bypass).
	if _, err := rand.Read(buf); err != nil {
		panic("crypto/rand failed: " + err.Error())
	}
	return base64.RawURLEncoding.EncodeToString(buf)
}

func (c *CSRF) setCookie(w http.ResponseWriter, value string) {
	// Secure flag diaktifkan otomatis ketika APP_ENV=production
	// agar cookie CSRF (dan access/refresh token) tidak pernah
	// dikirim over HTTP plain di depan publik.
	isSecure := strings.EqualFold(os.Getenv("APP_ENV"), "production")
	http.SetCookie(w, &http.Cookie{
		Name:     c.cookieName,
		Value:    value,
		Path:     "/",
		HttpOnly: false, // double-submit CSRF: JS harus bisa membaca token untuk di-echo sebagai header X-CSRF-Token
		Secure:   isSecure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   c.maxAge,
		Expires:  time.Now().Add(time.Duration(c.maxAge) * time.Second),
	})
}

// ExtractCSRFToken returns the token value from the request cookie, if present.
func (c *CSRF) ExtractCSRFToken(r *http.Request) string {
	cookie, err := r.Cookie(c.cookieName)
	if err != nil {
		return ""
	}
	return cookie.Value
}

// CSRFTokenFromContext extracts the CSRF token set by the middleware.
func CSRFTokenFromContext(r *http.Request) string {
	header := r.Header.Get("X-CSRF-Token")
	if header != "" {
		return header
	}
	cookie, err := r.Cookie(csrfCookieName)
	if err != nil {
		return ""
	}
	return cookie.Value
}

// IsSafeMethod returns true for GET, HEAD, OPTIONS which do not require CSRF protection.
func IsSafeMethod(method string) bool {
	switch strings.ToUpper(method) {
	case "GET", "HEAD", "OPTIONS":
		return true
	default:
		return false
	}
}
