package mysql

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"

	"desa-anabanua-api/internal/domain"
	"desa-anabanua-api/internal/usecase/desa"
)

// ---- Profil Desa (singleton JSON doc) ----

type ProfilRepo struct{ db *sql.DB }

func NewProfilRepo(db *sql.DB) *ProfilRepo { return &ProfilRepo{db: db} }

func (r *ProfilRepo) Get(ctx context.Context) (domain.ProfilDesa, error) {
	var raw string
	err := q(ctx, r.db).QueryRowContext(ctx, "SELECT data FROM profil_desa WHERE id=1").Scan(&raw)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.ProfilDesa{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.ProfilDesa{}, err
	}
	var p domain.ProfilDesa
	if err := json.Unmarshal([]byte(raw), &p); err != nil {
		return p, err
	}
	return p, nil
}

func (r *ProfilRepo) Upsert(ctx context.Context, p domain.ProfilDesa) error {
	_, err := q(ctx, r.db).ExecContext(ctx,
		"INSERT INTO profil_desa(id,data) VALUES(1,?) ON DUPLICATE KEY UPDATE data=VALUES(data)", mustJSON(p))
	return err
}

// ---- Perangkat Desa ----

type PerangkatRepo struct{ db *sql.DB }

func NewPerangkatRepo(db *sql.DB) *PerangkatRepo { return &PerangkatRepo{db: db} }

func scanPerangkat(s rowScanner) (domain.PerangkatDesa, error) {
	var p domain.PerangkatDesa
	var nip sql.NullString
	if err := s.Scan(&p.ID, &p.Nama, &p.Jabatan, &nip, &p.Foto, &p.Periode); err != nil {
		return p, err
	}
	p.NIP = nsPtr(nip)
	return p, nil
}

func (r *PerangkatRepo) List(ctx context.Context) ([]domain.PerangkatDesa, error) {
	rows, err := q(ctx, r.db).QueryContext(ctx, "SELECT id,nama,jabatan,nip,foto,periode FROM perangkat_desa ORDER BY jabatan,nama")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.PerangkatDesa{}
	for rows.Next() {
		p, err := scanPerangkat(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (r *PerangkatRepo) Create(ctx context.Context, p domain.PerangkatDesa) error {
	_, err := q(ctx, r.db).ExecContext(ctx,
		"INSERT INTO perangkat_desa(id,nama,jabatan,nip,foto,periode) VALUES(?,?,?,?,?,?)",
		p.ID, p.Nama, p.Jabatan, strPtrVal(p.NIP), p.Foto, p.Periode)
	return err
}

func (r *PerangkatRepo) Update(ctx context.Context, p domain.PerangkatDesa) error {
	_, err := q(ctx, r.db).ExecContext(ctx,
		"UPDATE perangkat_desa SET nama=?,jabatan=?,nip=?,foto=?,periode=? WHERE id=?",
		p.Nama, p.Jabatan, strPtrVal(p.NIP), p.Foto, p.Periode, p.ID)
	return err
}

func (r *PerangkatRepo) Delete(ctx context.Context, id string) error {
	_, err := q(ctx, r.db).ExecContext(ctx, "DELETE FROM perangkat_desa WHERE id=?", id)
	return err
}

// ---- Dusun ----

type DusunRepo struct{ db *sql.DB }

func NewDusunRepo(db *sql.DB) *DusunRepo { return &DusunRepo{db: db} }

func (r *DusunRepo) List(ctx context.Context) ([]domain.Dusun, error) {
	rows, err := q(ctx, r.db).QueryContext(ctx,
		"SELECT id,nama,ketua,jumlah_rt,jumlah_rw,jumlah_penduduk,luas_wilayah FROM dusun ORDER BY nama")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.Dusun{}
	for rows.Next() {
		var d domain.Dusun
		if err := rows.Scan(&d.ID, &d.Nama, &d.Ketua, &d.JumlahRT, &d.JumlahRW, &d.JumlahPenduduk, &d.LuasWilayah); err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, rows.Err()
}

// ---- Potensi Desa ----

type PotensiRepo struct{ db *sql.DB }

func NewPotensiRepo(db *sql.DB) *PotensiRepo { return &PotensiRepo{db: db} }

func (r *PotensiRepo) List(ctx context.Context) ([]domain.PotensiDesa, error) {
	rows, err := q(ctx, r.db).QueryContext(ctx, "SELECT id,nama,kategori,deskripsi,foto FROM potensi_desa ORDER BY nama")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.PotensiDesa{}
	for rows.Next() {
		var p domain.PotensiDesa
		if err := rows.Scan(&p.ID, &p.Nama, &p.Kategori, &p.Deskripsi, &p.Foto); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

var _ desa.ProfilRepository = (*ProfilRepo)(nil)
var _ desa.PerangkatRepository = (*PerangkatRepo)(nil)
var _ desa.DusunRepository = (*DusunRepo)(nil)
var _ desa.PotensiRepository = (*PotensiRepo)(nil)
