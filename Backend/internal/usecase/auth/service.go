// Package auth implements authentication & account use cases (business logic).
package auth

import (
	"context"
	"crypto/rand"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"log/slog"

	"desa-anabanua-api/internal/domain"
	"desa-anabanua-api/internal/pkg/apputil"
)

// Session bundles the tokens and user returned by login/register.
type Session struct {
	User         domain.User
	AccessToken  string
	RefreshToken string
	ExpiresAt     time.Time
	RefreshExpiresAt *time.Time
}

// RegisterResult is returned by Register. It deliberately does NOT include
// access/refresh tokens — the account must verify its email (via OTP) first.
type RegisterResult struct {
	Email     string
	Message   string
	EmailSent bool
}

type Service struct {
	users      UserRepository
	refreshes  RefreshTokenRepository
	otp        OTPRepository
	pending    PendingRegistrationRepository
	mailer     EmailSender
	hasher     PasswordHasher
	tokens     TokenIssuer
	tx         TxManager
	refreshTTL time.Duration
	otpTTL     time.Duration
}

func NewService(
	users UserRepository,
	refreshes RefreshTokenRepository,
	otp OTPRepository,
	pending PendingRegistrationRepository,
	mailer EmailSender,
	hasher PasswordHasher,
	tokens TokenIssuer,
	tx TxManager,
	refreshTTL, otpTTL time.Duration,
) *Service {
	return &Service{
		users: users, refreshes: refreshes, otp: otp, pending: pending, mailer: mailer, hasher: hasher,
		tokens: tokens, tx: tx, refreshTTL: refreshTTL, otpTTL: otpTTL,
	}
}

func (s *Service) Register(ctx context.Context, nama, email, password, nik, telepon, alamat string) (RegisterResult, error) {
	emailNorm := strings.ToLower(strings.TrimSpace(email))
	// Hanya akun *terverifikasi* yang memblokir pendaftaran ulang. Pendaftar yang
	// belum selesai verifikasi (hanya ada di pending_registrations) tetap boleh
	// mendaftar ulang dengan data yang sama tanpa konflik.
	if _, err := s.users.GetByEmail(ctx, emailNorm); err == nil {
		return RegisterResult{}, domain.ErrConflict
	} else if !errors.Is(err, sql.ErrNoRows) {
		return RegisterResult{}, err
	}

	if v := strings.TrimSpace(nik); v != "" {
		if _, err := s.users.GetByNIK(ctx, v); err == nil {
			return RegisterResult{}, domain.ErrConflict
		} else if !errors.Is(err, sql.ErrNoRows) {
			return RegisterResult{}, err
		}
	}

	hash, err := s.hasher.Hash(password)
	if err != nil {
		return RegisterResult{}, err
	}
	pending := domain.PendingRegistration{
		Email:        emailNorm,
		Nama:         strings.TrimSpace(nama),
		PasswordHash: hash,
		OTPCode:      generateOTPMust(),
		OTPExpiresAt: time.Now().Add(s.otpTTL),
		CreatedAt:    time.Now(),
	}
	if v := strings.TrimSpace(nik); v != "" {
		pending.NIK = &v
	}
	if v := strings.TrimSpace(telepon); v != "" {
		pending.Telepon = &v
	}
	if v := strings.TrimSpace(alamat); v != "" {
		pending.Alamat = &v
	}

	// Upsert menimpa registrasi pending lama untuk email yang sama, sehingga
	// daftar ulang tidak pernah berbenturan dengan unique key.
	if err := s.pending.Upsert(ctx, pending); err != nil {
		return RegisterResult{}, err
	}

	sent := false
	if err := s.mailer.Send(ctx, emailNorm, "Kode Verifikasi Akun Desa Anabanua", verifyEmailHTML(pending.OTPCode, s.otpTTL)); err != nil {
		slog.Warn("failed to send verification email", "error", err, "email", emailNorm)
	} else {
		sent = true
	}
	return RegisterResult{
		Email:     emailNorm,
		Message:   "Kode verifikasi telah dikirim ke email Anda. Silakan verifikasi untuk mengaktifkan akun.",
		EmailSent: sent,
	}, nil
}

func (s *Service) Login(ctx context.Context, email, password string) (Session, error) {
	user, err := s.users.GetByEmail(ctx, strings.ToLower(strings.TrimSpace(email)))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Session{}, domain.ErrInvalidEmail
		}
		return Session{}, err
	}

	// Detail matters here per user request (email tidak terdaftar vs password salah
	// dibedakan, bukan disamarkan jadi "kredensial tidak valid"). Tradeoff: ini
	// memudahkan enumerasi akun; pengamanan enumerasi diserahkan ke captcha/rate-limit
	// di layer middleware, bukan pengaburan pesan error.
	if !user.IsActive {
		return Session{}, domain.ErrAccountNotActive
	}
	if !user.EmailVerified {
		return Session{}, domain.ErrEmailNotVerified
	}
	if s.hasher.Compare(user.PasswordHash, password) != nil {
		return Session{}, domain.ErrWrongPassword
	}
	return s.issueSession(ctx, user)
}

func (s *Service) issueSession(ctx context.Context, user domain.User) (Session, error) {
	access, exp, err := s.tokens.IssueAccess(user.ID, user.Role)
	if err != nil {
		return Session{}, err
	}
	raw, err := s.tokens.NewRefresh()
	if err != nil {
		return Session{}, err
	}
	rt := domain.RefreshToken{
		ID:        apputil.NewID(),
		UserID:    user.ID,
		TokenHash: s.tokens.HashRefresh(raw),
		ExpiresAt: time.Now().Add(s.refreshTTL),
		CreatedAt: time.Now(),
		LastUsedAt: time.Now(),
	}
	if err := s.refreshes.Create(ctx, rt); err != nil {
		return Session{}, err
	}
return Session{User: user, AccessToken: access, RefreshToken: raw, ExpiresAt: exp, RefreshExpiresAt: func(t time.Time) *time.Time { return &t }(time.Now().Add(s.refreshTTL))}, nil
}

// Refresh rotates the refresh token and returns new tokens. Reuse of a rotated
// token revokes every active token for the account (theft indicator).
func (s *Service) Refresh(ctx context.Context, raw string) (access string, newRefresh string, err error) {
	if err := s.tx.WithinTx(ctx, func(txCtx context.Context) error {
		old, err := s.refreshes.GetByHashForUpdate(txCtx, s.tokens.HashRefresh(raw))
		// Reject only if expired OR explicitly revoked (covered below).
		// Idle usage window equals refresh TTL: a token idle beyond its TTL
		// was effectively abandoned, reject it.
		if err != nil || old.ExpiresAt.Before(time.Now()) {
			return domain.ErrUnauthorized
		}
		// A rotated token being reused is a strong theft signal. Revoke all
		// active sessions before rejecting it; a normal logout has no successor.
		if old.RevokedAt != nil {
			if old.ReplacedBy != nil {
				if err := s.refreshes.RevokeAllForUser(txCtx, old.UserID); err != nil {
					return err
				}
			}
			return domain.ErrUnauthorized
		}
		user, err := s.users.GetByID(txCtx, old.UserID)
		if err != nil || !user.IsActive {
			return domain.ErrUnauthorized
		}
		newRaw, err := s.tokens.NewRefresh()
		if err != nil {
			return err
		}
		newID := apputil.NewID()
		nt := domain.RefreshToken{
			ID: newID, UserID: user.ID, TokenHash: s.tokens.HashRefresh(newRaw),
			ExpiresAt: time.Now().Add(s.refreshTTL), CreatedAt: time.Now(), LastUsedAt: time.Now(),
		}
		if err := s.refreshes.Create(txCtx, nt); err != nil {
			return err
		}
		if err := s.refreshes.Rotate(txCtx, old.ID, newID); err != nil {
			return err
		}
		acc, _, err := s.tokens.IssueAccess(user.ID, user.Role)
		if err != nil {
			return err
		}
		access, newRefresh = acc, newRaw
		return nil
	}); err != nil {
		return "", "", err
	}
	return access, newRefresh, nil
}

func (s *Service) Logout(ctx context.Context, raw string) error {
	return s.refreshes.RevokeByHash(ctx, s.tokens.HashRefresh(raw))
}

func (s *Service) Me(ctx context.Context, userID string) (domain.User, error) {
	user, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return user, err
	}
	if !user.IsActive {
		return domain.User{}, domain.ErrAccountNotActive
	}
	return user, nil
}

func (s *Service) ChangePassword(ctx context.Context, userID, old, newPw string) error {
	user, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	if s.hasher.Compare(user.PasswordHash, old) != nil {
		return domain.ErrWrongPassword
	}
	hash, err := s.hasher.Hash(newPw)
	if err != nil {
		return err
	}
	if err := s.users.UpdatePassword(ctx, userID, hash); err != nil {
		return err
	}
	return s.refreshes.RevokeAllForUser(ctx, userID)
}

type ProfileInput struct {
	Nama, Email, NIK, NoKK, TempatLahir, TanggalLahir, JenisKelamin, Agama, StatusPerkawinan, Pekerjaan, RT, RW, Dusun, Telepon, Alamat, AvatarURL, PasswordBaru string
}

// UpdateProfile updates editable profile fields including demographic information.
func (s *Service) UpdateProfile(ctx context.Context, userID string, input ProfileInput) (domain.User, error) {
	user, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return user, err
	}
	if v := strings.TrimSpace(input.Nama); v != "" {
		user.Nama = v
	}
	if v := strings.TrimSpace(input.Email); v != "" {
		user.Email = strings.ToLower(v)
	}
	if v := strings.TrimSpace(input.NIK); v != "" {
		user.NIK = strPtr(v)
	}
	if v := strings.TrimSpace(input.NoKK); v != "" {
		user.NoKK = strPtr(v)
	}
	if v := strings.TrimSpace(input.TempatLahir); v != "" {
		user.TempatLahir = strPtr(v)
	}
	if v := strings.TrimSpace(input.TanggalLahir); v != "" {
		if t, err := time.Parse("2006-01-02", v); err == nil {
			user.TanggalLahir = &t
		}
	}
	if v := strings.TrimSpace(input.JenisKelamin); v != "" {
		user.JenisKelamin = strPtr(v)
	}
	if v := strings.TrimSpace(input.Agama); v != "" {
		user.Agama = strPtr(v)
	}
	if v := strings.TrimSpace(input.StatusPerkawinan); v != "" {
		user.StatusPerkawinan = strPtr(v)
	}
	if v := strings.TrimSpace(input.Pekerjaan); v != "" {
		user.Pekerjaan = strPtr(v)
	}
	if v := strings.TrimSpace(input.RT); v != "" {
		user.RT = strPtr(v)
	}
	if v := strings.TrimSpace(input.RW); v != "" {
		user.RW = strPtr(v)
	}
	if v := strings.TrimSpace(input.Dusun); v != "" {
		user.Dusun = strPtr(v)
	}
	user.Telepon = strPtr(input.Telepon)
	user.Alamat = strPtr(input.Alamat)
	user.AvatarURL = strPtr(input.AvatarURL)
	if input.PasswordBaru != "" {
		hash, err := s.hasher.Hash(input.PasswordBaru)
		if err != nil {
			return user, err
		}
		user.PasswordHash = hash
	}
	if err := s.tx.WithinTx(ctx, func(txCtx context.Context) error {
		if input.PasswordBaru != "" {
			if err := s.users.UpdatePassword(txCtx, userID, user.PasswordHash); err != nil {
				return err
			}
			if err := s.refreshes.RevokeAllForUser(txCtx, userID); err != nil {
				return err
			}
		}
		return s.users.UpdateProfile(txCtx, user)
	}); err != nil {
		return user, err
	}
	return user, nil
}

func (s *Service) BootstrapSuperAdmin(ctx context.Context, nama, email, password string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	user, err := s.users.GetByEmail(ctx, email)
	if err == nil {
		if user.Role != domain.RoleSuperAdmin || !user.IsActive {
			return domain.ErrConflict
		}
		return nil
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return err
	}
	hash, err := s.hasher.Hash(password)
	if err != nil {
		return err
	}
	return s.users.Create(ctx, domain.User{
		ID: apputil.NewID(), Nama: strings.TrimSpace(nama), Email: email, PasswordHash: hash,
		Role: domain.RoleSuperAdmin, EmailVerified: true, IsActive: true, CreatedAt: time.Now(),
	})
}

func strPtr(v string) *string {
	v = strings.TrimSpace(v)
	if v == "" {
		return nil
	}
	return &v
}

func generateOTP() (string, error) {
	b := make([]byte, 3)
	// ponytail: do NOT fall back to time-based pseudo-randomness —
	// a CSPRNG failure here means OTP cannot be safely generated at all.
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	code := int(b[0])<<16 | int(b[1])<<8 | int(b[2])
	return fmt.Sprintf("%06d", code%1000000), nil
}

// generateOTPMust is the call-site helper: OTP generation is best-effort and
// panics on CSPRNG failure (which would also break CSRF, so safe to abort).
func generateOTPMust() string {
	code, err := generateOTP()
	if err != nil {
		panic("crypto/rand failed: " + err.Error())
	}
	return code
}

func otpMinutes(ttl time.Duration) int {
	m := int(ttl / time.Minute)
	if m <= 0 {
		m = 10
	}
	return m
}

func verifyEmailHTML(code string, ttl time.Duration) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Kode Verifikasi Akun Desa Anabanua</title></head>
<body style="font-family:Arial,sans-serif;background:#f5f7fa;padding:32px;color:#1f2937">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 4px 16px rgba(0,0,0,.06)">
<h1 style="color:#2563eb;font-size:22px;margin:0 0 16px">Verifikasi Akun Desa Anabanua</h1>
<p style="margin:0 0 16px">Hai,</p>
<p style="margin:0 0 16px">Terima kasih telah mendaftar. Gunakan kode verifikasi di bawah ini untuk mengaktifkan akun Anda.</p>
<div style="background:#f0f9ff;border:1px dashed #3b82f6;border-radius:8px;padding:20px;text-align:center;margin:20px 0">
<span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#2563eb">%s</span>
</div>
<p style="margin:0 0 16px;font-size:13px;color:#6b7280">Kode ini berlaku selama <strong>%d menit</strong>. Jika tidak meminta ini, abaikan email ini.</p>
<p style="margin:0">Salam hangat,<br><strong>Desa Anabanua</strong></p>
</div></div>
</body></html>`, code, otpMinutes(ttl))
}

func resetPasswordHTML(code string, ttl time.Duration) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Kode Reset Password Desa Anabanua</title></head>
<body style="font-family:Arial,sans-serif;background:#f5f7fa;padding:32px;color:#1f2937">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 4px 16px rgba(0,0,0,.06)">
<h1 style="color:#2563eb;font-size:22px;margin:0 0 16px">Reset Password Akun</h1>
<p style="margin:0 0 16px">Hai,</p>
<p style="margin:0 0 16px">Kami menerima permintaan reset password akun Desa Anabanua Anda. Gunakan kode di bawah ini.</p>
<div style="background:#f0f9ff;border:1px dashed #3b82f6;border-radius:8px;padding:20px;text-align:center;margin:20px 0">
<span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#2563eb">%s</span>
</div>
<p style="margin:0 0 16px;font-size:13px;color:#6b7280">Kode ini berlaku selama <strong>%d menit</strong>. Jika tidak meminta ini, abaikan email ini.</p>
<p style="margin:0">Salam hangat,<br><strong>Desa Anabanua</strong></p>
</div></div>
</body></html>`, code, otpMinutes(ttl))
}

// VerifyOTP validates a verify_email OTP, promotes the pending registration to
// a real account and returns a fresh session. User creation and pending
// deletion are wrapped in a transaction so a crash mid-flight cannot leave an
// orphan pending registration tied to a verified account.
func (s *Service) VerifyOTP(ctx context.Context, email, code string) (Session, error) {
	emailNorm := strings.ToLower(strings.TrimSpace(email))
	pending, err := s.pending.GetByEmail(ctx, emailNorm)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Session{}, domain.ErrOTPNotFound
		}
		return Session{}, err
	}
	if !pending.IsValid() || pending.OTPCode != code {
		return Session{}, domain.ErrOTPInvalid
	}
	// Guard: jangan membuat user jika akun terverifikasi ternyata sudah dibuat
	// (mis. race / double submit).
	if _, err := s.users.GetByEmail(ctx, emailNorm); err == nil {
		return Session{}, domain.ErrConflict
	} else if !errors.Is(err, sql.ErrNoRows) {
		return Session{}, err
	}

	user := domain.User{
		ID:            apputil.NewID(),
		Nama:          pending.Nama,
		Email:         pending.Email,
		PasswordHash:  pending.PasswordHash,
		NIK:           pending.NIK,
		Telepon:       pending.Telepon,
		Alamat:        pending.Alamat,
		EmailVerified: true,
		Role:          domain.RoleWarga,
		IsActive:      true,
		CreatedAt:     time.Now(),
	}
	if err := s.tx.WithinTx(ctx, func(txCtx context.Context) error {
		if err := s.users.Create(txCtx, user); err != nil {
			return err
		}
		if err := s.pending.DeleteByEmail(txCtx, emailNorm); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return Session{}, err
	}
	return s.issueSession(ctx, user)
}

// ResendOTP re-issues a verification OTP for a pending (un-verified) account.
func (s *Service) ResendOTP(ctx context.Context, email string) error {
	emailNorm := strings.ToLower(strings.TrimSpace(email))
	pending, err := s.pending.GetByEmail(ctx, emailNorm)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			// Jika akun terverifikasi sudah ada, beri tahu pengguna bahwa akun aktif.
			if _, uerr := s.users.GetByEmail(ctx, emailNorm); uerr == nil {
				return domain.ErrEmailAlreadyVerified
			}
			return domain.ErrNotFound
		}
		return err
	}
	pending.OTPCode = generateOTPMust()
	pending.OTPExpiresAt = time.Now().Add(s.otpTTL)
	if err := s.pending.Upsert(ctx, pending); err != nil {
		return err
	}
	if err := s.mailer.Send(ctx, emailNorm, "Kode Verifikasi Akun Desa Anabanua", verifyEmailHTML(pending.OTPCode, s.otpTTL)); err != nil {
		slog.Warn("failed to resend verification email", "error", err, "email", emailNorm)
		return domain.ErrEmailSendFailed
	}
	return nil
}

// ForgotPassword issues a reset_password OTP. It does not reveal whether the
// email is registered (always returns nil on not-found).
func (s *Service) ForgotPassword(ctx context.Context, email string) error {
	user, err := s.users.GetByEmail(ctx, strings.ToLower(strings.TrimSpace(email)))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil
		}
		return err
	}
	code := generateOTPMust()
	otp := domain.OTP{
		ID: apputil.NewID(), UserID: user.ID, Code: code,
		Purpose:   domain.OTPPurposeResetPassword,
		ExpiresAt: time.Now().Add(s.otpTTL),
		CreatedAt: time.Now(),
	}
	_ = s.otp.InvalidateByUserPurpose(ctx, user.ID, domain.OTPPurposeResetPassword)
	if err := s.otp.Create(ctx, otp); err != nil {
		return err
	}
	return s.mailer.Send(ctx, user.Email, "Kode Reset Password Desa Anabanua", resetPasswordHTML(code, s.otpTTL))
}

// ResetPassword validates a reset_password OTP and updates the password,
// revoking all active sessions for the account.
func (s *Service) ResetPassword(ctx context.Context, email, code, newPassword string) error {
	if len(newPassword) < 8 || len(newPassword) > 128 {
		return domain.ErrValidation
	}
	user, err := s.users.GetByEmail(ctx, strings.ToLower(strings.TrimSpace(email)))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return domain.ErrOTPInvalid
		}
		return err
	}
	otp, err := s.otp.GetLatestByUserPurpose(ctx, user.ID, domain.OTPPurposeResetPassword)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return domain.ErrOTPNotFound
		}
		return err
	}
	if !otp.IsValid() || otp.Code != code {
		return domain.ErrOTPInvalid
	}
	if err := s.otp.InvalidateByUserPurpose(ctx, user.ID, domain.OTPPurposeResetPassword); err != nil {
		return err
	}
	hash, err := s.hasher.Hash(newPassword)
	if err != nil {
		return err
	}
	if err := s.users.UpdatePassword(ctx, user.ID, hash); err != nil {
		return err
	}
	return s.refreshes.RevokeAllForUser(ctx, user.ID)
}
