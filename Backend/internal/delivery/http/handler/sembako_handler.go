package handler

import (
	"net/http"
	"strings"
	"time"

	httpapi "desa-anabanua-api/internal/delivery/http/apiresponse"
	"desa-anabanua-api/internal/domain"
)

// sembakoStatusDTO membungkus periode dengan status yang diturunkan dari waktu server.
type sembakoPeriodDTO struct {
	domain.SembakoPeriod
	Status string `json:"status"`
}

func toSembakoDTO(list []domain.SembakoPeriod, now time.Time) []sembakoPeriodDTO {
	out := make([]sembakoPeriodDTO, 0, len(list))
	for _, p := range list {
		out = append(out, sembakoPeriodDTO{SembakoPeriod: p, Status: p.Status(now)})
	}
	return out
}

// SembakoList serves all distribution periods (public).
func (h *Handler) SembakoList(w http.ResponseWriter, r *http.Request) {
	items, err := h.app.Sembako.List(r.Context())
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, toSembakoDTO(items, time.Now()))
}

// SembakoGet serves one period by id (public).
func (h *Handler) SembakoGet(w http.ResponseWriter, r *http.Request) {
	p, err := h.app.Sembako.Get(r.Context(), r.PathValue("id"))
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, toSembakoDTO([]domain.SembakoPeriod{p}, time.Now())[0])
}

type sembakoUpsertInput struct {
	Nama           string                `json:"nama"`
	Periode        string                `json:"periode"`
	TanggalMulai   string                `json:"tanggalMulai"` // YYYY-MM-DD
	TanggalSelesai *string               `json:"tanggalSelesai"`
	TargetPenerima *int                  `json:"targetPenerima"`
	Lokasi         *string               `json:"lokasi"`
	Keterangan     *string               `json:"keterangan"`
	Items          []sembakoItemUpsertIn `json:"items"`
}

type sembakoItemUpsertIn struct {
	NamaBarang  string  `json:"namaBarang"`
	Satuan      string  `json:"satuan"`
	JumlahPerKK float64 `json:"jumlahPerKK"`
	Keterangan  *string `json:"keterangan"`
}

const dateLayout = "2006-01-02"

func (v sembakoUpsertInput) validate() (domain.SembakoPeriod, bool) {
	p := domain.SembakoPeriod{Nama: v.Nama, Periode: v.Periode, Items: []domain.SembakoItem{}}
	if len(strings.TrimSpace(p.Nama)) < 3 || len(p.Nama) > 150 {
		return p, false
	}
	if strings.TrimSpace(p.Periode) == "" || len(p.Periode) > 100 {
		return p, false
	}
	mulai, err := time.Parse(dateLayout, v.TanggalMulai)
	if err != nil {
		return p, false
	}
	p.TanggalMulai = mulai
	if v.TanggalSelesai != nil && *v.TanggalSelesai != "" {
		selesai, err := time.Parse(dateLayout, *v.TanggalSelesai)
		if err != nil || selesai.Before(mulai) {
			return p, false
		}
		p.TanggalSelesai = &selesai
	}
	if v.TargetPenerima != nil && (*v.TargetPenerima < 0 || *v.TargetPenerima > 1_000_000) {
		return p, false
	}
	p.TargetPenerima, p.Lokasi, p.Keterangan = v.TargetPenerima, v.Lokasi, v.Keterangan
	for _, it := range v.Items {
		if strings.TrimSpace(it.NamaBarang) == "" || len(it.NamaBarang) > 150 || it.JumlahPerKK < 0 {
			return p, false
		}
		p.Items = append(p.Items, domain.SembakoItem{
			NamaBarang: it.NamaBarang, Satuan: orDefault(it.Satuan, "kg"),
			JumlahPerKK: it.JumlahPerKK, Keterangan: it.Keterangan,
		})
	}
	return p, true
}

func orDefault(s, def string) string {
	if strings.TrimSpace(s) == "" {
		return def
	}
	return s
}

// SembakoCreate creates a new period with items (admin).
func (h *Handler) SembakoCreate(w http.ResponseWriter, r *http.Request) {
	var v sembakoUpsertInput
	if decode(r, &v) != nil {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	p, ok := v.validate()
	if !ok {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	created, err := h.app.Sembako.Create(r.Context(), p)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	full, err := h.app.Sembako.Get(r.Context(), created.ID)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 201, toSembakoDTO([]domain.SembakoPeriod{full}, time.Now())[0])
}

// SembakoUpdate replaces a period and its items (admin).
func (h *Handler) SembakoUpdate(w http.ResponseWriter, r *http.Request) {
	var v sembakoUpsertInput
	if decode(r, &v) != nil {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	p, ok := v.validate()
	if !ok {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	updated, err := h.app.Sembako.Update(r.Context(), r.PathValue("id"), p)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, toSembakoDTO([]domain.SembakoPeriod{updated}, time.Now())[0])
}

// SembakoDelete removes a period and its items (admin).
func (h *Handler) SembakoDelete(w http.ResponseWriter, r *http.Request) {
	if err := h.app.Sembako.Delete(r.Context(), r.PathValue("id")); err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, map[string]bool{"ok": true})
}
