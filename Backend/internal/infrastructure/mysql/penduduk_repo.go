package mysql

import (
	"context"
	"database/sql"
	"errors"

	"desa-anabanua-api/internal/domain"
	"desa-anabanua-api/internal/usecase/persuratan"
)

type PendudukRepo struct {
	db *sql.DB
}

func NewPendudukRepo(db *sql.DB) *PendudukRepo {
	return &PendudukRepo{db: db}
}

func scanPenduduk(s rowScanner) (domain.Penduduk, error) {
	var p domain.Penduduk
	var golDarah sql.NullString
	if err := s.Scan(
		&p.NIK, &p.NoKK, &p.Nama, &p.TempatLahir, &p.TanggalLahir,
		&p.JenisKelamin, &p.Agama, &p.StatusPerkawinan, &p.Pekerjaan,
		&golDarah, &p.HubunganKeluarga, &p.Alamat, &p.RT, &p.RW, &p.Dusun, &p.IsActive,
	); err != nil {
		return p, err
	}
	if golDarah.Valid {
		p.GolonganDarah = &golDarah.String
	}
	return p, nil
}

func (r *PendudukRepo) GetByNIK(ctx context.Context, nik string) (domain.Penduduk, error) {
	row := q(ctx, r.db).QueryRowContext(ctx, `
		SELECT nik, no_kk, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, agama,
		       status_perkawinan, pekerjaan, golongan_darah, hubungan_keluarga, alamat,
		       rt, rw, dusun, is_active
		FROM penduduk WHERE nik = ? AND is_active = TRUE`, nik)
	p, err := scanPenduduk(row)
	if errors.Is(err, sql.ErrNoRows) {
		return p, domain.ErrNotFound
	}
	return p, err
}

func (r *PendudukRepo) GetByNoKK(ctx context.Context, noKK string) ([]domain.Penduduk, error) {
	rows, err := q(ctx, r.db).QueryContext(ctx, `
		SELECT nik, no_kk, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, agama,
		       status_perkawinan, pekerjaan, golongan_darah, hubungan_keluarga, alamat,
		       rt, rw, dusun, is_active
		FROM penduduk WHERE no_kk = ? AND is_active = TRUE ORDER BY hubungan_keluarga, tanggal_lahir`, noKK)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []domain.Penduduk
	for rows.Next() {
		p, err := scanPenduduk(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, p)
	}
	return result, rows.Err()
}

func (r *PendudukRepo) Upsert(ctx context.Context, p domain.Penduduk) error {
	var golDarah *string = p.GolonganDarah
	_, err := q(ctx, r.db).ExecContext(ctx, `
		INSERT INTO penduduk (
			nik, no_kk, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, agama,
			status_perkawinan, pekerjaan, golongan_darah, hubungan_keluarga, alamat,
			rt, rw, dusun, is_active
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE
			no_kk = VALUES(no_kk), nama = VALUES(nama), tempat_lahir = VALUES(tempat_lahir),
			tanggal_lahir = VALUES(tanggal_lahir), jenis_kelamin = VALUES(jenis_kelamin),
			agama = VALUES(agama), status_perkawinan = VALUES(status_perkawinan),
			pekerjaan = VALUES(pekerjaan), golongan_darah = VALUES(golongan_darah),
			hubungan_keluarga = VALUES(hubungan_keluarga), alamat = VALUES(alamat),
			rt = VALUES(rt), rw = VALUES(rw), dusun = VALUES(dusun), is_active = VALUES(is_active)`,
		p.NIK, p.NoKK, p.Nama, p.TempatLahir, p.TanggalLahir, p.JenisKelamin, p.Agama,
		p.StatusPerkawinan, p.Pekerjaan, golDarah, p.HubunganKeluarga, p.Alamat,
		p.RT, p.RW, p.Dusun, p.IsActive,
	)
	return err
}

var _ persuratan.PendudukRepository = (*PendudukRepo)(nil)
