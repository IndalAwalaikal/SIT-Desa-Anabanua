package handler

import (
	"time"

	httpapi "desa-anabanua-api/internal/delivery/http/apiresponse"
	"desa-anabanua-api/internal/domain"
	"desa-anabanua-api/internal/usecase/berita"
	"net/http"
	"strings"
)

func (h *Handler) BeritaList(w http.ResponseWriter, r *http.Request) {
	h.beritaList(w, r, false)
}

func (h *Handler) BeritaAdminList(w http.ResponseWriter, r *http.Request) {
	h.beritaList(w, r, true)
}

func (h *Handler) beritaList(w http.ResponseWriter, r *http.Request, includeDraft bool) {
	p, l := page(r)
	q := r.URL.Query()
	f := berita.ListFilter{
		Kategori:     q.Get("kategori"),
		Search:       q.Get("search"),
		Page:         p,
		Limit:        l,
		IncludeDraft: includeDraft,
	}
	items, total := h.app.Berita.List(r.Context(), f)
	out := make([]map[string]any, 0, len(items))
	for _, b := range items {
		out = append(out, beritaResp(b))
	}
	httpapi.List(w, out, p, l, total)
}

func (h *Handler) BeritaGet(w http.ResponseWriter, r *http.Request) {
	b, err := h.app.Berita.GetBySlug(r.Context(), r.PathValue("slug"))
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, beritaResp(b))
}

func (h *Handler) BeritaCreate(w http.ResponseWriter, r *http.Request) {
	var v struct {
		Judul, Ringkasan, Konten, Kategori, GambarSampul, GambarTengah, Status string
		Tags                                                                   []string
	}
	if decode(r, &v) != nil || !valid(v.Judul, 5, 220) || !valid(v.Ringkasan, 10, 1000) || !valid(v.Konten, 10, 200000) || !one(v.Kategori, "pengumuman", "kegiatan", "pembangunan", "lainnya") {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	b := domain.Berita{
		Judul: v.Judul, Ringkasan: v.Ringkasan, Konten: v.Konten, Kategori: v.Kategori,
		GambarSampul: strings.TrimSpace(v.GambarSampul), GambarTengah: strings.TrimSpace(v.GambarTengah), Tags: v.Tags,
		Status: domain.BeritaStatus(strings.TrimSpace(v.Status)),
	}
	pID := principalID(r)
	created, err := h.app.Berita.Create(r.Context(), b, &pID)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 201, beritaResp(created))
}

func (h *Handler) BeritaUpdate(w http.ResponseWriter, r *http.Request) {
	var v struct {
		Judul, Ringkasan, Konten, Kategori, GambarSampul, GambarTengah, Status string
		Tags                                                                   []string
	}
	if decode(r, &v) != nil {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	b := domain.Berita{
		Judul: v.Judul, Ringkasan: v.Ringkasan, Konten: v.Konten, Kategori: v.Kategori,
		GambarSampul: v.GambarSampul, GambarTengah: v.GambarTengah, Tags: v.Tags, Status: domain.BeritaStatus(v.Status),
	}
	updated, err := h.app.Berita.Update(r.Context(), r.PathValue("id"), b)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, beritaResp(updated))
}

func (h *Handler) BeritaDelete(w http.ResponseWriter, r *http.Request) {
	if err := h.app.Berita.Delete(r.Context(), r.PathValue("id")); err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, map[string]bool{"ok": true})
}

// ---- Komentar Berita ----

func (h *Handler) BeritaKomentarList(w http.ResponseWriter, r *http.Request) {
	b, err := h.app.Berita.GetBySlugNoCount(r.Context(), r.PathValue("slug"))
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	items, err := h.app.Berita.ListKomentar(r.Context(), b.ID)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	out := make([]map[string]any, 0, len(items))
	for _, k := range items {
		out = append(out, komentarResp(k))
	}
	httpapi.JSON(w, 200, out)
}

func (h *Handler) BeritaKomentarCreate(w http.ResponseWriter, r *http.Request) {
	var v struct{ Konten string }
	if decode(r, &v) != nil || !valid(v.Konten, 1, 1000) {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	b, err := h.app.Berita.GetBySlugNoCount(r.Context(), r.PathValue("slug"))
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	pID := principalID(r)
	nama := "Warga"
	if u, e := h.app.Auth.Me(r.Context(), pID); e == nil && u.Nama != "" {
		nama = u.Nama
	}
	k, err := h.app.Berita.AddKomentar(r.Context(), b.ID, &pID, nama, v.Konten)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 201, komentarResp(k))
}

func (h *Handler) BeritaKomentarDelete(w http.ResponseWriter, r *http.Request) {
	pID := principalID(r)
	isAdmin := principalRole(r) == "admin" || principalRole(r) == "super_admin"
	var uid *string
	if !isAdmin {
		uid = &pID
	}
	if err := h.app.Berita.DeleteKomentar(r.Context(), r.PathValue("id"), uid, isAdmin); err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, map[string]bool{"ok": true})
}

func komentarResp(k domain.BeritaKomentar) map[string]any {
	resp := map[string]any{
		"id":        k.ID,
		"beritaId":  k.BeritaID,
		"nama":      k.Nama,
		"konten":    k.Konten,
		"createdAt": k.CreatedAt.Format(time.RFC3339),
	}
	if k.UserID != nil {
		resp["userId"] = k.UserID
	}
	return resp
}

func beritaResp(b domain.Berita) map[string]any {
	resp := map[string]any{
		"id":           b.ID,
		"slug":         b.Slug,
		"judul":        b.Judul,
		"ringkasan":    b.Ringkasan,
		"konten":       b.Konten,
		"kategori":     b.Kategori,
		"gambarSampul": b.GambarSampul,
		"gambarTengah": b.GambarTengah,
		"penulis":      b.Penulis,
		"tags":         b.Tags,
		"dibaca":       b.Dibaca,
		"status":       string(b.Status),
	}
	if b.TanggalTerbit != nil {
		resp["tanggalTerbit"] = b.TanggalTerbit.Format(time.RFC3339)
	} else {
		resp["tanggalTerbit"] = nil
	}
	return resp
}
