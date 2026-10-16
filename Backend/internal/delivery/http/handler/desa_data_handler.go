package handler

import (
	httpapi "desa-anabanua-api/internal/delivery/http/apiresponse"
	"desa-anabanua-api/internal/domain"
	"net/http"
)

func (h *Handler) PerangkatList(w http.ResponseWriter, r *http.Request) {
	items, err := h.app.Desa.ListPerangkat(r.Context())
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, items)
}

func (h *Handler) PerangkatCreate(w http.ResponseWriter, r *http.Request) {
	var v domain.PerangkatDesa
	if decode(r, &v) != nil || !valid(v.Nama, 3, 150) || !valid(v.Jabatan, 3, 150) || !valid(v.Periode, 2, 100) {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	p, err := h.app.Desa.CreatePerangkat(r.Context(), v)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 201, p)
}

func (h *Handler) PerangkatUpdate(w http.ResponseWriter, r *http.Request) {
	var v domain.PerangkatDesa
	if decode(r, &v) != nil {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	p, err := h.app.Desa.UpdatePerangkat(r.Context(), r.PathValue("id"), v)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, p)
}

func (h *Handler) PerangkatDelete(w http.ResponseWriter, r *http.Request) {
	if err := h.app.Desa.DeletePerangkat(r.Context(), r.PathValue("id")); err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, map[string]bool{"ok": true})
}

func (h *Handler) DusunList(w http.ResponseWriter, r *http.Request) {
	items, err := h.app.Desa.ListDusun(r.Context())
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, items)
}

func (h *Handler) PotensiList(w http.ResponseWriter, r *http.Request) {
	items, err := h.app.Desa.ListPotensi(r.Context())
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, items)
}

func (h *Handler) FasilitasList(w http.ResponseWriter, r *http.Request) {
	items, err := h.app.Desa.ListFasilitas(r.Context(), r.URL.Query().Get("kategori"))
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, items)
}

func (h *Handler) FasilitasCreate(w http.ResponseWriter, r *http.Request) {
	var v domain.FasilitasDesa
	if decode(r, &v) != nil || !valid(v.Nama, 3, 150) {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	f, err := h.app.Desa.CreateFasilitas(r.Context(), v)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 201, f)
}

func (h *Handler) FasilitasUpdate(w http.ResponseWriter, r *http.Request) {
	var v domain.FasilitasDesa
	if decode(r, &v) != nil {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	f, err := h.app.Desa.UpdateFasilitas(r.Context(), r.PathValue("id"), v)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, f)
}

func (h *Handler) FasilitasDelete(w http.ResponseWriter, r *http.Request) {
	if err := h.app.Desa.DeleteFasilitas(r.Context(), r.PathValue("id")); err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, map[string]bool{"ok": true})
}
