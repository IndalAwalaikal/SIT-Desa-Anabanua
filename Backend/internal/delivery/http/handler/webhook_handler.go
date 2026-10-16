package handler

import (
	"crypto/hmac"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"strings"

	"desa-anabanua-api/internal/delivery/http/apiresponse"
	"desa-anabanua-api/internal/domain"
)

// WhatsAppDeliveryPayload adalah struktur webhook delivery receipt dari FlowKirim.
// FlowKirim mengirim POST JSON saat pesan terkirim, gagal, atau dibaca.
// Ref: https://flowkirim.com/docs/webhooks
type WhatsAppDeliveryPayload struct {
	MessageID string `json:"message_id"`
	To        string `json:"to"`
	Status    string `json:"status"` // "sent" | "delivered" | "read" | "failed"
	Timestamp int64  `json:"timestamp"`
	Error     string `json:"error,omitempty"`
}

// WebhookWhatsApp menerima delivery receipt dari FlowKirim.
// Endpoint ini tidak memerlukan autentikasi sesi (tidak ada cookie/JWT warga)
// karena dipanggil oleh server FlowKirim. Validasi dilakukan lewat header
// X-FlowKirim-Secret yang dibandingkan dengan env FLOWKIRIM_WEBHOOK_SECRET.
// Bila secret kosong di development, validasi dilewati.
//
// POST /webhook/whatsapp
func (h *Handler) WebhookWhatsApp(w http.ResponseWriter, r *http.Request) {
	// Validasi webhook secret untuk mencegah spoofing.
	// Di production FLOWKIRIM_WEBHOOK_SECRET wajib di-set.
	webhookSecret := os.Getenv("FLOWKIRIM_WEBHOOK_SECRET")
	if webhookSecret != "" {
		provided := r.Header.Get("X-FlowKirim-Secret")
		if provided == "" || !hmac.Equal([]byte(provided), []byte(webhookSecret)) {
			apiresponse.Error(w, domain.ErrUnauthorized)
			return
		}
	}

	// Baca body maksimum 64 KB.
	raw, err := io.ReadAll(io.LimitReader(r.Body, 64<<10))
	if err != nil {
		apiresponse.Error(w, fmt.Errorf("%w: gagal membaca request body: %w", domain.ErrValidation, err))
		return
	}

	var payload WhatsAppDeliveryPayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		apiresponse.Error(w, fmt.Errorf("%w: payload bukan JSON valid: %w", domain.ErrValidation, err))
		return
	}

	// Validasi field minimal.
	if strings.TrimSpace(payload.MessageID) == "" || strings.TrimSpace(payload.Status) == "" {
		apiresponse.Error(w, fmt.Errorf("%w: field message_id dan status wajib diisi", domain.ErrValidation))
		return
	}

	// Log receipt — dapat diganti dengan persistensi ke DB bila dibutuhkan.
	slog.Info("whatsapp delivery receipt",
		"message_id", payload.MessageID,
		"to", payload.To,
		"status", payload.Status,
		"timestamp", payload.Timestamp,
		"error", payload.Error,
	)

	// Respons 200 OK agar FlowKirim tidak melakukan retry.
	apiresponse.JSON(w, http.StatusOK, map[string]string{"status": "received"})
}
