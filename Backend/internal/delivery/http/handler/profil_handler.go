package handler

import (
	httpapi "desa-anabanua-api/internal/delivery/http/apiresponse"
	"desa-anabanua-api/internal/domain"
	"errors"
	"net/http"
)

func (h *Handler) ProfilGet(w http.ResponseWriter, r *http.Request) {
	p, err := h.app.Desa.GetProfil(r.Context())
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			httpapi.JSON(w, 200, domain.ProfilDesa{})
			return
		}
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, p)
}

func (h *Handler) ProfilUpdate(w http.ResponseWriter, r *http.Request) {
	var v domain.ProfilDesa
	if decode(r, &v) != nil || !valid(v.Nama, 3, 150) {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	p, err := h.app.Desa.UpdateProfil(r.Context(), v)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, p)
}
