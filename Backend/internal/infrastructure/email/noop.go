package email

import (
	"context"

	"log/slog"
)

// NoopSender logs emails instead of sending them. It is the safe fallback when
// Mailjet credentials are not configured (local/dev).
type NoopSender struct{ from string }

// NewNoop creates a sender that only logs.
func NewNoop(from string) *NoopSender { return &NoopSender{from: from} }

func (n *NoopSender) From() string { return n.from }

// Send records the message via the structured logger and always succeeds.
// In NOOP (dev/local without Mailjet credentials) mode the HTML body is logged so a
// developer can read the generated OTP code from `docker compose logs backend`.
func (n *NoopSender) Send(ctx context.Context, to, subject, htmlBody string) error {
	slog.Info("noop email",
		"to", to,
		"from", n.from,
		"subject", subject,
		"body", htmlBody,
	)
	return nil
}
