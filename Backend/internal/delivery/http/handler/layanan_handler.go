package handler

import (
	httpapi "desa-anabanua-api/internal/delivery/http/apiresponse"
	"desa-anabanua-api/internal/domain"
	"net/http"
	"strings"
)

func (h *Handler) JenisList(w http.ResponseWriter, r *http.Request) {
	h.jenisList(w, r, false)
}

func (h *Handler) JenisAdminList(w http.ResponseWriter, r *http.Request) {
	h.jenisList(w, r, true)
}

func (h *Handler) jenisList(w http.ResponseWriter, r *http.Request, includeInactive bool) {
	items, err := h.app.Persuratan.ListJenis(r.Context(), includeInactive)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	out := make([]map[string]any, 0, len(items))
	for _, j := range items {
		out = append(out, jenisResp(j))
	}
	httpapi.JSON(w, 200, out)
}

func (h *Handler) JenisGet(w http.ResponseWriter, r *http.Request) {
	j, err := h.app.Persuratan.GetJenis(r.Context(), r.PathValue("kode"))
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	if !j.IsActive {
		httpapi.Error(w, domain.ErrNotFound)
		return
	}
	httpapi.JSON(w, 200, jenisResp(j))
}

func (h *Handler) JenisCreate(w http.ResponseWriter, r *http.Request) {
	var v struct {
		Kode, Kategori, Nama, Deskripsi, Ikon string
		TemplateHTML                          *string
		WorkflowConfig                        []domain.WorkflowStepConfig
		NomorSuratFormat                      string
		Persyaratan                           []string
		FormFields                            []domain.FormFieldConfig
		EstimasiHari                          int
		Aktif                                 bool
	}
	if decode(r, &v) != nil || !valid(v.Kode, 2, 20) || !valid(v.Nama, 3, 150) || v.EstimasiHari < 1 {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	j := domain.JenisSurat{
		Kode: v.Kode, Kategori: v.Kategori, Nama: v.Nama, Deskripsi: v.Deskripsi,
		Persyaratan: v.Persyaratan, FormFields: v.FormFields,
		TemplateHTML: v.TemplateHTML, WorkflowConfig: v.WorkflowConfig,
		NomorSuratFormat: v.NomorSuratFormat, EstimasiHari: v.EstimasiHari,
		Ikon: v.Ikon, IsActive: v.Aktif,
	}
	created, err := h.app.Persuratan.CreateJenis(r.Context(), j)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 201, jenisResp(created))
}

func (h *Handler) JenisUpdate(w http.ResponseWriter, r *http.Request) {
	var v struct {
		Kode, Kategori, Nama, Deskripsi, Ikon string
		TemplateHTML                          *string
		WorkflowConfig                        []domain.WorkflowStepConfig
		NomorSuratFormat                      string
		Persyaratan                           []string
		FormFields                            []domain.FormFieldConfig
		EstimasiHari                          int
		Aktif                                 bool
	}
	if decode(r, &v) != nil {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	j := domain.JenisSurat{
		Kode: v.Kode, Kategori: v.Kategori, Nama: v.Nama, Deskripsi: v.Deskripsi,
		Persyaratan: v.Persyaratan, FormFields: v.FormFields,
		TemplateHTML: v.TemplateHTML, WorkflowConfig: v.WorkflowConfig,
		NomorSuratFormat: v.NomorSuratFormat, EstimasiHari: v.EstimasiHari,
		Ikon: v.Ikon, IsActive: v.Aktif,
	}
	updated, err := h.app.Persuratan.UpdateJenis(r.Context(), r.PathValue("kode"), j)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, jenisResp(updated))
}

func (h *Handler) JenisDelete(w http.ResponseWriter, r *http.Request) {
	if err := h.app.Persuratan.DeleteJenis(r.Context(), r.PathValue("kode")); err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, map[string]bool{"ok": true})
}

func jenisResp(j domain.JenisSurat) map[string]any {
	return map[string]any{
		"kode":             j.Kode,
		"kategori":         j.Kategori,
		"nama":             j.Nama,
		"deskripsi":        j.Deskripsi,
		"persyaratan":      j.Persyaratan,
		"formFields":       j.FormFields,
		"templateHtml":     j.TemplateHTML,
		"workflowConfig":   j.WorkflowConfig,
		"nomorSuratFormat": j.NomorSuratFormat,
		"estimasiHari":     j.EstimasiHari,
		"ikon":             strings.TrimSpace(j.Ikon),
		"aktif":            j.IsActive,
	}
}
