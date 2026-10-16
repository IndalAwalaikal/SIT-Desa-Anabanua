package handler

import (
	"net/http"
	"time"

	httpapi "desa-anabanua-api/internal/delivery/http/apiresponse"
)

func (h *Handler) AnalyticsDashboard(w http.ResponseWriter, r *http.Request) {
	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	pengajuanByStatus, err := h.app.Persuratan.CountByStatus(r.Context())
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	pengaduanByStatus, err := h.app.Pengaduan.CountByStatus(r.Context())
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	total := func(counts map[string]int) int {
		n := 0
		for _, count := range counts {
			n += count
		}
		return n
	}
	httpapi.JSON(w, 200, map[string]any{
		"period": map[string]string{
			"start": startOfMonth.Format("2006-01-02"),
			"end":   now.Format("2006-01-02"),
		},
		"pengajuan": map[string]any{
			"total":    total(pengajuanByStatus),
			"byStatus": pengajuanByStatus,
		},
		"pengaduan": map[string]any{
			"total":    total(pengaduanByStatus),
			"byStatus": pengaduanByStatus,
		},
	})
}
