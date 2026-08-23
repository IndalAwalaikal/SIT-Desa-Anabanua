package handler

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestWebhookWhatsApp_Success(t *testing.T) {
	h := &Handler{app: nil}
	payload := `{"message_id":"msg-123","to":"62812345678","status":"delivered","timestamp":1700000000}`
	req := httptest.NewRequest(http.MethodPost, "/webhook/whatsapp", bytes.NewBufferString(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	h.WebhookWhatsApp(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), `"status":"received"`)
}

func TestWebhookWhatsApp_SuccessWithSecret(t *testing.T) {
	os.Setenv("FLOWKIRIM_WEBHOOK_SECRET", "test-secret")
	defer os.Unsetenv("FLOWKIRIM_WEBHOOK_SECRET")

	h := &Handler{app: nil}
	payload := `{"message_id":"msg-123","to":"62812345678","status":"delivered","timestamp":1700000000}`
	req := httptest.NewRequest(http.MethodPost, "/webhook/whatsapp", bytes.NewBufferString(payload))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-FlowKirim-Secret", "test-secret")
	w := httptest.NewRecorder()

	h.WebhookWhatsApp(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), `"status":"received"`)
}

func TestWebhookWhatsApp_WrongSecret(t *testing.T) {
	os.Setenv("FLOWKIRIM_WEBHOOK_SECRET", "test-secret")
	defer os.Unsetenv("FLOWKIRIM_WEBHOOK_SECRET")

	h := &Handler{app: nil}
	payload := `{"message_id":"msg-123","to":"62812345678","status":"delivered","timestamp":1700000000}`
	req := httptest.NewRequest(http.MethodPost, "/webhook/whatsapp", bytes.NewBufferString(payload))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-FlowKirim-Secret", "wrong-secret")
	w := httptest.NewRecorder()

	h.WebhookWhatsApp(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestWebhookWhatsApp_MissingSecret(t *testing.T) {
	os.Setenv("FLOWKIRIM_WEBHOOK_SECRET", "test-secret")
	defer os.Unsetenv("FLOWKIRIM_WEBHOOK_SECRET")

	h := &Handler{app: nil}
	payload := `{"message_id":"msg-123","to":"62812345678","status":"delivered","timestamp":1700000000}`
	req := httptest.NewRequest(http.MethodPost, "/webhook/whatsapp", bytes.NewBufferString(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	h.WebhookWhatsApp(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestWebhookWhatsApp_InvalidJSON(t *testing.T) {
	h := &Handler{app: nil}
	payload := `{invalid-json}`
	req := httptest.NewRequest(http.MethodPost, "/webhook/whatsapp", bytes.NewBufferString(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	h.WebhookWhatsApp(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), `"code":"VALIDATION_ERROR"`)
}

func TestWebhookWhatsApp_MissingFields(t *testing.T) {
	h := &Handler{app: nil}
	payload := `{"to":"62812345678"}` // missing message_id and status
	req := httptest.NewRequest(http.MethodPost, "/webhook/whatsapp", bytes.NewBufferString(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	h.WebhookWhatsApp(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), `"code":"VALIDATION_ERROR"`)
}
