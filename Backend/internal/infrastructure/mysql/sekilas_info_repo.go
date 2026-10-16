package mysql

import (
	"context"
	"database/sql"
	"time"

	"desa-anabanua-api/internal/domain"
	"desa-anabanua-api/internal/usecase/sekilas_info"
)

type SekilasInfoRepo struct{ db *sql.DB }

func NewSekilasInfoRepo(db *sql.DB) *SekilasInfoRepo { return &SekilasInfoRepo{db: db} }

func scanSekilasInfo(s rowScanner) (domain.SekilasInfo, error) {
	var info domain.SekilasInfo
	var created, updated time.Time
	if err := s.Scan(&info.ID, &info.Konten, &info.Aktif, &created, &updated); err != nil {
		return info, err
	}
	info.CreatedAt, info.UpdatedAt = created, updated
	return info, nil
}

const sekilasInfoCols = "id,konten,aktif,created_at,updated_at"

func (r *SekilasInfoRepo) List(ctx context.Context) ([]domain.SekilasInfo, error) {
	rows, err := q(ctx, r.db).QueryContext(ctx,
		"SELECT "+sekilasInfoCols+" FROM sekilas_info ORDER BY created_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.SekilasInfo{}
	for rows.Next() {
		s, err := scanSekilasInfo(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

func (r *SekilasInfoRepo) ListActive(ctx context.Context) ([]domain.SekilasInfo, error) {
	rows, err := q(ctx, r.db).QueryContext(ctx,
		"SELECT "+sekilasInfoCols+" FROM sekilas_info WHERE aktif=1 ORDER BY created_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.SekilasInfo{}
	for rows.Next() {
		s, err := scanSekilasInfo(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

func (r *SekilasInfoRepo) GetByID(ctx context.Context, id string) (domain.SekilasInfo, error) {
	return scanSekilasInfo(q(ctx, r.db).QueryRowContext(ctx,
		"SELECT "+sekilasInfoCols+" FROM sekilas_info WHERE id=?", id))
}

func (r *SekilasInfoRepo) Create(ctx context.Context, s domain.SekilasInfo) error {
	_, err := q(ctx, r.db).ExecContext(ctx,
		"INSERT INTO sekilas_info(id,konten,aktif,created_at,updated_at) VALUES(?,?,?,?,?)",
		s.ID, s.Konten, s.Aktif, s.CreatedAt, s.UpdatedAt)
	return err
}

func (r *SekilasInfoRepo) Update(ctx context.Context, s domain.SekilasInfo) error {
	_, err := q(ctx, r.db).ExecContext(ctx,
		"UPDATE sekilas_info SET konten=?,aktif=?,updated_at=? WHERE id=?",
		s.Konten, s.Aktif, s.UpdatedAt, s.ID)
	return err
}

func (r *SekilasInfoRepo) Delete(ctx context.Context, id string) error {
	_, err := q(ctx, r.db).ExecContext(ctx, "DELETE FROM sekilas_info WHERE id=?", id)
	return err
}

var _ sekilasinfo.Repository = (*SekilasInfoRepo)(nil)
