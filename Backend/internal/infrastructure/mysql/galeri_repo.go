package mysql

import (
	"context"
	"database/sql"
	"strings"

	"desa-anabanua-api/internal/domain"
	"desa-anabanua-api/internal/usecase/galeri"
)

type GaleriRepo struct{ db *sql.DB }

func NewGaleriRepo(db *sql.DB) *GaleriRepo { return &GaleriRepo{db: db} }

func scanAlbum(s rowScanner) (domain.GaleriAlbum, error) {
	var a domain.GaleriAlbum
	var kategori sql.NullString
	if err := s.Scan(&a.ID, &a.Judul, &a.Deskripsi, &a.Tanggal, &kategori, &a.CoverFoto); err != nil {
		return a, err
	}
	a.Kategori = nsPtr(kategori)
	return a, nil
}

func (r *GaleriRepo) List(ctx context.Context) ([]domain.GaleriAlbum, error) {
	rows, err := q(ctx, r.db).QueryContext(ctx,
		"SELECT id,judul,deskripsi,DATE_FORMAT(tanggal,'%Y-%m-%d'),kategori,cover_foto FROM galeri_album ORDER BY tanggal DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.GaleriAlbum{}
	for rows.Next() {
		a, err := scanAlbum(rows)
		if err != nil {
			return nil, err
		}
		a.Fotos = []domain.GaleriFoto{}
		out = append(out, a)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if len(out) == 0 {
		return out, nil
	}

	// Ambil foto semua album sekaligus untuk menghindari satu query per album.
	placeholders := strings.TrimRight(strings.Repeat("?,", len(out)), ",")
	args := make([]any, len(out))
	indices := make(map[string]int, len(out))
	for i := range out {
		args[i] = out[i].ID
		indices[out[i].ID] = i
	}
	photoRows, err := q(ctx, r.db).QueryContext(ctx,
		"SELECT album_id,id,url,caption,DATE_FORMAT(tanggal,'%Y-%m-%d') FROM galeri_item WHERE album_id IN ("+placeholders+") ORDER BY album_id,tanggal", args...)
	if err != nil {
		return nil, err
	}
	defer photoRows.Close()
	for photoRows.Next() {
		var albumID string
		var photo domain.GaleriFoto
		if err := photoRows.Scan(&albumID, &photo.ID, &photo.URL, &photo.Caption, &photo.Tanggal); err != nil {
			return nil, err
		}
		if index, ok := indices[albumID]; ok {
			out[index].Fotos = append(out[index].Fotos, photo)
		}
	}
	if err := photoRows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

// ListPreview returns only recent album metadata and cover URLs. It avoids
// loading every photo when the caller only needs a gallery carousel preview.
func (r *GaleriRepo) ListPreview(ctx context.Context, limit int) ([]domain.GaleriAlbum, error) {
	if limit <= 0 || limit > 100 {
		limit = 12
	}
	rows, err := q(ctx, r.db).QueryContext(ctx,
		"SELECT id,judul,deskripsi,DATE_FORMAT(tanggal,'%Y-%m-%d'),kategori,cover_foto FROM galeri_album ORDER BY tanggal DESC LIMIT ?", limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.GaleriAlbum{}
	for rows.Next() {
		album, err := scanAlbum(rows)
		if err != nil {
			return nil, err
		}
		album.Fotos = []domain.GaleriFoto{}
		out = append(out, album)
	}
	return out, rows.Err()
}

func (r *GaleriRepo) GetByID(ctx context.Context, id string) (domain.GaleriAlbum, error) {
	a, err := scanAlbum(q(ctx, r.db).QueryRowContext(ctx,
		"SELECT id,judul,deskripsi,DATE_FORMAT(tanggal,'%Y-%m-%d'),kategori,cover_foto FROM galeri_album WHERE id=?", id))
	if err != nil {
		if err == sql.ErrNoRows {
			return a, domain.ErrNotFound
		}
		return a, err
	}
	fotos, err := r.fotos(ctx, id)
	if err != nil {
		return a, err
	}
	a.Fotos = fotos
	return a, nil
}

func (r *GaleriRepo) fotos(ctx context.Context, albumID string) ([]domain.GaleriFoto, error) {
	rows, err := q(ctx, r.db).QueryContext(ctx,
		"SELECT id,url,caption,DATE_FORMAT(tanggal,'%Y-%m-%d') FROM galeri_item WHERE album_id=? ORDER BY tanggal", albumID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.GaleriFoto{}
	for rows.Next() {
		var f domain.GaleriFoto
		if err := rows.Scan(&f.ID, &f.URL, &f.Caption, &f.Tanggal); err != nil {
			return nil, err
		}
		out = append(out, f)
	}
	return out, rows.Err()
}

func (r *GaleriRepo) Create(ctx context.Context, album domain.GaleriAlbum) error {
	return r.save(ctx, album)
}

func (r *GaleriRepo) Update(ctx context.Context, album domain.GaleriAlbum) error {
	return r.save(ctx, album)
}

func (r *GaleriRepo) save(ctx context.Context, album domain.GaleriAlbum) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err := tx.ExecContext(ctx,
		"INSERT INTO galeri_album(id,judul,deskripsi,tanggal,kategori,cover_foto) VALUES(?,?,?,?,?,?) ON DUPLICATE KEY UPDATE judul=VALUES(judul),deskripsi=VALUES(deskripsi),tanggal=VALUES(tanggal),kategori=VALUES(kategori),cover_foto=VALUES(cover_foto)",
		album.ID, album.Judul, album.Deskripsi, album.Tanggal, strPtrVal(album.Kategori), album.CoverFoto); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, "DELETE FROM galeri_item WHERE album_id=?", album.ID); err != nil {
		return err
	}
	for _, f := range album.Fotos {
		fTanggal := f.Tanggal
		if fTanggal == "" {
			fTanggal = album.Tanggal
		}
		if _, err := tx.ExecContext(ctx,
			"INSERT INTO galeri_item(id,album_id,url,caption,tanggal) VALUES(?,?,?,?,?)",
			f.ID, album.ID, f.URL, f.Caption, fTanggal); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (r *GaleriRepo) Delete(ctx context.Context, id string) error {
	_, err := q(ctx, r.db).ExecContext(ctx, "DELETE FROM galeri_album WHERE id=?", id)
	return err
}

var _ galeri.Repository = (*GaleriRepo)(nil)
