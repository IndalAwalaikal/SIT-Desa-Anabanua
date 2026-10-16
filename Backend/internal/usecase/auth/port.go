package auth

import (
	"context"
	"time"

	"desa-anabanua-api/internal/domain"
)

// UserRepository persists user accounts.
type UserRepository interface {
	Create(ctx context.Context, user domain.User) error
	GetByID(ctx context.Context, id string) (domain.User, error)
	GetByEmail(ctx context.Context, email string) (domain.User, error)
	GetByNIK(ctx context.Context, nik string) (domain.User, error)
	UpdateProfile(ctx context.Context, user domain.User) error
	UpdatePassword(ctx context.Context, id, hash string) error
	UpdateEmailVerified(ctx context.Context, id string, verified bool) error
	UpdateRole(ctx context.Context, id string, role domain.Role, isActive bool) error
}

// RefreshTokenRepository persists and rotates refresh tokens.
type RefreshTokenRepository interface {
	Create(ctx context.Context, token domain.RefreshToken) error
	GetByHashForUpdate(ctx context.Context, hash string) (domain.RefreshToken, error)
	Rotate(ctx context.Context, oldID, newID string) error
	RevokeByHash(ctx context.Context, hash string) error
	RevokeAllForUser(ctx context.Context, userID string) error
}

// PasswordHasher hashes and verifies passwords.
type PasswordHasher interface {
	Hash(password string) (string, error)
	Compare(hash, password string) error
}

// TokenIssuer issues access tokens and refresh tokens.
type TokenIssuer interface {
	IssueAccess(userID string, role domain.Role) (token string, expiresAt time.Time, err error)
	NewRefresh() (string, error)
	HashRefresh(raw string) string
}

// TxManager runs a function inside a database transaction.
type TxManager interface {
	WithinTx(ctx context.Context, fn func(ctx context.Context) error) error
}

// PendingRegistrationRepository stores accounts that are still awaiting email
// OTP verification (register flow). Keyed by unique email; upserting replaces a
// prior pending registration so a re-registration never conflicts.
type PendingRegistrationRepository interface {
	Upsert(ctx context.Context, p domain.PendingRegistration) error
	GetByEmail(ctx context.Context, email string) (domain.PendingRegistration, error)
	DeleteByEmail(ctx context.Context, email string) error
}

// OTPRepository persists one-time passcodes for verify_email / reset_password.
type OTPRepository interface {
	Create(ctx context.Context, otp domain.OTP) error
	// GetLatestByUserPurpose returns the most recent unused OTP for a user+purpose.
	GetLatestByUserPurpose(ctx context.Context, userID, purpose string) (domain.OTP, error)
	// InvalidateByUserPurpose marks all pending OTPs for a user+purpose as used.
	InvalidateByUserPurpose(ctx context.Context, userID, purpose string) error
}

// EmailSender delivers outbound email (Mailjet or noop). Defined here so the
// use case stays decoupled from the email infrastructure package.
type EmailSender interface {
	Send(ctx context.Context, to, subject, htmlBody string) error
}
