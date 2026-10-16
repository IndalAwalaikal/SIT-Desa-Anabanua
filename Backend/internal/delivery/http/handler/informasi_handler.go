package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	httpapi "desa-anabanua-api/internal/delivery/http/apiresponse"
	"desa-anabanua-api/internal/domain"
)

func (h *Handler) StatistikGet(w http.ResponseWriter, r *http.Request) {
	tahun, _ := strconv.Atoi(r.URL.Query().Get("tahun"))
	s, err := h.app.Finance.GetStatistik(r.Context(), tahun)
	if err != nil && errors.Is(err, domain.ErrNotFound) {
		httpapi.JSON(w, 200, domain.StatistikData{})
		return
	}
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, s.Data)
}

// StatistikTrenGet serves the monthly birth/death/move trend for the chart.
func (h *Handler) StatistikTrenGet(w http.ResponseWriter, r *http.Request) {
	tahun, _ := strconv.Atoi(r.URL.Query().Get("tahun"))
	tren, err := h.app.Finance.GetTrenBulanan(r.Context(), tahun)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, tren)
}

func (h *Handler) StatistikUpdate(w http.ResponseWriter, r *http.Request) {
	var patch map[string]json.RawMessage
	if decode(r, &patch) != nil {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	if len(patch) == 0 {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	allowed := map[string]bool{
		"tahun": true, "totalPenduduk": true, "lakiLaki": true, "perempuan": true, "jumlahKK": true,
		"perDusun": true, "rincianDusun": true, "perKelompokUsia": true, "perPendidikan": true,
		"perPekerjaan": true, "perAgama": true,
	}
	for key := range patch {
		if !allowed[key] {
			httpapi.Error(w, domain.ErrValidation)
			return
		}
	}
	tahun := 0
	if raw, ok := patch["tahun"]; ok && json.Unmarshal(raw, &tahun) != nil {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	existing, err := h.app.Finance.GetStatistik(r.Context(), tahun)
	if err != nil && !errors.Is(err, domain.ErrNotFound) {
		httpapi.Error(w, err)
		return
	}
	base := existing.Data
	if err != nil {
		base = domain.StatistikData{}
	}
	var merged map[string]json.RawMessage
	raw, err := json.Marshal(base)
	if err != nil || json.Unmarshal(raw, &merged) != nil {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	for key, value := range patch {
		merged[key] = value
	}
	if raw, ok := merged["tahun"]; !ok || json.Unmarshal(raw, &tahun) != nil {
		tahun = 0
	}
	if tahun < 1 {
		tahun = time.Now().Year()
	}
	merged["tahun"], _ = json.Marshal(tahun)
	nextRaw, err := json.Marshal(merged)
	if err != nil {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	var next domain.StatistikData
	if json.Unmarshal(nextRaw, &next) != nil || !validStatistik(next) {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	next.Tahun = tahun
	updated, err := h.app.Finance.UpdateStatistik(r.Context(), domain.StatistikPenduduk{Tahun: tahun, Data: next})
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, updated.Data)
}

func (h *Handler) StatistikTrenUpdate(w http.ResponseWriter, r *http.Request) {
	var v struct {
		Tahun int                       `json:"tahun"`
		Data  []domain.StatistikBulanan `json:"data"`
	}
	if decode(r, &v) != nil || v.Tahun < 1 {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	if err := h.app.Finance.UpdateTrenBulanan(r.Context(), v.Tahun, v.Data); err != nil {
		httpapi.Error(w, err)
		return
	}
	updated, err := h.app.Finance.GetTrenBulanan(r.Context(), v.Tahun)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, updated)
}

// StatistikTrenUpdate replaces the monthly demographic trend for a year.
// Body: { "tahun": 2025, "data": [ { "bulan":1, ... }, ... ] }

// ApbdesGet returns the APBDes summary for a given year/period.
func (h *Handler) ApbdesGet(w http.ResponseWriter, r *http.Request) {
	tahun, _ := strconv.Atoi(r.URL.Query().Get("tahun"))
	bulan, _ := strconv.Atoi(r.URL.Query().Get("bulan"))
	triwulan, _ := strconv.Atoi(r.URL.Query().Get("triwulan"))
	a, err := h.app.Finance.GetApbdes(r.Context(), tahun, bulan, triwulan)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, a)
}

func (h *Handler) ApbdesUpdate(w http.ResponseWriter, r *http.Request) {
	var v struct {
		Tahun    int  `json:"tahun"`
		Bulan    *int `json:"bulan"`
		Triwulan *int `json:"triwulan"`
		Items    []struct {
			Kategori    string  `json:"kategori"`
			SubKategori string  `json:"subKategori"`
			Jumlah      float64 `json:"jumlah"`
		} `json:"items"`
	}
	if decode(r, &v) != nil {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	bulan, triwulan := 0, 0
	if v.Bulan != nil {
		bulan = *v.Bulan
	}
	if v.Triwulan != nil {
		triwulan = *v.Triwulan
	}
	if (bulan < 0 || bulan > 12) || (triwulan < 0 || triwulan > 4) || (bulan > 0 && triwulan > 0) {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	items := make([]domain.ApbdesItem, 0, len(v.Items))
	for _, it := range v.Items {
		if !one(it.Kategori, "pendapatan", "belanja") || !valid(it.SubKategori, 2, 150) || it.Jumlah < 0 {
			httpapi.Error(w, domain.ErrValidation)
			return
		}
		items = append(items, domain.ApbdesItem{Kategori: it.Kategori, SubKategori: it.SubKategori, Jumlah: it.Jumlah})
	}
	a, err := h.app.Finance.UpdateApbdes(r.Context(), v.Tahun, bulan, triwulan, items)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, a)
}

func validStatistik(s domain.StatistikData) bool {
	if s.Tahun < 2000 || s.Tahun > time.Now().Year()+5 || s.TotalPenduduk < 0 || s.LakiLaki < 0 || s.Perempuan < 0 || s.JumlahKK < 0 {
		return false
	}
	if s.TotalPenduduk != s.LakiLaki+s.Perempuan {
		return false
	}
	for _, item := range s.PerDusun {
		if !valid(item.Dusun, 1, 100) || item.Jumlah < 0 {
			return false
		}
	}
	for _, item := range s.RincianDusun {
		if !valid(item.Dusun, 1, 100) || item.LakiLaki < 0 || item.Perempuan < 0 || item.KepalaKeluarga < 0 || item.Kelahiran < 0 || item.Kematian < 0 || item.PindahMasuk < 0 || item.PindahKeluar < 0 {
			return false
		}
	}
	for _, item := range s.PerKelompokUsia {
		if !valid(item.Rentang, 1, 100) || item.Jumlah < 0 {
			return false
		}
	}
	for _, item := range s.PerPendidikan {
		if !valid(item.Jenjang, 1, 100) || item.Jumlah < 0 {
			return false
		}
	}
	for _, item := range s.PerPekerjaan {
		if !valid(item.Pekerjaan, 1, 100) || item.Jumlah < 0 {
			return false
		}
	}
	for _, item := range s.PerAgama {
		if !valid(item.Agama, 1, 100) || item.Jumlah < 0 {
			return false
		}
	}
	return true
}

func (h *Handler) AgendaList(w http.ResponseWriter, r *http.Request) {
	tahun, _ := strconv.Atoi(r.URL.Query().Get("tahun"))
	items, err := h.app.Finance.ListAgenda(r.Context(), tahun)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, items)
}

func (h *Handler) AgendaCreate(w http.ResponseWriter, r *http.Request) {
	v, ok := decodeAgenda(r)
	if !ok {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	a, err := h.app.Finance.CreateAgenda(r.Context(), v)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 201, a)
}

func (h *Handler) AgendaUpdate(w http.ResponseWriter, r *http.Request) {
	v, ok := decodeAgenda(r)
	if !ok {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	a, err := h.app.Finance.UpdateAgenda(r.Context(), r.PathValue("id"), v)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, a)
}

func (h *Handler) AgendaDelete(w http.ResponseWriter, r *http.Request) {
	if err := h.app.Finance.DeleteAgenda(r.Context(), r.PathValue("id")); err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, map[string]bool{"ok": true})
}

func decodeAgenda(r *http.Request) (domain.AgendaKegiatan, bool) {
	var v struct {
		Judul, Deskripsi, TanggalMulai, Lokasi, Penyelenggara, Kategori string
		TanggalSelesai                                                  *string
	}
	if decode(r, &v) != nil || !valid(v.Judul, 3, 200) || !valid(v.Deskripsi, 3, 10000) || !valid(v.Lokasi, 2, 255) || !valid(v.Penyelenggara, 2, 150) || !one(v.Kategori, "musyawarah", "gotong-royong", "pelatihan", "perayaan", "lainnya") {
		return domain.AgendaKegiatan{}, false
	}
	mulai, err := time.Parse(time.RFC3339, v.TanggalMulai)
	if err != nil {
		return domain.AgendaKegiatan{}, false
	}
	a := domain.AgendaKegiatan{
		Judul: v.Judul, Deskripsi: v.Deskripsi, TanggalMulai: mulai,
		Lokasi: v.Lokasi, Penyelenggara: v.Penyelenggara, Kategori: v.Kategori,
	}
	if v.TanggalSelesai != nil {
		selesai, err := time.Parse(time.RFC3339, *v.TanggalSelesai)
		if err != nil || selesai.Before(mulai) {
			return domain.AgendaKegiatan{}, false
		}
		a.TanggalSelesai = &selesai
	}
	return a, true
}
