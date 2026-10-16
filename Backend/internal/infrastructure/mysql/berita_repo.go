package mysql

import (
	"context"
	"database/sql"
	"encoding/json"
	"strings"
	"time"

	"desa-anabanua-api/internal/domain"
	"desa-anabanua-api/internal/usecase/berita"
)

type BeritaRepo struct{ db *sql.DB }

func NewBeritaRepo(db *sql.DB) *BeritaRepo { return &BeritaRepo{db: db} }

// NOTE: COALESCE(b.gambar_tengah,'') prevents a sql scan error when the column is NULL.
const beritaCols = "b.id,b.slug,b.judul,b.ringkasan,b.konten,b.kategori,b.gambar_sampul,COALESCE(b.gambar_tengah,''),COALESCE(u.nama,'Admin Desa Anabanua'),b.tags,b.status,b.tanggal_terbit,b.dibaca,b.created_at,b.updated_at"

func scanBerita(s rowScanner) (domain.Berita, error) {
	var b domain.Berita
	var tags, status string
	var tanggal sql.NullTime
	var created, updated time.Time
	if err := s.Scan(&b.ID, &b.Slug, &b.Judul, &b.Ringkasan, &b.Konten, &b.Kategori, &b.GambarSampul, &b.GambarTengah, &b.Penulis, &tags, &status, &tanggal, &b.Dibaca, &created, &updated); err != nil {
		return b, err
	}
	if tanggal.Valid {
		b.TanggalTerbit = &tanggal.Time
	}
	b.Status = domain.BeritaStatus(status)
	_ = json.Unmarshal([]byte(tags), &b.Tags)
	b.CreatedAt, b.UpdatedAt = created, updated
	if b.Tags == nil {
		b.Tags = []string{}
	}
	return b, nil
}

func (r *BeritaRepo) List(ctx context.Context, f berita.ListFilter) ([]domain.Berita, int, error) {
	where := []string{"1=1"}
	args := []any{}
	if !f.IncludeDraft {
		where = append(where, "b.status='terbit'")
	}
	if f.Kategori != "" {
		where = append(where, "b.kategori = ?")
		args = append(args, f.Kategori)
	}
	if s := strings.TrimSpace(f.Search); s != "" {
		where = append(where, "(b.judul LIKE ? OR b.ringkasan LIKE ? OR b.tags LIKE ?)")
		args = append(args, "%"+s+"%", "%"+s+"%", "%"+s+"%")
	}
	whereSQL := " WHERE " + strings.Join(where, " AND ")

	var total int
	if err := q(ctx, r.db).QueryRowContext(ctx, "SELECT COUNT(*) FROM berita b LEFT JOIN users u ON u.id=b.penulis_id"+whereSQL, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	limit, offset := f.Limit, (f.Page-1)*f.Limit
	rows, err := q(ctx, r.db).QueryContext(ctx,
		"SELECT "+beritaCols+" FROM berita b LEFT JOIN users u ON u.id=b.penulis_id"+whereSQL+" ORDER BY b.tanggal_terbit IS NULL, b.tanggal_terbit DESC LIMIT ? OFFSET ?",
		append(append([]any{}, args...), limit, offset)...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := []domain.Berita{}
	for rows.Next() {
		b, err := scanBerita(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, b)
	}
	return out, total, rows.Err()
}

func (r *BeritaRepo) GetByID(ctx context.Context, id string) (domain.Berita, error) {
	return scanBerita(q(ctx, r.db).QueryRowContext(ctx, "SELECT "+beritaCols+" FROM berita b LEFT JOIN users u ON u.id=b.penulis_id WHERE b.id=?", id))
}

func (r *BeritaRepo) GetBySlug(ctx context.Context, slug string) (domain.Berita, error) {
	return scanBerita(q(ctx, r.db).QueryRowContext(ctx, "SELECT "+beritaCols+" FROM berita b LEFT JOIN users u ON u.id=b.penulis_id WHERE b.slug=?", slug))
}

func (r *BeritaRepo) Create(ctx context.Context, b domain.Berita) error {
	_, err := q(ctx, r.db).ExecContext(ctx,
		"INSERT INTO berita(id,slug,judul,ringkasan,konten,kategori,gambar_sampul,gambar_tengah,penulis_id,tags,status,tanggal_terbit,dibaca) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
		b.ID, b.Slug, b.Judul, b.Ringkasan, b.Konten, b.Kategori, b.GambarSampul, b.GambarTengah, b.PenulisID, mustJSON(b.Tags), string(b.Status), b.TanggalTerbit, 0)
	return err
}

func (r *BeritaRepo) Update(ctx context.Context, b domain.Berita) error {
	_, err := q(ctx, r.db).ExecContext(ctx,
		"UPDATE berita SET slug=?,judul=?,ringkasan=?,konten=?,kategori=?,gambar_sampul=?,gambar_tengah=?,tags=?,status=?,tanggal_terbit=?,updated_at=? WHERE id=?",
		b.Slug, b.Judul, b.Ringkasan, b.Konten, b.Kategori, b.GambarSampul, b.GambarTengah, mustJSON(b.Tags), string(b.Status), b.TanggalTerbit, time.Now(), b.ID)
	return err
}

func (r *BeritaRepo) Delete(ctx context.Context, id string) error {
	_, err := q(ctx, r.db).ExecContext(ctx, "DELETE FROM berita WHERE id=?", id)
	return err
}

func (r *BeritaRepo) IncrementRead(ctx context.Context, id string) error {
	_, err := q(ctx, r.db).ExecContext(ctx, "UPDATE berita SET dibaca=dibaca+1 WHERE id=?", id)
	return err
}

// ---- Komentar Berita ----

func scanBeritaKomentar(s rowScanner) (domain.BeritaKomentar, error) {
	var k domain.BeritaKomentar
	var userID sql.NullString
	if err := s.Scan(&k.ID, &k.BeritaID, &userID, &k.Nama, &k.Konten, &k.CreatedAt); err != nil {
		return k, err
	}
	k.UserID = nsPtr(userID)
	return k, nil
}

func (r *BeritaRepo) ListKomentar(ctx context.Context, beritaID string) ([]domain.BeritaKomentar, error) {
	rows, err := q(ctx, r.db).QueryContext(ctx,
		"SELECT id,berita_id,user_id,nama,konten,created_at FROM berita_komentar WHERE berita_id=? ORDER BY created_at ASC", beritaID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.BeritaKomentar{}
	for rows.Next() {
		k, err := scanBeritaKomentar(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, k)
	}
	return out, rows.Err()
}

func (r *BeritaRepo) CreateKomentar(ctx context.Context, k domain.BeritaKomentar) error {
	_, err := q(ctx, r.db).ExecContext(ctx,
		"INSERT INTO berita_komentar(id,berita_id,user_id,nama,konten,created_at) VALUES(?,?,?,?,?,?)",
		k.ID, k.BeritaID, k.UserID, k.Nama, k.Konten, k.CreatedAt)
	return err
}

func (r *BeritaRepo) DeleteKomentar(ctx context.Context, id string, userID *string) error {
	_, err := q(ctx, r.db).ExecContext(ctx,
		"DELETE FROM berita_komentar WHERE id=? AND (? IS NULL OR user_id=?)", id, userID, userID)
	return err
}

func mustJSON(v any) string {
	b, _ := json.Marshal(v)
	return string(b)
}
