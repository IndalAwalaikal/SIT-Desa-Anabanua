package mysql

import (
	"context"
	"database/sql"
	"time"

	"desa-anabanua-api/internal/domain"
	"desa-anabanua-api/internal/pkg/apputil"
)

type SembakoRepo struct{ db *sql.DB }

func NewSembakoRepo(db *sql.DB) *SembakoRepo { return &SembakoRepo{db: db} }

const sembakoPeriodCols = "id,nama,periode,tanggal_mulai,tanggal_selesai,target_penerima,lokasi,keterangan,created_at,updated_at"

func scanSembakoPeriod(s rowScanner) (domain.SembakoPeriod, error) {
	var p domain.SembakoPeriod
	var mulai, created, updated time.Time
	if err := s.Scan(&p.ID, &p.Nama, &p.Periode, &mulai, &p.TanggalSelesai,
		&p.TargetPenerima, &p.Lokasi, &p.Keterangan, &created, &updated); err != nil {
		return p, err
	}
	p.TanggalMulai, p.CreatedAt, p.UpdatedAt = mulai, created, updated
	p.Items = []domain.SembakoItem{}
	return p, nil
}

// attachItems mengisi Items tiap periode dengan satu query batch (anti N+1).
func (r *SembakoRepo) attachItems(ctx context.Context, periods []domain.SembakoPeriod) error {
	if len(periods) == 0 {
		return nil
	}
	rows, err := r.db.QueryContext(ctx,
		"SELECT id,period_id,nama_barang,satuan,jumlah_per_kk,keterangan,sort_order FROM sembako_item ORDER BY sort_order,nama_barang")
	if err != nil {
		return err
	}
	defer rows.Close()
	byPeriod := make(map[string][]domain.SembakoItem, len(periods))
	for rows.Next() {
		var it domain.SembakoItem
		if err := rows.Scan(&it.ID, &it.PeriodID, &it.NamaBarang, &it.Satuan, &it.JumlahPerKK, &it.Keterangan, &it.SortOrder); err != nil {
			return err
		}
		byPeriod[it.PeriodID] = append(byPeriod[it.PeriodID], it)
	}
	if err := rows.Err(); err != nil {
		return err
	}
	for i := range periods {
		if items, ok := byPeriod[periods[i].ID]; ok {
			periods[i].Items = items
		}
	}
	return nil
}

func (r *SembakoRepo) List(ctx context.Context) ([]domain.SembakoPeriod, error) {
	rows, err := r.db.QueryContext(ctx,
		"SELECT "+sembakoPeriodCols+" FROM sembako_period ORDER BY tanggal_mulai DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.SembakoPeriod{}
	for rows.Next() {
		p, err := scanSembakoPeriod(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if err := r.attachItems(ctx, out); err != nil {
		return nil, err
	}
	return out, nil
}

func (r *SembakoRepo) Get(ctx context.Context, id string) (domain.SembakoPeriod, error) {
	row := r.db.QueryRowContext(ctx,
		"SELECT "+sembakoPeriodCols+" FROM sembako_period WHERE id=?", id)
	p, err := scanSembakoPeriod(row)
	if err != nil {
		return p, err
	}
	if err := r.attachItems(ctx, []domain.SembakoPeriod{p}); err != nil {
		return p, err
	}
	return p, nil
}

// replaceItems menulis ulang seluruh item milik satu periode dalam satu transaksi.
func (r *SembakoRepo) replaceItems(ctx context.Context, tx *sql.Tx, periodID string, items []domain.SembakoItem) error {
	if _, err := tx.ExecContext(ctx, "DELETE FROM sembako_item WHERE period_id=?", periodID); err != nil {
		return err
	}
	for i, it := range items {
		id := it.ID
		if id == "" {
			id = apputil.NewID()
		}
		sortOrder := it.SortOrder
		if sortOrder == 0 {
			sortOrder = i + 1
		}
		satuan := it.Satuan
		if satuan == "" {
			satuan = "kg"
		}
		if _, err := tx.ExecContext(ctx,
			"INSERT INTO sembako_item(id,period_id,nama_barang,satuan,jumlah_per_kk,keterangan,sort_order) VALUES(?,?,?,?,?,?,?)",
			id, periodID, it.NamaBarang, satuan, it.JumlahPerKK, it.Keterangan, sortOrder); err != nil {
			return err
		}
	}
	return nil
}

func (r *SembakoRepo) Create(ctx context.Context, p domain.SembakoPeriod) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err := tx.ExecContext(ctx,
		"INSERT INTO sembako_period(id,nama,periode,tanggal_mulai,tanggal_selesai,target_penerima,lokasi,keterangan) VALUES(?,?,?,?,?,?,?,?)",
		p.ID, p.Nama, p.Periode, p.TanggalMulai, p.TanggalSelesai, p.TargetPenerima, p.Lokasi, p.Keterangan); err != nil {
		return err
	}
	if err := r.replaceItems(ctx, tx, p.ID, p.Items); err != nil {
		return err
	}
	return tx.Commit()
}

func (r *SembakoRepo) Update(ctx context.Context, p domain.SembakoPeriod) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	res, err := tx.ExecContext(ctx,
		"UPDATE sembako_period SET nama=?,periode=?,tanggal_mulai=?,tanggal_selesai=?,target_penerima=?,lokasi=?,keterangan=? WHERE id=?",
		p.Nama, p.Periode, p.TanggalMulai, p.TanggalSelesai, p.TargetPenerima, p.Lokasi, p.Keterangan, p.ID)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return domain.ErrNotFound
	}
	if err := r.replaceItems(ctx, tx, p.ID, p.Items); err != nil {
		return err
	}
	return tx.Commit()
}

func (r *SembakoRepo) Delete(ctx context.Context, id string) error {
	res, err := r.db.ExecContext(ctx, "DELETE FROM sembako_period WHERE id=?", id)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return domain.ErrNotFound
	}
	return nil
}
