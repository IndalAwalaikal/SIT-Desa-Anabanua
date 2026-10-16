package auth

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"testing"
	"time"

	"desa-anabanua-api/internal/domain"
)

// ---- fakes ----

type fakeUsers struct {
	byEmail   map[string]domain.User
	byNIK     map[string]domain.User
	created   []domain.User
	passwords map[string]string // userID -> hash
}

func newFakeUsers() *fakeUsers {
	return &fakeUsers{byEmail: map[string]domain.User{}, byNIK: map[string]domain.User{}, passwords: map[string]string{}}
}
func (f *fakeUsers) Create(_ context.Context, u domain.User) error {
	f.created = append(f.created, u)
	return nil
}
func (f *fakeUsers) GetByID(_ context.Context, _ string) (domain.User, error) {
	return domain.User{}, sql.ErrNoRows
}
func (f *fakeUsers) GetByEmail(_ context.Context, email string) (domain.User, error) {
	if u, ok := f.byEmail[email]; ok {
		return u, nil
	}
	return domain.User{}, sql.ErrNoRows
}
func (f *fakeUsers) GetByNIK(_ context.Context, nik string) (domain.User, error) {
	if u, ok := f.byNIK[nik]; ok {
		return u, nil
	}
	return domain.User{}, sql.ErrNoRows
}
func (f *fakeUsers) UpdateProfile(_ context.Context, _ domain.User) error { return nil }
func (f *fakeUsers) UpdatePassword(_ context.Context, id, hash string) error {
	f.passwords[id] = hash
	return nil
}
func (f *fakeUsers) UpdateEmailVerified(_ context.Context, _ string, _ bool) error       { return nil }
func (f *fakeUsers) UpdateRole(_ context.Context, _ string, _ domain.Role, _ bool) error { return nil }

type fakeRefreshes struct{ revokedAll []string }

func (f *fakeRefreshes) Create(_ context.Context, _ domain.RefreshToken) error { return nil }
func (f *fakeRefreshes) GetByHashForUpdate(_ context.Context, _ string) (domain.RefreshToken, error) {
	return domain.RefreshToken{}, sql.ErrNoRows
}
func (f *fakeRefreshes) Rotate(_ context.Context, _, _ string) error    { return nil }
func (f *fakeRefreshes) RevokeByHash(_ context.Context, _ string) error { return nil }
func (f *fakeRefreshes) RevokeAllForUser(_ context.Context, uid string) error {
	f.revokedAll = append(f.revokedAll, uid)
	return nil
}

type fakeHasher struct{}

func (fakeHasher) Hash(p string) (string, error) { return "hashed-" + p, nil }
func (fakeHasher) Compare(hash, p string) error {
	if hash != "hashed-"+p {
		return errors.New("mismatch")
	}
	return nil
}

type fakeTokens struct{}

func (fakeTokens) IssueAccess(userID string, _ domain.Role) (string, time.Time, error) {
	return "access-" + userID, time.Now().Add(15 * time.Minute), nil
}
func (fakeTokens) NewRefresh() (string, error)   { return "refresh-raw", nil }
func (fakeTokens) HashRefresh(raw string) string { return "hash-" + raw }

type fakeTx struct{}

func (fakeTx) WithinTx(ctx context.Context, fn func(context.Context) error) error { return fn(ctx) }

type fakePending struct {
	upsert []domain.PendingRegistration
	store  map[string]domain.PendingRegistration
}

func newFakePending() *fakePending {
	return &fakePending{store: map[string]domain.PendingRegistration{}}
}
func (f *fakePending) Upsert(_ context.Context, p domain.PendingRegistration) error {
	f.store[strings.ToLower(p.Email)] = p
	f.upsert = append(f.upsert, p)
	return nil
}
func (f *fakePending) GetByEmail(_ context.Context, email string) (domain.PendingRegistration, error) {
	if p, ok := f.store[strings.ToLower(email)]; ok {
		return p, nil
	}
	return domain.PendingRegistration{}, sql.ErrNoRows
}
func (f *fakePending) DeleteByEmail(_ context.Context, email string) error {
	delete(f.store, strings.ToLower(email))
	return nil
}

type fakeOTP struct {
	latest      map[string]domain.OTP // key: userID|purpose
	invalidated []string
}

func newFakeOTP() *fakeOTP                 { return &fakeOTP{latest: map[string]domain.OTP{}} }
func otpKey(userID, purpose string) string { return userID + "|" + purpose }
func (f *fakeOTP) Create(_ context.Context, o domain.OTP) error {
	f.latest[otpKey(o.UserID, o.Purpose)] = o
	return nil
}
func (f *fakeOTP) GetLatestByUserPurpose(_ context.Context, uid, purpose string) (domain.OTP, error) {
	if o, ok := f.latest[otpKey(uid, purpose)]; ok {
		return o, nil
	}
	return domain.OTP{}, sql.ErrNoRows
}
func (f *fakeOTP) InvalidateByUserPurpose(_ context.Context, uid, purpose string) error {
	key := otpKey(uid, purpose)
	f.invalidated = append(f.invalidated, key)
	delete(f.latest, key)
	return nil
}

type fakeMailer struct{ sent int }

func (f *fakeMailer) Send(_ context.Context, _, _, _ string) error { f.sent++; return nil }

// ---- helpers ----

func newTestService(users *fakeUsers, pending *fakePending, otp *fakeOTP, mailer *fakeMailer, refreshes *fakeRefreshes) *Service {
	return NewService(users, refreshes, otp, pending, mailer, fakeHasher{}, fakeTokens{}, fakeTx{}, 720*time.Hour, 10*time.Minute)
}

// ---- tests ----

func TestRegisterSuccess(t *testing.T) {
	users := newFakeUsers()
	pending := newFakePending()
	mailer := &fakeMailer{}
	svc := newTestService(users, pending, newFakeOTP(), mailer, &fakeRefreshes{})

	res, err := svc.Register(context.Background(), " Andi ", "Andi@Example.COM", "password123", "", "", "")
	if err != nil {
		t.Fatalf("Register() error = %v", err)
	}
	if res.Email != "andi@example.com" {
		t.Errorf("Email = %q, want dinormalisasi ke lowercase", res.Email)
	}
	if len(pending.upsert) != 1 {
		t.Fatalf("pending upsert dipanggil %d kali, want 1", len(pending.upsert))
	}
	stored := pending.upsert[0]
	if !strings.HasPrefix(stored.PasswordHash, "hashed-") {
		t.Errorf("PasswordHash tidak di-hash: %q", stored.PasswordHash)
	}
	if stored.OTPCode == "" {
		t.Error("OTPCode tidak boleh kosong")
	}
	if mailer.sent != 1 {
		t.Errorf("email verifikasi terkirim %d kali, want 1", mailer.sent)
	}
}

func TestRegisterConflictVerifiedEmail(t *testing.T) {
	users := newFakeUsers()
	users.byEmail["andi@example.com"] = domain.User{ID: "u-1", Email: "andi@example.com"}
	pending := newFakePending()
	svc := newTestService(users, pending, newFakeOTP(), &fakeMailer{}, &fakeRefreshes{})

	if _, err := svc.Register(context.Background(), "Andi", "andi@example.com", "password123", "", "", ""); !errors.Is(err, domain.ErrConflict) {
		t.Errorf("Register() error = %v, want ErrConflict untuk email terverifikasi", err)
	}
}

func TestRegisterConflictNIK(t *testing.T) {
	users := newFakeUsers()
	users.byNIK["3208010101900001"] = domain.User{ID: "u-2"}
	svc := newTestService(users, newFakePending(), newFakeOTP(), &fakeMailer{}, &fakeRefreshes{})

	if _, err := svc.Register(context.Background(), "Andi", "baru@example.com", "password123", "3208010101900001", "", ""); !errors.Is(err, domain.ErrConflict) {
		t.Errorf("Register() error = %v, want ErrConflict untuk NIK terdaftar", err)
	}
}

func TestResendOTPEmailUnknown(t *testing.T) {
	svc := newTestService(newFakeUsers(), newFakePending(), newFakeOTP(), &fakeMailer{}, &fakeRefreshes{})

	if err := svc.ResendOTP(context.Background(), "ghost@example.com"); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("ResendOTP() error = %v, want ErrNotFound", err)
	}
}

func TestResendOTPAlreadyVerified(t *testing.T) {
	users := newFakeUsers()
	users.byEmail["aktif@example.com"] = domain.User{ID: "u-1", EmailVerified: true}
	svc := newTestService(users, newFakePending(), newFakeOTP(), &fakeMailer{}, &fakeRefreshes{})

	if err := svc.ResendOTP(context.Background(), "aktif@example.com"); !errors.Is(err, domain.ErrEmailAlreadyVerified) {
		t.Errorf("ResendOTP() error = %v, want ErrEmailAlreadyVerified", err)
	}
}

func TestForgotPasswordAntiEnumeration(t *testing.T) {
	mailer := &fakeMailer{}
	svc := newTestService(newFakeUsers(), newFakePending(), newFakeOTP(), mailer, &fakeRefreshes{})

	// Email tak dikenal harus tetap sukses agar tidak membocorkan daftar akun.
	if err := svc.ForgotPassword(context.Background(), "tidakada@example.com"); err != nil {
		t.Errorf("ForgotPassword() error = %v, want nil (anti-enumeration)", err)
	}
	if mailer.sent != 0 {
		t.Errorf("email terkirim %d kali, want 0", mailer.sent)
	}
}

func TestResetPasswordValidation(t *testing.T) {
	users := newFakeUsers()
	users.byEmail["u@example.com"] = domain.User{ID: "u-1", Email: "u@example.com"}
	svc := newTestService(users, newFakePending(), newFakeOTP(), &fakeMailer{}, &fakeRefreshes{})

	cases := []struct {
		name    string
		newPass string
		wantErr error
	}{
		{"terlalu pendek", "short", domain.ErrValidation},
		{"terlalu panjang", strings.Repeat("a", 129), domain.ErrValidation},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			err := svc.ResetPassword(context.Background(), "u@example.com", "123456", c.newPass)
			if !errors.Is(err, c.wantErr) {
				t.Errorf("ResetPassword() error = %v, want %v", err, c.wantErr)
			}
		})
	}
}

func TestResetPasswordWrongCode(t *testing.T) {
	users := newFakeUsers()
	users.byEmail["u@example.com"] = domain.User{ID: "u-1", Email: "u@example.com"}
	otpRepo := newFakeOTP()
	_ = otpRepo.Create(context.Background(), domain.OTP{
		ID: "otp-1", UserID: "u-1", Code: "654321",
		Purpose: domain.OTPPurposeResetPassword, ExpiresAt: time.Now().Add(5 * time.Minute),
	})
	svc := newTestService(users, newFakePending(), otpRepo, &fakeMailer{}, &fakeRefreshes{})

	if err := svc.ResetPassword(context.Background(), "u@example.com", "111111", "newpassword123"); !errors.Is(err, domain.ErrOTPInvalid) {
		t.Errorf("ResetPassword() error = %v, want ErrOTPInvalid", err)
	}
}

func TestResetPasswordSuccessRevokesSessions(t *testing.T) {
	users := newFakeUsers()
	users.byEmail["u@example.com"] = domain.User{ID: "u-1", Email: "u@example.com"}
	otpRepo := newFakeOTP()
	code := "654321"
	_ = otpRepo.Create(context.Background(), domain.OTP{
		ID: "otp-1", UserID: "u-1", Code: code,
		Purpose: domain.OTPPurposeResetPassword, ExpiresAt: time.Now().Add(5 * time.Minute),
	})
	refreshes := &fakeRefreshes{}
	svc := newTestService(users, newFakePending(), otpRepo, &fakeMailer{}, refreshes)

	if err := svc.ResetPassword(context.Background(), "u@example.com", code, "newpassword123"); err != nil {
		t.Fatalf("ResetPassword() error = %v", err)
	}
	if got := users.passwords["u-1"]; got != "hashed-newpassword123" {
		t.Errorf("password tersimpan = %q, want %q", got, "hashed-newpassword123")
	}
	if len(refreshes.revokedAll) != 1 || refreshes.revokedAll[0] != "u-1" {
		t.Errorf("sesi tidak dicabut: %v", refreshes.revokedAll)
	}
	if _, ok := otpRepo.latest[otpKey("u-1", domain.OTPPurposeResetPassword)]; ok {
		t.Error("OTP reset password harus di-invalidate setelah dipakai")
	}
}
