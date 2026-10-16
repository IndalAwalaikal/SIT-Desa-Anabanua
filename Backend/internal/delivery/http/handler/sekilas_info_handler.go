package handler

import (
	"net/http"

	httpapi "desa-anabanua-api/internal/delivery/http/apiresponse"
	"desa-anabanua-api/internal/domain"
)

// SekilasInfoGet serves the public ticker list — only active items are returned.
func (h *Handler) SekilasInfoGet(w http.ResponseWriter, r *http.Request) {
	items, err := h.app.SekilasInfo.ListActive(r.Context())
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, items)
}

// SekilasInfoAdminList serves all items (including inactive) for the admin panel.
func (h *Handler) SekilasInfoAdminList(w http.ResponseWriter, r *http.Request) {
	items, err := h.app.SekilasInfo.List(r.Context())
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, items)
}

func (h *Handler) SekilasInfoCreate(w http.ResponseWriter, r *http.Request) {
	var v struct {
		Konten string
		Aktif  *bool
	}
	if decode(r, &v) != nil || !valid(v.Konten, 1, 500) {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	aktif := true
	if v.Aktif != nil {
		aktif = *v.Aktif
	}
	s := domain.SekilasInfo{Konten: v.Konten, Aktif: aktif}
	created, err := h.app.SekilasInfo.Create(r.Context(), s)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 201, created)
}

func (h *Handler) SekilasInfoUpdate(w http.ResponseWriter, r *http.Request) {
	var v struct {
		Konten string
		Aktif  *bool
	}
	if decode(r, &v) != nil {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	aktif := true
	if v.Aktif != nil {
		aktif = *v.Aktif
	}
	s := domain.SekilasInfo{Konten: v.Konten, Aktif: aktif}
	updated, err := h.app.SekilasInfo.Update(r.Context(), r.PathValue("id"), s)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, updated)
}

func (h *Handler) SekilasInfoDelete(w http.ResponseWriter, r *http.Request) {
	if err := h.app.SekilasInfo.Delete(r.Context(), r.PathValue("id")); err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, map[string]bool{"ok": true})
}
