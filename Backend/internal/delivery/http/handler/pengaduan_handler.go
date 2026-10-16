package handler

import (
	"time"

	httpapi "desa-anabanua-api/internal/delivery/http/apiresponse"
	"desa-anabanua-api/internal/domain"
	"net/http"
	"strings"
)

func (h *Handler) PengaduanCreate(w http.ResponseWriter, r *http.Request) {
	var v struct{ Kategori, Judul, Deskripsi, Lokasi string }
	pemohon, err := h.app.Auth.Me(r.Context(), principalID(r))
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	if decode(r, &v) != nil || !one(v.Kategori, "infrastruktur", "layanan", "lingkungan", "lainnya") || !valid(v.Judul, 5, 200) || !valid(v.Deskripsi, 15, 10000) || (strings.TrimSpace(v.Lokasi) != "" && !valid(v.Lokasi, 2, 255)) {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	p, err := h.app.Pengaduan.Submit(r.Context(), pemohon, v.Kategori, strings.TrimSpace(v.Judul), strings.TrimSpace(v.Deskripsi), v.Lokasi)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 201, pengaduanResp(p))
}

func (h *Handler) PengaduanGet(w http.ResponseWriter, r *http.Request) {
	p, err := h.app.Pengaduan.GetByTiket(r.Context(), r.PathValue("nomorTiket"))
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	// A public tracking number is not authorization to disclose reporter
	// identity, location, or the full complaint text.
	httpapi.JSON(w, 200, pengaduanTrackingResp(p))
}

func pengaduanTrackingResp(p domain.Pengaduan) map[string]any {
	return map[string]any{
		"nomorTiket":     p.NomorTiket,
		"kategori":       p.Kategori,
		"status":         p.Status,
		"dibuatPada":     p.CreatedAt.Format(time.RFC3339),
		"diperbaruiPada": p.UpdatedAt.Format(time.RFC3339),
	}
}

func (h *Handler) PengaduanSaya(w http.ResponseWriter, r *http.Request) {
	pageNumber, limit := page(r)
	items, total, err := h.app.Pengaduan.ListByPelaporPage(r.Context(), principalID(r), pageNumber, limit)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	out := make([]map[string]any, 0, len(items))
	for _, p := range items {
		out = append(out, pengaduanResp(p))
	}
	httpapi.List(w, out, pageNumber, limit, total)
}

func (h *Handler) PengaduanList(w http.ResponseWriter, r *http.Request) {
	pageNumber, limit := page(r)
	items, total, err := h.app.Pengaduan.ListPage(
		r.Context(), r.URL.Query().Get("status"), r.URL.Query().Get("search"),
		r.URL.Query().Get("sort"), pageNumber, limit,
	)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	out := make([]map[string]any, 0, len(items))
	for _, p := range items {
		out = append(out, pengaduanResp(p))
	}
	httpapi.List(w, out, pageNumber, limit, total)
}

func (h *Handler) PengaduanStatus(w http.ResponseWriter, r *http.Request) {
	var v struct{ Status, TanggapanAdmin string }
	if decode(r, &v) != nil || !one(v.Status, "diterima", "ditindaklanjuti", "selesai") {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	st := domain.StatusPengaduan(v.Status)
	uid := principalID(r)
	p, err := h.app.Pengaduan.Respond(r.Context(), r.PathValue("id"), st, v.TanggapanAdmin, &uid)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, pengaduanResp(p))
}

func pengaduanResp(p domain.Pengaduan) map[string]any {
	resp := map[string]any{
		"id":             p.ID,
		"nomorTiket":     p.NomorTiket,
		"kategori":       p.Kategori,
		"judul":          p.Judul,
		"deskripsi":      p.Deskripsi,
		"lokasi":         strOrNil(p.Lokasi),
		"status":         p.Status,
		"tanggapanAdmin": strOrNil(p.TanggapanAdmin),
		"pelaporId":      p.PelaporID,
		"pelaporNama":    p.PelaporNama,
		"dibuatPada":     p.CreatedAt.Format(time.RFC3339),
		"diperbaruiPada": p.UpdatedAt.Format(time.RFC3339),
	}
	return resp
}
