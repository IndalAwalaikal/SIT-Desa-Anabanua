package mysql

import (
	"context"
	"database/sql"
	"encoding/json"

	"desa-anabanua-api/internal/domain"
	"desa-anabanua-api/internal/usecase/umkm"
)

type UmkmRepo struct{ db *sql.DB }

func NewUmkmRepo(db *sql.DB) *UmkmRepo { return &UmkmRepo{db: db} }

func scanUmkm(s rowScanner) (domain.Umkm, error) {
	var u domain.Umkm
	var foto, produk string
	var jam sql.NullString
	if err := s.Scan(&u.ID, &u.Slug, &u.NamaUsaha, &u.Pemilik, &u.Kategori, &u.Deskripsi, &foto, &u.Kontak, &u.Alamat, &produk, &jam); err != nil {
		return u, err
	}
	_ = json.Unmarshal([]byte(foto), &u.Foto)
	_ = json.Unmarshal([]byte(produk), &u.ProdukUnggulan)
	if u.Foto == nil {
		u.Foto = []string{}
	}
	if u.ProdukUnggulan == nil {
		u.ProdukUnggulan = []string{}
	}
	u.JamOperasional = nsPtr(jam)
	return u, nil
}

func (r *UmkmRepo) List(ctx context.Context, kategori string, limit int) ([]domain.Umkm, error) {
	qy := "SELECT id,slug,nama_usaha,pemilik,kategori,deskripsi,foto,kontak,alamat,produk_unggulan,jam_operasional FROM umkm"
	args := []any{}
	if kategori != "" && kategori != "semua" {
		qy += " WHERE kategori LIKE ?"
		args = append(args, "%"+kategori+"%")
	}
	qy += " ORDER BY nama_usaha"
	if limit > 0 {
		qy += " LIMIT ?"
		args = append(args, limit)
	}
	rows, err := q(ctx, r.db).QueryContext(ctx, qy, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.Umkm{}
	for rows.Next() {
		u, err := scanUmkm(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, u)
	}
	return out, rows.Err()
}

func (r *UmkmRepo) GetBySlug(ctx context.Context, slug string) (domain.Umkm, error) {
	return scanUmkm(q(ctx, r.db).QueryRowContext(ctx,
		"SELECT id,slug,nama_usaha,pemilik,kategori,deskripsi,foto,kontak,alamat,produk_unggulan,jam_operasional FROM umkm WHERE slug=?", slug))
}

func (r *UmkmRepo) GetByID(ctx context.Context, id string) (domain.Umkm, error) {
	return scanUmkm(q(ctx, r.db).QueryRowContext(ctx,
		"SELECT id,slug,nama_usaha,pemilik,kategori,deskripsi,foto,kontak,alamat,produk_unggulan,jam_operasional FROM umkm WHERE id=?", id))
}

func (r *UmkmRepo) Create(ctx context.Context, u domain.Umkm) error {
	_, err := q(ctx, r.db).ExecContext(ctx,
		"INSERT INTO umkm(id,slug,nama_usaha,pemilik,kategori,deskripsi,foto,kontak,alamat,produk_unggulan,jam_operasional) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
		u.ID, u.Slug, u.NamaUsaha, u.Pemilik, u.Kategori, u.Deskripsi, mustJSON(u.Foto), u.Kontak, u.Alamat, mustJSON(u.ProdukUnggulan), strPtrVal(u.JamOperasional))
	return err
}

func (r *UmkmRepo) Update(ctx context.Context, u domain.Umkm) error {
	_, err := q(ctx, r.db).ExecContext(ctx,
		"UPDATE umkm SET slug=?,nama_usaha=?,pemilik=?,kategori=?,deskripsi=?,foto=?,kontak=?,alamat=?,produk_unggulan=?,jam_operasional=? WHERE id=?",
		u.Slug, u.NamaUsaha, u.Pemilik, u.Kategori, u.Deskripsi, mustJSON(u.Foto), u.Kontak, u.Alamat, mustJSON(u.ProdukUnggulan), strPtrVal(u.JamOperasional), u.ID)
	return err
}

func (r *UmkmRepo) Delete(ctx context.Context, id string) error {
	_, err := q(ctx, r.db).ExecContext(ctx, "DELETE FROM umkm WHERE id=?", id)
	return err
}

var _ umkm.Repository = (*UmkmRepo)(nil)
