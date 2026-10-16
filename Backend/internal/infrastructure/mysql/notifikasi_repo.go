package mysql

import (
	"context"
	"database/sql"

	"desa-anabanua-api/internal/domain"
)

type NotifikasiRepo struct{ db *sql.DB }

func NewNotifikasiRepo(db *sql.DB) *NotifikasiRepo { return &NotifikasiRepo{db: db} }

func (r *NotifikasiRepo) Create(ctx context.Context, n domain.Notifikasi) error {
	_, err := q(ctx, r.db).ExecContext(ctx,
		"INSERT INTO notifikasi(id,user_id,title,message,type,link,is_read,created_at) VALUES(?,?,?,?,?,?,?,?)",
		n.ID, n.UserID, n.Title, n.Message, n.Type, n.Link, n.IsRead, n.CreatedAt)
	return err
}

func (r *NotifikasiRepo) ListByUser(ctx context.Context, userID string, limit int) ([]domain.Notifikasi, error) {
	rows, err := q(ctx, r.db).QueryContext(ctx,
		"SELECT id,user_id,title,message,type,link,is_read,created_at FROM notifikasi WHERE user_id=? ORDER BY created_at DESC LIMIT ?",
		userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.Notifikasi{}
	for rows.Next() {
		var n domain.Notifikasi
		var link sql.NullString
		if err := rows.Scan(&n.ID, &n.UserID, &n.Title, &n.Message, &n.Type, &link, &n.IsRead, &n.CreatedAt); err == nil {
			if link.Valid {
				n.Link = &link.String
			}
			out = append(out, n)
		}
	}
	return out, nil
}

func (r *NotifikasiRepo) MarkAsRead(ctx context.Context, id string, userID string) error {
	_, err := q(ctx, r.db).ExecContext(ctx,
		"UPDATE notifikasi SET is_read=TRUE WHERE id=? AND user_id=?",
		id, userID)
	return err
}

func (r *NotifikasiRepo) MarkAllAsRead(ctx context.Context, userID string) error {
	_, err := q(ctx, r.db).ExecContext(ctx,
		"UPDATE notifikasi SET is_read=TRUE WHERE user_id=? AND is_read=FALSE",
		userID)
	return err
}

func (r *NotifikasiRepo) CountUnread(ctx context.Context, userID string) (int, error) {
	var count int
	err := q(ctx, r.db).QueryRowContext(ctx,
		"SELECT COUNT(*) FROM notifikasi WHERE user_id=? AND is_read=FALSE",
		userID).Scan(&count)
	return count, err
}
