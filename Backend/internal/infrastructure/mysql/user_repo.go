package mysql

import (
	"context"
	"database/sql"
	"strings"

	"desa-anabanua-api/internal/domain"
	ucuser "desa-anabanua-api/internal/usecase/user"
)

type AdminUserRepo struct{ db *sql.DB }

func NewAdminUserRepo(db *sql.DB) *AdminUserRepo { return &AdminUserRepo{db: db} }

func (r *AdminUserRepo) ListAll(ctx context.Context) ([]domain.User, error) {
	rows, err := q(ctx, r.db).QueryContext(ctx, "SELECT "+userCols+" FROM users ORDER BY created_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.User{}
	for rows.Next() {
		u, err := scanUser(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, u)
	}
	return out, rows.Err()
}

func (r *AdminUserRepo) ListPage(ctx context.Context, search string, page, limit int) ([]domain.User, int, error) {
	where := ""
	args := []any{}
	if search = strings.TrimSpace(search); search != "" {
		where = " WHERE nama LIKE ? OR email LIKE ? OR nik LIKE ?"
		pattern := "%" + search + "%"
		args = append(args, pattern, pattern, pattern)
	}
	var total int
	if err := q(ctx, r.db).QueryRowContext(ctx, "SELECT COUNT(*) FROM users"+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	queryArgs := append(append([]any{}, args...), limit, (page-1)*limit)
	rows, err := q(ctx, r.db).QueryContext(ctx,
		"SELECT "+userCols+" FROM users"+where+" ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?", queryArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	items := []domain.User{}
	for rows.Next() {
		item, err := scanUser(rows)
		if err != nil {
			return nil, 0, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func (r *AdminUserRepo) GetByID(ctx context.Context, id string) (domain.User, error) {
	return scanUser(q(ctx, r.db).QueryRowContext(ctx, "SELECT "+userCols+" FROM users WHERE id=?", id))
}

func (r *AdminUserRepo) UpdateRole(ctx context.Context, id string, role domain.Role, isActive bool) error {
	_, err := q(ctx, r.db).ExecContext(ctx, "UPDATE users SET role=?,is_active=? WHERE id=?", string(role), isActive, id)
	return err
}

var _ ucuser.Repository = (*AdminUserRepo)(nil)
