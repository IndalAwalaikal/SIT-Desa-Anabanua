package mysql

import (
	"context"
	"database/sql"
	"sync"
	"time"

	"desa-anabanua-api/internal/domain"
	"desa-anabanua-api/internal/usecase/pengunjung"
)

type PengunjungRepo struct {
	db *sql.DB

	pruneMu      sync.Mutex
	lastPruneDay string
}

var wita = time.FixedZone("WITA", 8*60*60)

func NewPengunjungRepo(db *sql.DB) *PengunjungRepo { return &PengunjungRepo{db: db} }

// Track records a visit for the given day + IP hash, updates the daily aggregate
// and returns whether the IP is new (unique visitor) for that day.
// Best-effort: occasional pruning of old IP-hash rows keeps the table bounded.
func (r *PengunjungRepo) Track(ctx context.Context, tanggal, ipHash string) (bool, error) {
	res, err := q(ctx, r.db).ExecContext(ctx,
		"INSERT IGNORE INTO pengunjung_harian_ip (tanggal, ip_hash) VALUES (?, ?)",
		tanggal, ipHash)
	if err != nil {
		return false, err
	}
	affected, _ := res.RowsAffected()
	isNew := affected > 0

	var query string
	if isNew {
		query = "INSERT INTO pengunjung_harian (tanggal, pengunjung, kunjungan) VALUES (?, 1, 1) " +
			"ON DUPLICATE KEY UPDATE pengunjung = pengunjung + 1, kunjungan = kunjungan + 1"
	} else {
		query = "INSERT INTO pengunjung_harian (tanggal, pengunjung, kunjungan) VALUES (?, 0, 1) " +
			"ON DUPLICATE KEY UPDATE kunjungan = kunjungan + 1"
	}
	if _, err := q(ctx, r.db).ExecContext(ctx, query, tanggal); err != nil {
		return false, err
	}

	// Archive stale IP-hash rows occasionally to keep the table small.
	r.pruneOldIP(ctx)
	return isNew, nil
}

// pruneOldIP removes IP-hash rows older than today, at most once per process
// per day. Deduplication only needs the current day's rows.
func (r *PengunjungRepo) pruneOldIP(ctx context.Context) {
	today := time.Now().In(wita).Format("2006-01-02")
	r.pruneMu.Lock()
	defer r.pruneMu.Unlock()
	if r.lastPruneDay == today {
		return
	}

	if _, err := q(ctx, r.db).ExecContext(ctx,
		"DELETE FROM pengunjung_harian_ip WHERE tanggal < ?", today); err == nil {
		r.lastPruneDay = today
	}
}

func (r *PengunjungRepo) Stats(ctx context.Context) (domain.PengunjungStats, error) {
	var stats domain.PengunjungStats
	now := time.Now().In(wita)
	today := now.Format("2006-01-02")
	start7 := now.AddDate(0, 0, -6).Format("2006-01-02")

	// Today's aggregate (0s if no row exists yet).
	stats.HariIni.Tanggal = today
	err := q(ctx, r.db).QueryRowContext(ctx,
		"SELECT pengunjung, kunjungan FROM pengunjung_harian WHERE tanggal = ?", today).
		Scan(&stats.HariIni.Pengunjung, &stats.HariIni.Kunjungan)
	if err != nil && err != sql.ErrNoRows {
		return stats, err
	}

	// Last 7 days including today (missing days default to 0).
	rows, err := q(ctx, r.db).QueryContext(ctx,
		"SELECT tanggal, pengunjung, kunjungan FROM pengunjung_harian WHERE tanggal BETWEEN ? AND ? ORDER BY tanggal",
		start7, today)
	if err != nil {
		return stats, err
	}
	byDate := map[string]domain.PengunjungHarian{}
	for rows.Next() {
		var d domain.PengunjungHarian
		if err := rows.Scan(&d.Tanggal, &d.Pengunjung, &d.Kunjungan); err != nil {
			rows.Close()
			return stats, err
		}
		byDate[d.Tanggal] = d
	}
	if err := rows.Err(); err != nil {
		return stats, err
	}
	rows.Close()

	cur := now.AddDate(0, 0, -6)
	for i := 0; i < 7; i++ {
		key := cur.Format("2006-01-02")
		d, ok := byDate[key]
		if !ok {
			d = domain.PengunjungHarian{Tanggal: key}
		}
		stats.Terakhir7 = append(stats.Terakhir7, d)
		cur = cur.AddDate(0, 0, 1)
	}

	// Lifetime totals.
	err = q(ctx, r.db).QueryRowContext(ctx,
		"SELECT COALESCE(SUM(pengunjung), 0), COALESCE(SUM(kunjungan), 0) FROM pengunjung_harian").
		Scan(&stats.TotalPengunjung, &stats.TotalKunjungan)

	return stats, err
}

var _ pengunjung.Repository = (*PengunjungRepo)(nil)
