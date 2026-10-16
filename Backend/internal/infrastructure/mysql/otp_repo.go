package mysql

import (
	"context"
	"database/sql"

	"desa-anabanua-api/internal/domain"
	asecase "desa-anabanua-api/internal/usecase/auth"
)

// OTPRepo persists one-time passcodes in the otp_codes table.
type OTPRepo struct{ db *sql.DB }

func NewOTPRepo(db *sql.DB) *OTPRepo { return &OTPRepo{db: db} }

var _ asecase.OTPRepository = (*OTPRepo)(nil)

func (r *OTPRepo) Create(ctx context.Context, otp domain.OTP) error {
	_, err := q(ctx, r.db).ExecContext(ctx,
		"INSERT INTO otp_codes(id,user_id,code,purpose,expires_at,created_at) VALUES(?,?,?,?,?,?)",
		otp.ID, otp.UserID, otp.Code, otp.Purpose, otp.ExpiresAt, otp.CreatedAt)
	return err
}

func (r *OTPRepo) GetLatestByUserPurpose(ctx context.Context, userID, purpose string) (domain.OTP, error) {
	var otp domain.OTP
	var usedAt sql.NullTime
	err := q(ctx, r.db).QueryRowContext(ctx,
		"SELECT id,user_id,code,purpose,expires_at,used_at,created_at FROM otp_codes "+
			"WHERE user_id=? AND purpose=? AND used_at IS NULL ORDER BY created_at DESC LIMIT 1",
		userID, purpose).Scan(&otp.ID, &otp.UserID, &otp.Code, &otp.Purpose, &otp.ExpiresAt, &usedAt, &otp.CreatedAt)
	if usedAt.Valid {
		otp.UsedAt = &usedAt.Time
	}
	return otp, err
}

func (r *OTPRepo) InvalidateByUserPurpose(ctx context.Context, userID, purpose string) error {
	_, err := q(ctx, r.db).ExecContext(ctx,
		"UPDATE otp_codes SET used_at=NOW() WHERE user_id=? AND purpose=? AND used_at IS NULL",
		userID, purpose)
	return err
}
