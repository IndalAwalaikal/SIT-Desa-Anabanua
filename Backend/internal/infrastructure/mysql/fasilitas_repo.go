package mysql

import (
	"context"
	"database/sql"

	"desa-anabanua-api/internal/domain"
	"desa-anabanua-api/internal/usecase/desa"
)

// ---- Fasilitas Desa ----

type FasilitasRepo struct{ db *sql.DB }

func NewFasilitasRepo(db *sql.DB) *FasilitasRepo { return &FasilitasRepo{db: db} }

func scanFasilitas(s rowScanner) (domain.FasilitasDesa, error) {
	var f domain.FasilitasDesa
	var kontak, jam sql.NullString
	if err := s.Scan(&f.ID, &f.Nama, &f.Kategori, &f.Alamat, &f.Dusun, &f.Deskripsi, &kontak, &jam); err != nil {
		return f, err
	}
	f.Kontak = nsPtr(kontak)
	f.JamLayanan = nsPtr(jam)
	return f, nil
}

func (r *FasilitasRepo) List(ctx context.Context, kategori string) ([]domain.FasilitasDesa, error) {
	qy := "SELECT id,nama,kategori,alamat,dusun,deskripsi,kontak,jam_layanan FROM fasilitas_desa"
	args := []any{}
	if kategori != "" && kategori != "semua" {
		qy += " WHERE kategori=?"
		args = append(args, kategori)
	}
	qy += " ORDER BY nama"
	rows, err := q(ctx, r.db).QueryContext(ctx, qy, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.FasilitasDesa{}
	for rows.Next() {
		f, err := scanFasilitas(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, f)
	}
	return out, rows.Err()
}

func (r *FasilitasRepo) GetByID(ctx context.Context, id string) (domain.FasilitasDesa, error) {
	return scanFasilitas(q(ctx, r.db).QueryRowContext(ctx, "SELECT id,nama,kategori,alamat,dusun,deskripsi,kontak,jam_layanan FROM fasilitas_desa WHERE id=?", id))
}

func (r *FasilitasRepo) Create(ctx context.Context, f domain.FasilitasDesa) error {
	_, err := q(ctx, r.db).ExecContext(ctx,
		"INSERT INTO fasilitas_desa(id,nama,kategori,alamat,dusun,deskripsi,kontak,jam_layanan) VALUES(?,?,?,?,?,?,?,?)",
		f.ID, f.Nama, f.Kategori, f.Alamat, f.Dusun, f.Deskripsi, strPtrVal(f.Kontak), strPtrVal(f.JamLayanan))
	return err
}

func (r *FasilitasRepo) Update(ctx context.Context, f domain.FasilitasDesa) error {
	_, err := q(ctx, r.db).ExecContext(ctx,
		"UPDATE fasilitas_desa SET nama=?,kategori=?,alamat=?,dusun=?,deskripsi=?,kontak=?,jam_layanan=? WHERE id=?",
		f.Nama, f.Kategori, f.Alamat, f.Dusun, f.Deskripsi, strPtrVal(f.Kontak), strPtrVal(f.JamLayanan), f.ID)
	return err
}

func (r *FasilitasRepo) Delete(ctx context.Context, id string) error {
	_, err := q(ctx, r.db).ExecContext(ctx, "DELETE FROM fasilitas_desa WHERE id=?", id)
	return err
}

var _ desa.FasilitasRepository = (*FasilitasRepo)(nil)
