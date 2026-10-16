package handler

import (
	"net"
	"net/http"
	"os"
	"strings"

	httpapi "desa-anabanua-api/internal/delivery/http/apiresponse"
	"desa-anabanua-api/internal/domain"
)

// PengunjungStats returns today's, last-7-days and lifetime visitor counts.
func (h *Handler) PengunjungStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.app.Pengunjung.Stats(r.Context())
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, pengunjungStatsResp(stats))
}

// PengunjungTrack records a visit from this request (dedup per IP per day).
func (h *Handler) PengunjungTrack(w http.ResponseWriter, r *http.Request) {
	if err := h.app.Pengunjung.Track(r.Context(), clientIP(r)); err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, map[string]bool{"ok": true})
}

func pengunjungStatsResp(s domain.PengunjungStats) map[string]any {
	days := make([]map[string]any, 0, len(s.Terakhir7))
	for _, d := range s.Terakhir7 {
		days = append(days, map[string]any{
			"tanggal":    d.Tanggal,
			"pengunjung": d.Pengunjung,
			"kunjungan":  d.Kunjungan,
		})
	}
	return map[string]any{
		"hariIni": map[string]any{
			"tanggal":    s.HariIni.Tanggal,
			"pengunjung": s.HariIni.Pengunjung,
			"kunjungan":  s.HariIni.Kunjungan,
		},
		"terakhir7": days,
		"total": map[string]any{
			"pengunjung": s.TotalPengunjung,
			"kunjungan":  s.TotalKunjungan,
		},
	}
}

// clientIP trusts forwarding headers only when the TCP peer belongs to an
// explicitly configured trusted proxy CIDR. Configure TRUSTED_PROXY_CIDRS when
// running behind a reverse proxy; otherwise the peer address is used.
func clientIP(r *http.Request) string {
	peer := remoteIP(r.RemoteAddr)
	if peer != nil && isTrustedProxy(peer) {
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			// Proxies append the peer address they observed; the right-most value
			// is therefore the closest client address in the forwarded chain.
			parts := strings.Split(xff, ",")
			for i := len(parts) - 1; i >= 0; i-- {
				ip := net.ParseIP(strings.TrimSpace(parts[i]))
				if ip == nil {
					break
				}
				if !isTrustedProxy(ip) {
					return ip.String()
				}
			}
		}
		if ip := net.ParseIP(strings.TrimSpace(r.Header.Get("X-Real-IP"))); ip != nil {
			return ip.String()
		}
	}
	if peer != nil {
		return peer.String()
	}
	return "unknown"
}

func remoteIP(remoteAddr string) net.IP {
	host, _, err := net.SplitHostPort(remoteAddr)
	if err != nil {
		host = remoteAddr
	}
	return net.ParseIP(strings.Trim(host, "[]"))
}

func isTrustedProxy(ip net.IP) bool {
	for _, raw := range strings.Split(os.Getenv("TRUSTED_PROXY_CIDRS"), ",") {
		_, network, err := net.ParseCIDR(strings.TrimSpace(raw))
		if err == nil && network.Contains(ip) {
			return true
		}
	}
	return false
}
