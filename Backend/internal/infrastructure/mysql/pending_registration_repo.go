package mysql

import (
	"context"
	"database/sql"
	"time"

	"desa-anabanua-api/internal/domain"
	asecase "desa-anabanua-api/internal/usecase/auth"
)

// PendingRegistrationRepo persists accounts that are still awaiting email OTP
// verification (register flow). Keyed by unique email.
type PendingRegistrationRepo struct{ db *sql.DB }

func NewPendingRegistrationRepo(db *sql.DB) *PendingRegistrationRepo {
	return &PendingRegistrationRepo{db: db}
}

var _ asecase.PendingRegistrationRepository = (*PendingRegistrationRepo)(nil)

func (r *PendingRegistrationRepo) Upsert(ctx context.Context, p domain.PendingRegistration) error {
	_, err := q(ctx, r.db).ExecContext(ctx,
		"INSERT INTO pending_registrations(email,nama,password_hash,nik,telepon,alamat,otp_code,otp_expires_at,created_at) "+
			"VALUES(?,?,?,?,?,?,?,?,?) "+
			"ON DUPLICATE KEY UPDATE "+
			"nama=VALUES(nama),password_hash=VALUES(password_hash),nik=VALUES(nik),telepon=VALUES(telepon),alamat=VALUES(alamat),"+
			"otp_code=VALUES(otp_code),otp_expires_at=VALUES(otp_expires_at)",
		p.Email, p.Nama, p.PasswordHash, strPtrVal(p.NIK), strPtrVal(p.Telepon), strPtrVal(p.Alamat),
		p.OTPCode, p.OTPExpiresAt, time.Now())
	return err
}

func (r *PendingRegistrationRepo) GetByEmail(ctx context.Context, email string) (domain.PendingRegistration, error) {
	var p domain.PendingRegistration
	var nik, tel, alamat sql.NullString
	err := q(ctx, r.db).QueryRowContext(ctx,
		"SELECT email,nama,password_hash,nik,telepon,alamat,otp_code,otp_expires_at,created_at "+
			"FROM pending_registrations WHERE email=? LIMIT 1",
		email).Scan(&p.Email, &p.Nama, &p.PasswordHash, &nik, &tel, &alamat, &p.OTPCode, &p.OTPExpiresAt, &p.CreatedAt)
	if err != nil {
		return p, err
	}
	p.NIK = nullStrPtr(nik)
	p.Telepon = nullStrPtr(tel)
	p.Alamat = nullStrPtr(alamat)
	return p, nil
}

func (r *PendingRegistrationRepo) DeleteByEmail(ctx context.Context, email string) error {
	_, err := q(ctx, r.db).ExecContext(ctx, "DELETE FROM pending_registrations WHERE email=?", email)
	return err
}
