// Package email provides outbound email delivery. When Mailjet credentials are
// configured the real MailjetSender is used; otherwise a NoopSender simply logs
// the message (development / local without network egress).
package email

import (
	"context"

	"log/slog"
)

// Sender delivers email. Implementations must be safe for concurrent use.
type Sender interface {
	From() string
	Send(ctx context.Context, to, subject, htmlBody string) error
}

// New returns a Mailjet sender when both credentials are set, otherwise a NoopSender that
// only logs. This lets the rest of the app stay decoupled from the delivery
// mechanism.
func New(apiKey, apiSecret, from string) Sender {
	if apiKey != "" && apiSecret != "" {
		return NewMailjet(apiKey, apiSecret, from)
	}
	slog.Info("email delivery running in NOOP mode (set MAILJET_API_KEY and MAILJET_API_SECRET to enable)")
	return NewNoop(from)
}
