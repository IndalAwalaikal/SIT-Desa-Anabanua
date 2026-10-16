package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	httpapi "desa-anabanua-api/internal/delivery/http/apiresponse"
	"desa-anabanua-api/internal/delivery/http/middleware"
	"desa-anabanua-api/internal/domain"
)

func (h *Handler) NotifikasiList(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.PrincipalFrom(r.Context())
	if !ok {
		httpapi.Error(w, domain.ErrUnauthorized)
		return
	}
	items, err := h.app.Notifikasi.ListByUser(r.Context(), userID.ID)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, items)
}

func (h *Handler) NotifikasiCountUnread(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.PrincipalFrom(r.Context())
	if !ok {
		httpapi.Error(w, domain.ErrUnauthorized)
		return
	}
	count, err := h.app.Notifikasi.CountUnread(r.Context(), userID.ID)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, map[string]any{"unread": count})
}

func (h *Handler) NotifikasiMarkRead(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.PrincipalFrom(r.Context())
	if !ok {
		httpapi.Error(w, domain.ErrUnauthorized)
		return
	}
	id := r.PathValue("id")
	if err := h.app.Notifikasi.MarkAsRead(r.Context(), id, userID.ID); err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, map[string]bool{"ok": true})
}

func (h *Handler) NotifikasiMarkAllRead(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.PrincipalFrom(r.Context())
	if !ok {
		httpapi.Error(w, domain.ErrUnauthorized)
		return
	}
	if err := h.app.Notifikasi.MarkAllAsRead(r.Context(), userID.ID); err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, map[string]bool{"ok": true})
}

func (h *Handler) NotifikasiStream(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.PrincipalFrom(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	// NOTE: We intentionally do NOT set "Access-Control-Allow-Origin" here.
	// The outer middleware.Common handler sets it dynamically based on the
	// request Origin (and Vary: Origin) so that withCredentials cookies
	// (access_token / refresh_token) are accepted. A wildcard "*") would be
	// rejected by browsers for credentialed requests.

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	ch, cleanup := h.app.Notifikasi.Subscribe(userID.ID)
	defer cleanup()

	// Initial connection message
	_, _ = fmt.Fprintf(w, "event: connected\ndata: {\"status\":\"ok\"}\n\n")
	flusher.Flush()

	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-r.Context().Done():
			return
		case n, ok := <-ch:
			if !ok {
				return
			}
			data, err := json.Marshal(n)
			if err != nil {
				continue
			}
			_, _ = fmt.Fprintf(w, "event: notification\ndata: %s\n\n", string(data))
			flusher.Flush()
		case <-ticker.C:
			// Heartbeat ping
			_, _ = fmt.Fprintf(w, "event: ping\ndata: {}\n\n")
			flusher.Flush()
		}
	}
}
