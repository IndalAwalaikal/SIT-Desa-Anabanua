package mysql

import (
	"context"
	"database/sql"
	"strings"
	"time"

	"desa-anabanua-api/internal/domain"
)

type UserRepo struct{ db *sql.DB }

func NewUserRepo(db *sql.DB) *UserRepo { return &UserRepo{db: db} }

const userCols = "id,nama,email,password_hash,nik,no_kk,tempat_lahir,tanggal_lahir,jenis_kelamin,agama,status_perkawinan,pekerjaan,rt,rw,dusun,telepon,alamat,role,avatar_url,email_verified,is_active,created_at,updated_at"

type rowScanner interface{ Scan(dest ...any) error }

func scanUser(s rowScanner) (domain.User, error) {
	var u domain.User
	var nik, noKK, tempatLahir, jk, agama, statusKawin, pekerjaan, rt, rw, dusun, tel, alamat, avatar sql.NullString
	var tglLahir sql.NullTime
	var role string
	if err := s.Scan(
		&u.ID, &u.Nama, &u.Email, &u.PasswordHash,
		&nik, &noKK, &tempatLahir, &tglLahir, &jk, &agama, &statusKawin, &pekerjaan, &rt, &rw, &dusun,
		&tel, &alamat, &role, &avatar, &u.EmailVerified, &u.IsActive, &u.CreatedAt, &u.UpdatedAt,
	); err != nil {
		return u, err
	}
	u.NIK = nullStrPtr(nik)
	u.NoKK = nullStrPtr(noKK)
	u.TempatLahir = nullStrPtr(tempatLahir)
	if tglLahir.Valid {
		u.TanggalLahir = &tglLahir.Time
	}
	u.JenisKelamin = nullStrPtr(jk)
	u.Agama = nullStrPtr(agama)
	u.StatusPerkawinan = nullStrPtr(statusKawin)
	u.Pekerjaan = nullStrPtr(pekerjaan)
	u.RT = nullStrPtr(rt)
	u.RW = nullStrPtr(rw)
	u.Dusun = nullStrPtr(dusun)
	u.Telepon = nullStrPtr(tel)
	u.Alamat = nullStrPtr(alamat)
	u.AvatarURL = nullStrPtr(avatar)
	u.Role = domain.Role(role)
	return u, nil
}

func nullStrPtr(n sql.NullString) *string {
	if !n.Valid {
		return nil
	}
	v := n.String
	return &v
}

func (r *UserRepo) Create(ctx context.Context, u domain.User) error {
	var tgl any = nil
	if u.TanggalLahir != nil {
		tgl = *u.TanggalLahir
	}
	_, err := q(ctx, r.db).ExecContext(ctx,
		"INSERT INTO users(id,nama,email,password_hash,nik,no_kk,tempat_lahir,tanggal_lahir,jenis_kelamin,agama,status_perkawinan,pekerjaan,rt,rw,dusun,telepon,alamat,avatar_url,role,email_verified,is_active) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
		u.ID, u.Nama, u.Email, u.PasswordHash, strPtrVal(u.NIK), strPtrVal(u.NoKK), strPtrVal(u.TempatLahir), tgl, strPtrVal(u.JenisKelamin), strPtrVal(u.Agama), strPtrVal(u.StatusPerkawinan), strPtrVal(u.Pekerjaan), strPtrVal(u.RT), strPtrVal(u.RW), strPtrVal(u.Dusun), strPtrVal(u.Telepon), strPtrVal(u.Alamat), strPtrVal(u.AvatarURL), string(u.Role), u.EmailVerified, u.IsActive)
	if err != nil {
		if strings.Contains(err.Error(), "1062") || strings.Contains(strings.ToLower(err.Error()), "duplicate") {
			return domain.ErrConflict
		}
		return err
	}
	return nil
}

func (r *UserRepo) UpdateEmailVerified(ctx context.Context, id string, verified bool) error {
	_, err := q(ctx, r.db).ExecContext(ctx, "UPDATE users SET email_verified=?,updated_at=? WHERE id=?", verified, time.Now(), id)
	return err
}

func (r *UserRepo) GetByID(ctx context.Context, id string) (domain.User, error) {
	return scanUser(q(ctx, r.db).QueryRowContext(ctx, "SELECT "+userCols+" FROM users WHERE id=?", id))
}

func (r *UserRepo) GetByEmail(ctx context.Context, email string) (domain.User, error) {
	return scanUser(q(ctx, r.db).QueryRowContext(ctx, "SELECT "+userCols+" FROM users WHERE email=? LIMIT 1", email))
}

func (r *UserRepo) GetByNIK(ctx context.Context, nik string) (domain.User, error) {
	return scanUser(q(ctx, r.db).QueryRowContext(ctx, "SELECT "+userCols+" FROM users WHERE nik=? LIMIT 1", nik))
}

func (r *UserRepo) UpdateProfile(ctx context.Context, u domain.User) error {
	var tgl any = nil
	if u.TanggalLahir != nil {
		tgl = *u.TanggalLahir
	}
	_, err := q(ctx, r.db).ExecContext(ctx,
		"UPDATE users SET nama=?,email=?,nik=?,no_kk=?,tempat_lahir=?,tanggal_lahir=?,jenis_kelamin=?,agama=?,status_perkawinan=?,pekerjaan=?,rt=?,rw=?,dusun=?,telepon=?,alamat=?,avatar_url=?,updated_at=? WHERE id=?",
		u.Nama, u.Email, strPtrVal(u.NIK), strPtrVal(u.NoKK), strPtrVal(u.TempatLahir), tgl, strPtrVal(u.JenisKelamin), strPtrVal(u.Agama), strPtrVal(u.StatusPerkawinan), strPtrVal(u.Pekerjaan), strPtrVal(u.RT), strPtrVal(u.RW), strPtrVal(u.Dusun), strPtrVal(u.Telepon), strPtrVal(u.Alamat), strPtrVal(u.AvatarURL), time.Now(), u.ID)
	return err
}

func (r *UserRepo) UpdatePassword(ctx context.Context, id, hash string) error {
	_, err := q(ctx, r.db).ExecContext(ctx, "UPDATE users SET password_hash=?,updated_at=? WHERE id=?", hash, time.Now(), id)
	return err
}

func (r *UserRepo) UpdateRole(ctx context.Context, id string, role domain.Role, isActive bool) error {
	_, err := q(ctx, r.db).ExecContext(ctx, "UPDATE users SET role=?,is_active=?,updated_at=? WHERE id=?", string(role), isActive, time.Now(), id)
	return err
}

// ---- Refresh tokens ----

type RefreshTokenRepo struct{ db *sql.DB }

func NewRefreshTokenRepo(db *sql.DB) *RefreshTokenRepo { return &RefreshTokenRepo{db: db} }

func (r *RefreshTokenRepo) Create(ctx context.Context, t domain.RefreshToken) error {
	lastUsed := t.LastUsedAt
	if lastUsed.IsZero() {
		lastUsed = time.Now()
	}
	_, err := q(ctx, r.db).ExecContext(ctx,
		"INSERT INTO refresh_tokens(id,user_id,token_hash,expires_at,last_used_at) VALUES(?,?,?,?,?)",
		t.ID, t.UserID, t.TokenHash, t.ExpiresAt, lastUsed)
	return err
}

func (r *RefreshTokenRepo) GetByHashForUpdate(ctx context.Context, hash string) (domain.RefreshToken, error) {
	var t domain.RefreshToken
	var revoked sql.NullTime
	var replaced sql.NullString
	err := q(ctx, r.db).QueryRowContext(ctx,
		"SELECT id,user_id,token_hash,expires_at,revoked_at,replaced_by,last_used_at FROM refresh_tokens WHERE token_hash=? FOR UPDATE", hash).
		Scan(&t.ID, &t.UserID, &t.TokenHash, &t.ExpiresAt, &revoked, &replaced, &t.LastUsedAt)
	if revoked.Valid {
		t.RevokedAt = &revoked.Time
	}
	if replaced.Valid {
		t.ReplacedBy = &replaced.String
	}
	return t, err
}

func (r *RefreshTokenRepo) Rotate(ctx context.Context, oldID, newID string) error {
	// Update last_used_at on the old token before revoking so activity history is accurate.
	_, err := q(ctx, r.db).ExecContext(ctx,
		"UPDATE refresh_tokens SET revoked_at=NOW(),replaced_by=?,last_used_at=NOW() WHERE id=?", newID, oldID)
	return err
}

func (r *RefreshTokenRepo) RevokeByHash(ctx context.Context, hash string) error {
	_, err := q(ctx, r.db).ExecContext(ctx,
		"UPDATE refresh_tokens SET revoked_at=NOW() WHERE token_hash=? AND revoked_at IS NULL", hash)
	return err
}

func (r *RefreshTokenRepo) RevokeAllForUser(ctx context.Context, userID string) error {
	_, err := q(ctx, r.db).ExecContext(ctx,
		"UPDATE refresh_tokens SET revoked_at=NOW() WHERE user_id=? AND revoked_at IS NULL", userID)
	return err
}

func strPtrVal(p *string) any {
	if p == nil {
		return nil
	}
	return *p
}
