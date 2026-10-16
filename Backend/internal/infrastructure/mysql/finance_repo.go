package mysql

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"

	"desa-anabanua-api/internal/domain"
	"desa-anabanua-api/internal/pkg/apputil"
	"desa-anabanua-api/internal/usecase/finance"
)

// ---- Statistik Penduduk ----

type StatistikRepo struct{ db *sql.DB }

func NewStatistikRepo(db *sql.DB) *StatistikRepo { return &StatistikRepo{db: db} }

func (r *StatistikRepo) GetByTahun(ctx context.Context, tahun int) (domain.StatistikPenduduk, error) {
	var raw string
	err := q(ctx, r.db).QueryRowContext(ctx, "SELECT data FROM statistik_penduduk WHERE tahun=?", tahun).Scan(&raw)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.StatistikPenduduk{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.StatistikPenduduk{}, err
	}
	var s domain.StatistikPenduduk
	if err := json.Unmarshal([]byte(raw), &s.Data); err != nil {
		return s, err
	}
	s.Tahun = tahun
	return s, nil
}

func (r *StatistikRepo) GetLatest(ctx context.Context) (domain.StatistikPenduduk, error) {
	var raw string
	var tahun int
	err := q(ctx, r.db).QueryRowContext(ctx, "SELECT tahun,data FROM statistik_penduduk ORDER BY tahun DESC LIMIT 1").Scan(&tahun, &raw)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.StatistikPenduduk{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.StatistikPenduduk{}, err
	}
	var s domain.StatistikPenduduk
	if err := json.Unmarshal([]byte(raw), &s.Data); err != nil {
		return s, err
	}
	s.Tahun = tahun
	return s, nil
}

func (r *StatistikRepo) Upsert(ctx context.Context, s domain.StatistikPenduduk) error {
	s.Data.Tahun = s.Tahun
	_, err := q(ctx, r.db).ExecContext(ctx,
		"INSERT INTO statistik_penduduk(tahun,data) VALUES(?,?) ON DUPLICATE KEY UPDATE data=VALUES(data)",
		s.Tahun, mustJSON(s.Data))
	return err
}

// GetTrenBulanan returns the monthly birth/death/move series for a given year,
// ordered by month. An empty slice is returned when no rows exist for the year.
func (r *StatistikRepo) GetTrenBulanan(ctx context.Context, tahun int) ([]domain.StatistikBulanan, error) {
	rows, err := q(ctx, r.db).QueryContext(ctx,
		"SELECT bulan,lahir,meninggal,pindah_masuk,pindah_keluar FROM statistik_bulanan WHERE tahun=? ORDER BY bulan", tahun)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.StatistikBulanan{}
	for rows.Next() {
		var b domain.StatistikBulanan
		if err := rows.Scan(&b.Bulan, &b.Lahir, &b.Meninggal, &b.PindahMasuk, &b.PindahKeluar); err != nil {
			return nil, err
		}
		out = append(out, b)
	}
	return out, rows.Err()
}

// UpsertTrenBulanan replaces every monthly row for the given year. It deletes
// all existing rows for the year inside a single transaction, then inserts every
// supplied row. Passing a partial/empty set clears the year.
func (r *StatistikRepo) UpsertTrenBulanan(ctx context.Context, tahun int, rows []domain.StatistikBulanan) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err := tx.ExecContext(ctx, "DELETE FROM statistik_bulanan WHERE tahun=?", tahun); err != nil {
		return err
	}
	for _, b := range rows {
		if _, err := tx.ExecContext(ctx,
			"INSERT INTO statistik_bulanan(tahun,bulan,lahir,meninggal,pindah_masuk,pindah_keluar) VALUES(?,?,?,?,?,?)",
			tahun, b.Bulan, b.Lahir, b.Meninggal, b.PindahMasuk, b.PindahKeluar); err != nil {
			return err
		}
	}
	return tx.Commit()
}

// ---- APBDes ----

type ApbdesRepo struct{ db *sql.DB }

func NewApbdesRepo(db *sql.DB) *ApbdesRepo { return &ApbdesRepo{db: db} }

func nullIntPtr(n sql.NullInt64) *int {
	if !n.Valid {
		return nil
	}
	v := int(n.Int64)
	return &v
}

func scanApbdes(s rowScanner) (domain.ApbdesItem, error) {
	var it domain.ApbdesItem
	var jumlah float64
	var bulan, triwulan sql.NullInt64
	if err := s.Scan(&it.ID, &it.Tahun, &bulan, &triwulan, &it.Kategori, &it.SubKategori, &jumlah); err != nil {
		return it, err
	}
	it.Bulan = nullIntPtr(bulan)
	it.Triwulan = nullIntPtr(triwulan)
	it.Jumlah = jumlah
	return it, nil
}

func (r *ApbdesRepo) ListForPeriode(ctx context.Context, tahun, bulan, triwulan int) ([]domain.ApbdesItem, error) {
	qy := "SELECT id,tahun,bulan,triwulan,kategori,sub_kategori,jumlah FROM apbdes_item WHERE tahun=?"
	args := []any{tahun}
	if bulan > 0 {
		qy += " AND bulan=?"
		args = append(args, bulan)
	} else if triwulan > 0 {
		qy += " AND (triwulan=? OR (bulan>=? AND bulan<=?))"
		args = append(args, triwulan, (triwulan-1)*3+1, triwulan*3)
	}
	qy += " ORDER BY kategori, sub_kategori"
	rows, err := q(ctx, r.db).QueryContext(ctx, qy, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.ApbdesItem{}
	for rows.Next() {
		it, err := scanApbdes(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, it)
	}
	return out, rows.Err()
}

// ReplaceForPeriode menghapus & menanam ulang baris untuk periode tertentu:
//   - bulan>0     -> hanya baris periode bulanan tsb
//   - triwulan>0  -> hanya baris periode triwulanan tsb
//   - keduanya 0  -> hanya baris tahunan (bulan IS NULL AND triwulan IS NULL)
func (r *ApbdesRepo) ReplaceForPeriode(ctx context.Context, tahun, bulan, triwulan int, items []domain.ApbdesItem) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	delQ := "DELETE FROM apbdes_item WHERE tahun=?"
	args := []any{tahun}
	var b, tw any // nil = NULL di MySQL
	switch {
	case bulan > 0:
		delQ += " AND bulan=?"
		args = append(args, bulan)
		b = bulan
	case triwulan > 0:
		delQ += " AND triwulan=?"
		args = append(args, triwulan)
		tw = triwulan
	default:
		delQ += " AND bulan IS NULL AND triwulan IS NULL"
	}
	if _, err := tx.ExecContext(ctx, delQ, args...); err != nil {
		return err
	}
	for _, it := range items {
		it.ID = apputil.NewID()
		if _, err := tx.ExecContext(ctx,
			"INSERT INTO apbdes_item(id,tahun,bulan,triwulan,kategori,sub_kategori,jumlah) VALUES(?,?,?,?,?,?,?)",
			it.ID, tahun, b, tw, it.Kategori, it.SubKategori, it.Jumlah); err != nil {
			return err
		}
	}
	return tx.Commit()
}

// ---- Agenda Kegiatan ----

type AgendaRepo struct{ db *sql.DB }

func NewAgendaRepo(db *sql.DB) *AgendaRepo { return &AgendaRepo{db: db} }

const agendaCols = "id,judul,deskripsi,tanggal_mulai,tanggal_selesai,lokasi,penyelenggara,kategori"

func scanAgenda(s rowScanner) (domain.AgendaKegiatan, error) {
	var a domain.AgendaKegiatan
	var selesai sql.NullTime
	if err := s.Scan(&a.ID, &a.Judul, &a.Deskripsi, &a.TanggalMulai, &selesai, &a.Lokasi, &a.Penyelenggara, &a.Kategori); err != nil {
		return a, err
	}
	if selesai.Valid {
		a.TanggalSelesai = &selesai.Time
	}
	return a, nil
}

func (r *AgendaRepo) List(ctx context.Context, tahun int) ([]domain.AgendaKegiatan, error) {
	qy := "SELECT " + agendaCols + " FROM agenda_kegiatan"
	args := []any{}
	if tahun > 0 {
		qy += " WHERE YEAR(tanggal_mulai)=?"
		args = append(args, tahun)
	}
	qy += " ORDER BY tanggal_mulai ASC"
	rows, err := q(ctx, r.db).QueryContext(ctx, qy, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.AgendaKegiatan{}
	for rows.Next() {
		a, err := scanAgenda(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

func (r *AgendaRepo) GetByID(ctx context.Context, id string) (domain.AgendaKegiatan, error) {
	return scanAgenda(q(ctx, r.db).QueryRowContext(ctx, "SELECT "+agendaCols+" FROM agenda_kegiatan WHERE id=?", id))
}

func (r *AgendaRepo) Create(ctx context.Context, a domain.AgendaKegiatan) error {
	_, err := q(ctx, r.db).ExecContext(ctx,
		"INSERT INTO agenda_kegiatan(id,judul,deskripsi,tanggal_mulai,tanggal_selesai,lokasi,penyelenggara,kategori) VALUES(?,?,?,?,?,?,?,?)",
		a.ID, a.Judul, a.Deskripsi, a.TanggalMulai, a.TanggalSelesai, a.Lokasi, a.Penyelenggara, a.Kategori)
	return err
}

func (r *AgendaRepo) Update(ctx context.Context, a domain.AgendaKegiatan) error {
	_, err := q(ctx, r.db).ExecContext(ctx,
		"UPDATE agenda_kegiatan SET judul=?,deskripsi=?,tanggal_mulai=?,tanggal_selesai=?,lokasi=?,penyelenggara=?,kategori=? WHERE id=?",
		a.Judul, a.Deskripsi, a.TanggalMulai, a.TanggalSelesai, a.Lokasi, a.Penyelenggara, a.Kategori, a.ID)
	return err
}

func (r *AgendaRepo) Delete(ctx context.Context, id string) error {
	_, err := q(ctx, r.db).ExecContext(ctx, "DELETE FROM agenda_kegiatan WHERE id=?", id)
	return err
}

var _ finance.StatistikRepository = (*StatistikRepo)(nil)
var _ finance.ApbdesRepository = (*ApbdesRepo)(nil)
var _ finance.AgendaRepository = (*AgendaRepo)(nil)
