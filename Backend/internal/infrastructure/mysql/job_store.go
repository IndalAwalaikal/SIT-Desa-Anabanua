package mysql

import (
	"context"
	"database/sql"
	"encoding/json"
	"log/slog"
	"time"

	"desa-anabanua-api/internal/infrastructure/jobs"
)

// Compile-time check — JobStore implements jobs.Store.
var _ jobs.Store = (*JobStore)(nil)

// JobStore persists background jobs to the `jobs` table so that email /
// WhatsApp delivery survives process restarts and crashes.
type JobStore struct {
	db    *sql.DB
	log   *slog.Logger
}

func NewJobStore(db *sql.DB, logger *slog.Logger) *JobStore {
	return &JobStore{db: db, log: logger}
}

// PersistJob writes a new job row to the database before it is enqueued
// into the in-memory channel.
func (s *JobStore) PersistJob(ctx context.Context, j jobs.Job) error {
	payload, err := json.Marshal(j.Payload)
	if err != nil {
		return err
	}
	_, err = q(ctx, s.db).ExecContext(ctx,
		"INSERT INTO jobs(id,type,payload,status,retries,max_retries,created_at) VALUES(?,?,?,?,?,?,?)",
		j.ID, string(j.Type), payload, "pending", j.Retries, j.MaxRetries, j.CreatedAt)
	return err
}

// UpdateJobStatus changes the status of a job row (pending → processing,
// processing → completed, etc.).
func (s *JobStore) UpdateJobStatus(ctx context.Context, jobID, status string) error {
	_, err := q(ctx, s.db).ExecContext(ctx,
		"UPDATE jobs SET status=?, updated_at=NOW() WHERE id=?", status, jobID)
	return err
}

// IncrementJobRetries bumps the retry counter for a job row.
func (s *JobStore) IncrementJobRetries(ctx context.Context, jobID string) error {
	_, err := q(ctx, s.db).ExecContext(ctx,
		"UPDATE jobs SET retries=retries+1, updated_at=NOW() WHERE id=?", jobID)
	return err
}

// SetJobError records the last error message for a failed job.
func (s *JobStore) SetJobError(ctx context.Context, jobID, errorMsg string) error {
	_, err := q(ctx, s.db).ExecContext(ctx,
		"UPDATE jobs SET error_message=?, updated_at=NOW() WHERE id=?", errorMsg, jobID)
	return err
}

// ClaimStaleJobs returns jobs that are still 'pending' or 'processing' but
// were created before olderThan.  These are considered orphaned (their
// original worker is gone) and will be re-enqueued on startup.
func (s *JobStore) ClaimStaleJobs(ctx context.Context, olderThan time.Time, limit int) ([]jobs.Job, error) {
	rows, err := q(ctx, s.db).QueryContext(ctx,
		"SELECT id,type,payload,status,retries,max_retries,created_at FROM jobs WHERE status IN ('pending','processing') AND created_at < ? ORDER BY created_at ASC LIMIT ?",
		olderThan, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]jobs.Job, 0, limit)
	for rows.Next() {
		var j jobs.Job
		var jtype, status string
		var payloadJSON []byte
		if err := rows.Scan(&j.ID, &jtype, &payloadJSON, &status, &j.Retries, &j.MaxRetries, &j.CreatedAt); err != nil {
			continue
		}
		j.Type = jobs.JobType(jtype)
		_ = json.Unmarshal(payloadJSON, &j.Payload)
		out = append(out, j)
	}
	return out, nil
}