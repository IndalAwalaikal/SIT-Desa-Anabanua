package email

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const mailjetAPIBase = "https://api.mailjet.com/v3.1/send"

// MailjetSender delivers email through the Sinch Mailjet Send API.
type MailjetSender struct {
	apiKey    string
	apiSecret string
	from      string
	client    *http.Client
}

// NewMailjet creates a sender backed by the Sinch Mailjet transactional email API.
func NewMailjet(apiKey, apiSecret, from string) *MailjetSender {
	return &MailjetSender{
		apiKey: apiKey, apiSecret: apiSecret, from: from,
		client: &http.Client{Timeout: 15 * time.Second},
	}
}

func (m *MailjetSender) From() string { return m.from }

// Send dispatches a single email via Mailjet. A non-2xx response yields an error.
func (m *MailjetSender) Send(ctx context.Context, to, subject, htmlBody string) error {
	payload := map[string]any{
		"Messages": []map[string]any{{
			"From":     map[string]string{"Email": m.from, "Name": "Desa Anabanua"},
			"To":       []map[string]string{{"Email": to}},
			"Subject":  subject,
			"HTMLPart": htmlBody,
		}},
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, mailjetAPIBase, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.SetBasicAuth(m.apiKey, m.apiSecret)
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/json")

	resp, err := m.client.Do(req)
	if err != nil {
		return fmt.Errorf("mailjet request failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("mailjet API returned status %d: %s", resp.StatusCode, strings.TrimSpace(string(respBody)))
	}
	return nil
}
