package handler

import (
	httpapi "desa-anabanua-api/internal/delivery/http/apiresponse"
	"desa-anabanua-api/internal/domain"
	"net/http"
	"strings"
)

func (h *Handler) GetPendudukByNIK(w http.ResponseWriter, r *http.Request) {
	nik := strings.TrimSpace(r.PathValue("nik"))
	if nik == "" {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	p, err := h.app.Persuratan.GetPendudukByNIK(r.Context(), nik)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, p)
}

func (h *Handler) VerifikasiSurat(w http.ResponseWriter, r *http.Request) {
	code := strings.TrimSpace(r.PathValue("code"))
	if code == "" {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	p, err := h.app.Persuratan.GetByQRVerificationCode(r.Context(), code)
	if err != nil {
		httpapi.Error(w, domain.ErrNotFound)
		return
	}
	out := map[string]any{
		"valid":                true,
		"nomorResi":            p.NomorResi,
		"nomorSurat":           p.NomorSuratResmi,
		"jenisSuratNama":       p.JenisSuratNama,
		"pemohonNama":          p.PemohonNama,
		"status":               p.Status,
		"tanggalTerbit":        p.UpdatedAt.Format("02 January 2006"),
		"penandatangan":        "Kepala Desa Anabanua",
		"jabatanPenandatangan": "Pemerintah Desa Anabanua",
	}
	httpapi.JSON(w, 200, out)
}
