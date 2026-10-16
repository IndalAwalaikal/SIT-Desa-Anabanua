package handler

import (
	"encoding/json"
	"fmt"
	"html"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"desa-anabanua-api/internal/delivery/http/middleware"
	"desa-anabanua-api/internal/domain"
	"desa-anabanua-api/internal/usecase"
)

// Handler is a thin HTTP adapter: it decodes requests, delegates to use case
// services and serialises responses. No SQL or business logic lives here.
type Handler struct{ app *usecase.App }

func New(a *usecase.App) *Handler { return &Handler{a} }

func decode(r *http.Request, v any) error {
	d := json.NewDecoder(io.LimitReader(r.Body, 1<<20))
	d.DisallowUnknownFields()
	if err := d.Decode(v); err != nil {
		return err
	}
	if err := d.Decode(&struct{}{}); err != io.EOF {
		return fmt.Errorf("request body must contain one JSON value")
	}
	return nil
}

// valid reports whether a trimmed string length is within [min,max].
func valid(s string, min, max int) bool {
	n := len(strings.TrimSpace(s))
	return n >= min && n <= max
}

func one(s string, vs ...string) bool {
	for _, v := range vs {
		if s == v {
			return true
		}
	}
	return false
}

func digits(s string) bool {
	for _, c := range s {
		if c < '0' || c > '9' {
			return false
		}
	}
	return s != ""
}

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

func validEmail(s string) bool {
	return emailRegex.MatchString(s)
}

// htmlEscape escapes HTML special characters to prevent XSS in rendered templates.
func htmlEscape(s string) string {
	return html.EscapeString(s)
}

// page parses pagination query params.
func page(r *http.Request) (int, int) {
	p, _ := strconv.Atoi(r.URL.Query().Get("page"))
	l, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if p < 1 {
		p = 1
	}
	if p > 1_000_000 {
		p = 1_000_000
	}
	if l < 1 {
		l = 10
	}
	if l > 100 {
		l = 100
	}
	return p, l
}

func userResp(u domain.User) map[string]any {
	var tgl any = nil
	if u.TanggalLahir != nil {
		tgl = u.TanggalLahir.Format("2006-01-02")
	}
	return map[string]any{
		"id":               u.ID,
		"nama":             u.Nama,
		"email":            u.Email,
		"nik":              strOrNil(u.NIK),
		"noKk":             strOrNil(u.NoKK),
		"tempatLahir":      strOrNil(u.TempatLahir),
		"tanggalLahir":     tgl,
		"jenisKelamin":     strOrNil(u.JenisKelamin),
		"agama":            strOrNil(u.Agama),
		"statusPerkawinan": strOrNil(u.StatusPerkawinan),
		"pekerjaan":        strOrNil(u.Pekerjaan),
		"rt":               strOrNil(u.RT),
		"rw":               strOrNil(u.RW),
		"dusun":            strOrNil(u.Dusun),
		"telepon":          strOrNil(u.Telepon),
		"alamat":           strOrNil(u.Alamat),
		"role":             u.Role,
		"avatarUrl":        strOrNil(u.AvatarURL),
		"createdAt":        u.CreatedAt.Format(time.RFC3339),
	}
}

func strOrNil(p *string) any {
	if p == nil {
		return nil
	}
	return *p
}

func principalID(r *http.Request) string {
	p, _ := middleware.PrincipalFrom(r.Context())
	return p.ID
}

func principalRole(r *http.Request) string {
	p, _ := middleware.PrincipalFrom(r.Context())
	return p.Role
}
