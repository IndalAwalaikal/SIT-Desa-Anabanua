package mysql

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"desa-anabanua-api/internal/domain"
	"desa-anabanua-api/internal/usecase/pajak"
)

type PajakRepo struct {
	db *sql.DB
}

func NewPajakRepo(db *sql.DB) *PajakRepo {
	return &PajakRepo{db: db}
}

var _ pajak.Repository = (*PajakRepo)(nil)

// ---- Master Jenis Pajak ----

func (r *PajakRepo) ListJenisPajak(ctx context.Context, onlyAktif bool) ([]domain.JenisPajak, error) {
	qy := "SELECT id, kode, nama, kategori, COALESCE(satuan,''), periode, aktif, created_at, updated_at FROM master_jenis_pajak"
	if onlyAktif {
		qy += " WHERE aktif = 1"
	}
	qy += " ORDER BY kode ASC"

	rows, err := q(ctx, r.db).QueryContext(ctx, qy)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []domain.JenisPajak{}
	for rows.Next() {
		var jp domain.JenisPajak
		var aktif int
		if err := rows.Scan(&jp.ID, &jp.Kode, &jp.Nama, &jp.Kategori, &jp.Satuan, &jp.Periode, &aktif, &jp.CreatedAt, &jp.UpdatedAt); err != nil {
			return nil, err
		}
		jp.Aktif = (aktif == 1)
		items = append(items, jp)
	}
	return items, rows.Err()
}

func (r *PajakRepo) GetJenisPajak(ctx context.Context, id string) (domain.JenisPajak, error) {
	qy := "SELECT id, kode, nama, kategori, COALESCE(satuan,''), periode, aktif, created_at, updated_at FROM master_jenis_pajak WHERE id = ?"
	var jp domain.JenisPajak
	var aktif int
	err := q(ctx, r.db).QueryRowContext(ctx, qy, id).Scan(&jp.ID, &jp.Kode, &jp.Nama, &jp.Kategori, &jp.Satuan, &jp.Periode, &aktif, &jp.CreatedAt, &jp.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.JenisPajak{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.JenisPajak{}, err
	}
	jp.Aktif = (aktif == 1)
	return jp, nil
}

func (r *PajakRepo) CreateJenisPajak(ctx context.Context, jp domain.JenisPajak) error {
	qy := "INSERT INTO master_jenis_pajak (id, kode, nama, kategori, satuan, periode, aktif) VALUES (?, ?, ?, ?, ?, ?, ?)"
	var satuan *string
	if jp.Satuan != "" {
		satuan = &jp.Satuan
	}
	aktif := 0
	if jp.Aktif {
		aktif = 1
	}
	_, err := q(ctx, r.db).ExecContext(ctx, qy, jp.ID, jp.Kode, jp.Nama, jp.Kategori, satuan, jp.Periode, aktif)
	return err
}

func (r *PajakRepo) UpdateJenisPajak(ctx context.Context, jp domain.JenisPajak) error {
	qy := "UPDATE master_jenis_pajak SET kode = ?, nama = ?, kategori = ?, satuan = ?, periode = ?, aktif = ? WHERE id = ?"
	var satuan *string
	if jp.Satuan != "" {
		satuan = &jp.Satuan
	}
	aktif := 0
	if jp.Aktif {
		aktif = 1
	}
	res, err := q(ctx, r.db).ExecContext(ctx, qy, jp.Kode, jp.Nama, jp.Kategori, satuan, jp.Periode, aktif, jp.ID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *PajakRepo) DeleteJenisPajak(ctx context.Context, id string) error {
	res, err := q(ctx, r.db).ExecContext(ctx, "DELETE FROM master_jenis_pajak WHERE id = ?", id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *PajakRepo) JenisPajakDipakai(ctx context.Context, id string) (bool, error) {
	var count int
	err := q(ctx, r.db).QueryRowContext(ctx, "SELECT COUNT(*) FROM transaksi_pajak WHERE jenis_pajak_id = ?", id).Scan(&count)
	return count > 0, err
}

// ---- Wajib Pajak ----

func (r *PajakRepo) ListWajibPajak(ctx context.Context, f pajak.WajibPajakFilter) ([]domain.WajibPajak, int, error) {
	where := []string{"1=1"}
	args := []any{}

	if strings.TrimSpace(f.Search) != "" {
		s := "%" + strings.TrimSpace(f.Search) + "%"
		where = append(where, "(nama LIKE ? OR no_objek LIKE ? OR nik LIKE ? OR dusun LIKE ?)")
		args = append(args, s, s, s, s)
	}

	whereClause := strings.Join(where, " AND ")
	countQy := "SELECT COUNT(*) FROM wajib_pajak WHERE " + whereClause

	var total int
	if err := q(ctx, r.db).QueryRowContext(ctx, countQy, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	limit := f.Limit
	if limit <= 0 {
		limit = 20
	}
	page := f.Page
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit

	qy := fmt.Sprintf("SELECT id, COALESCE(user_id,''), no_objek, nama, COALESCE(nik,''), alamat, rt, rw, dusun, created_at, updated_at FROM wajib_pajak WHERE %s ORDER BY nama ASC LIMIT %d OFFSET %d", whereClause, limit, offset)

	rows, err := q(ctx, r.db).QueryContext(ctx, qy, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	items := []domain.WajibPajak{}
	for rows.Next() {
		var wp domain.WajibPajak
		if err := rows.Scan(&wp.ID, &wp.UserID, &wp.NoObjek, &wp.Nama, &wp.NIK, &wp.Alamat, &wp.RT, &wp.RW, &wp.Dusun, &wp.CreatedAt, &wp.UpdatedAt); err != nil {
			return nil, 0, err
		}
		items = append(items, wp)
	}
	return items, total, rows.Err()
}

func (r *PajakRepo) GetWajibPajak(ctx context.Context, id string) (domain.WajibPajak, error) {
	qy := "SELECT id, COALESCE(user_id,''), no_objek, nama, COALESCE(nik,''), alamat, rt, rw, dusun, created_at, updated_at FROM wajib_pajak WHERE id = ?"
	var wp domain.WajibPajak
	err := q(ctx, r.db).QueryRowContext(ctx, qy, id).Scan(&wp.ID, &wp.UserID, &wp.NoObjek, &wp.Nama, &wp.NIK, &wp.Alamat, &wp.RT, &wp.RW, &wp.Dusun, &wp.CreatedAt, &wp.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.WajibPajak{}, domain.ErrNotFound
	}
	return wp, err
}

func (r *PajakRepo) CountWajibPajakByNIK(ctx context.Context, nik string) (int, error) {
	var count int
	err := q(ctx, r.db).QueryRowContext(ctx, "SELECT COUNT(*) FROM wajib_pajak WHERE nik = ?", nik).Scan(&count)
	return count, err
}

func (r *PajakRepo) CreateWajibPajak(ctx context.Context, wp domain.WajibPajak) error {
	qy := "INSERT INTO wajib_pajak (id, user_id, no_objek, nama, nik, alamat, rt, rw, dusun) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
	var userID, nik *string
	if wp.UserID != "" {
		userID = &wp.UserID
	}
	if wp.NIK != "" {
		nik = &wp.NIK
	}
	_, err := q(ctx, r.db).ExecContext(ctx, qy, wp.ID, userID, wp.NoObjek, wp.Nama, nik, wp.Alamat, wp.RT, wp.RW, wp.Dusun)
	return err
}

func (r *PajakRepo) UpdateWajibPajak(ctx context.Context, wp domain.WajibPajak) error {
	qy := "UPDATE wajib_pajak SET user_id = ?, no_objek = ?, nama = ?, nik = ?, alamat = ?, rt = ?, rw = ?, dusun = ? WHERE id = ?"
	var userID, nik *string
	if wp.UserID != "" {
		userID = &wp.UserID
	}
	if wp.NIK != "" {
		nik = &wp.NIK
	}
	res, err := q(ctx, r.db).ExecContext(ctx, qy, userID, wp.NoObjek, wp.Nama, nik, wp.Alamat, wp.RT, wp.RW, wp.Dusun, wp.ID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *PajakRepo) DeleteWajibPajak(ctx context.Context, id string) error {
	res, err := q(ctx, r.db).ExecContext(ctx, "DELETE FROM wajib_pajak WHERE id = ?", id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *PajakRepo) WajibPajakDipakai(ctx context.Context, id string) (bool, error) {
	var count int
	err := q(ctx, r.db).QueryRowContext(ctx, "SELECT COUNT(*) FROM transaksi_pajak WHERE wajib_pajak_id = ?", id).Scan(&count)
	return count > 0, err
}

// ---- Transaksi ----

func (r *PajakRepo) CountTransaksiTahun(ctx context.Context, tahun int) (int, error) {
	var count int
	err := q(ctx, r.db).QueryRowContext(ctx, "SELECT COUNT(*) FROM transaksi_pajak WHERE tahun = ?", tahun).Scan(&count)
	return count, err
}

const transaksiCols = `
	t.id, t.nomor_bukti, t.jenis_pajak_id, jp.kode, jp.nama,
	t.wajib_pajak_id, wp.no_objek, wp.nama, COALESCE(wp.nik,''), wp.dusun,
	t.tahun, t.periode, t.nominal, t.tanggal_bayar, t.status,
	COALESCE(t.catatan,''), COALESCE(t.catatan_pembatalan,''),
	COALESCE(t.pencatat_id,''), COALESCE(t.verifikator_id,''), t.tgl_verifikasi,
	COALESCE(t.setoran_id,''), COALESCE(sp.nomor_setoran,''),
	t.created_at, t.updated_at
`

func scanTransaksi(s interface {
	Scan(dest ...any) error
}) (domain.TransaksiPajak, error) {
	var t domain.TransaksiPajak
	var statusStr string
	var tglVerif sql.NullTime

	err := s.Scan(
		&t.ID, &t.NomorBukti, &t.JenisPajakID, &t.JenisPajakKode, &t.JenisPajakNama,
		&t.WajibPajakID, &t.NoObjek, &t.WajibPajakNama, &t.NIK, &t.Dusun,
		&t.Tahun, &t.Periode, &t.Nominal, &t.TanggalBayar, &statusStr,
		&t.Catatan, &t.CatatanBatal,
		&t.PencatatID, &t.VerifikatorID, &tglVerif,
		&t.SetoranID, &t.SetoranNomor,
		&t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		return t, err
	}
	t.Status = domain.StatusTransaksiPajak(statusStr)
	if tglVerif.Valid {
		t.TglVerifikasi = &tglVerif.Time
	}
	return t, nil
}

func (r *PajakRepo) ListTransaksi(ctx context.Context, f pajak.TransaksiFilter) ([]domain.TransaksiPajak, int, error) {
	where := []string{"1=1"}
	args := []any{}

	if f.Tahun > 0 {
		where = append(where, "t.tahun = ?")
		args = append(args, f.Tahun)
	}
	if strings.TrimSpace(f.JenisPajakID) != "" {
		where = append(where, "t.jenis_pajak_id = ?")
		args = append(args, strings.TrimSpace(f.JenisPajakID))
	}
	if strings.TrimSpace(f.Status) != "" {
		where = append(where, "t.status = ?")
		args = append(args, strings.TrimSpace(f.Status))
	} else if !f.IncludeBatal {
		where = append(where, "t.status != 'dibatalkan'")
	}
	if strings.TrimSpace(f.UserID) != "" {
		where = append(where, "wp.user_id = ?")
		args = append(args, strings.TrimSpace(f.UserID))
	}
	if strings.TrimSpace(f.Search) != "" {
		s := "%" + strings.TrimSpace(f.Search) + "%"
		where = append(where, "(t.nomor_bukti LIKE ? OR wp.nama LIKE ? OR wp.no_objek LIKE ? OR wp.nik LIKE ? OR jp.nama LIKE ?)")
		args = append(args, s, s, s, s, s)
	}

	whereClause := strings.Join(where, " AND ")
	countQy := "SELECT COUNT(*) FROM transaksi_pajak t JOIN master_jenis_pajak jp ON t.jenis_pajak_id = jp.id JOIN wajib_pajak wp ON t.wajib_pajak_id = wp.id LEFT JOIN setoran_pajak sp ON t.setoran_id = sp.id WHERE " + whereClause

	var total int
	if err := q(ctx, r.db).QueryRowContext(ctx, countQy, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	limit := f.Limit
	if limit <= 0 {
		limit = 20
	}
	page := f.Page
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit

	// Whitelist validation for SortBy to prevent SQL injection
	orderCol := "t.created_at"
	switch f.SortBy {
	case "nomor_bukti":
		orderCol = "t.nomor_bukti"
	case "wajib_pajak_nama":
		orderCol = "wp.nama"
	case "nominal":
		orderCol = "t.nominal"
	case "tanggal_bayar":
		orderCol = "t.tanggal_bayar"
	case "status":
		orderCol = "t.status"
	case "created_at":
		orderCol = "t.created_at"
	}

	orderDir := "DESC"
	if strings.ToLower(f.SortOrder) == "asc" {
		orderDir = "ASC"
	}

	qy := fmt.Sprintf(`
		SELECT %s
		FROM transaksi_pajak t
		JOIN master_jenis_pajak jp ON t.jenis_pajak_id = jp.id
		JOIN wajib_pajak wp ON t.wajib_pajak_id = wp.id
		LEFT JOIN setoran_pajak sp ON t.setoran_id = sp.id
		WHERE %s
		ORDER BY %s %s
		LIMIT %d OFFSET %d
	`, transaksiCols, whereClause, orderCol, orderDir, limit, offset)

	rows, err := q(ctx, r.db).QueryContext(ctx, qy, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	items := []domain.TransaksiPajak{}
	for rows.Next() {
		t, err := scanTransaksi(rows)
		if err != nil {
			return nil, 0, err
		}
		items = append(items, t)
	}
	return items, total, rows.Err()
}

func (r *PajakRepo) GetTransaksi(ctx context.Context, id string) (domain.TransaksiPajak, error) {
	qy := fmt.Sprintf(`
		SELECT %s
		FROM transaksi_pajak t
		JOIN master_jenis_pajak jp ON t.jenis_pajak_id = jp.id
		JOIN wajib_pajak wp ON t.wajib_pajak_id = wp.id
		LEFT JOIN setoran_pajak sp ON t.setoran_id = sp.id
		WHERE t.id = ?
	`, transaksiCols)

	t, err := scanTransaksi(q(ctx, r.db).QueryRowContext(ctx, qy, id))
	if errors.Is(err, sql.ErrNoRows) {
		return domain.TransaksiPajak{}, domain.ErrNotFound
	}
	return t, err
}

func (r *PajakRepo) GetTransaksiByNomor(ctx context.Context, nomor string) (domain.TransaksiPajak, error) {
	qy := fmt.Sprintf(`
		SELECT %s
		FROM transaksi_pajak t
		JOIN master_jenis_pajak jp ON t.jenis_pajak_id = jp.id
		JOIN wajib_pajak wp ON t.wajib_pajak_id = wp.id
		LEFT JOIN setoran_pajak sp ON t.setoran_id = sp.id
		WHERE t.nomor_bukti = ?
	`, transaksiCols)

	t, err := scanTransaksi(q(ctx, r.db).QueryRowContext(ctx, qy, nomor))
	if errors.Is(err, sql.ErrNoRows) {
		return domain.TransaksiPajak{}, domain.ErrNotFound
	}
	return t, err
}

func (r *PajakRepo) CreateTransaksi(ctx context.Context, t domain.TransaksiPajak, audit domain.AuditLogPajak) error {
	qyTrx := `
		INSERT INTO transaksi_pajak (id, nomor_bukti, jenis_pajak_id, wajib_pajak_id, tahun, periode, nominal, tanggal_bayar, status, catatan, pencatat_id)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	var pencatatID *string
	if t.PencatatID != "" {
		pencatatID = &t.PencatatID
	}
	var catatan *string
	if t.Catatan != "" {
		catatan = &t.Catatan
	}

	exec := q(ctx, r.db)
	if _, err := exec.ExecContext(ctx, qyTrx, t.ID, t.NomorBukti, t.JenisPajakID, t.WajibPajakID, t.Tahun, t.Periode, t.Nominal, t.TanggalBayar, string(t.Status), catatan, pencatatID); err != nil {
		return err
	}

	qyAudit := `
		INSERT INTO audit_log_pajak (id, ref_tipe, ref_id, perubahan, status_lama, status_baru, catatan, user_id)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`
	var auditUserID *string
	if audit.UserID != "" {
		auditUserID = &audit.UserID
	}
	var auditCatatan *string
	if audit.Catatan != "" {
		auditCatatan = &audit.Catatan
	}
	_, err := exec.ExecContext(ctx, qyAudit, audit.ID, audit.RefTipe, audit.RefID, audit.Perubahan, audit.StatusLama, audit.StatusBaru, auditCatatan, auditUserID)
	return err
}

func (r *PajakRepo) UpdateStatusTransaksi(ctx context.Context, t domain.TransaksiPajak, audit domain.AuditLogPajak) error {
	qyTrx := `
		UPDATE transaksi_pajak SET status = ?, verifikator_id = ?, tgl_verifikasi = ?, catatan_pembatalan = ? WHERE id = ?
	`
	var verifID, catatanBatal *string
	if t.VerifikatorID != "" {
		verifID = &t.VerifikatorID
	}
	if t.CatatanBatal != "" {
		catatanBatal = &t.CatatanBatal
	}

	exec := q(ctx, r.db)
	res, err := exec.ExecContext(ctx, qyTrx, string(t.Status), verifID, t.TglVerifikasi, catatanBatal, t.ID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return domain.ErrNotFound
	}

	qyAudit := `
		INSERT INTO audit_log_pajak (id, ref_tipe, ref_id, perubahan, status_lama, status_baru, catatan, user_id)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`
	var auditUserID, auditCatatan *string
	if audit.UserID != "" {
		auditUserID = &audit.UserID
	}
	if audit.Catatan != "" {
		auditCatatan = &audit.Catatan
	}
	_, err = exec.ExecContext(ctx, qyAudit, audit.ID, audit.RefTipe, audit.RefID, audit.Perubahan, audit.StatusLama, audit.StatusBaru, auditCatatan, auditUserID)
	return err
}

// ---- Setoran ----

func (r *PajakRepo) CountSetoranTahun(ctx context.Context, tahun int) (int, error) {
	var count int
	err := q(ctx, r.db).QueryRowContext(ctx, "SELECT COUNT(*) FROM setoran_pajak WHERE YEAR(tanggal_setor) = ?", tahun).Scan(&count)
	return count, err
}

const setoranCols = `
	s.id, s.nomor_setoran, s.tujuan, s.tanggal_setor, s.total_setor, s.status,
	s.disetor_oleh, COALESCE(s.diterima_oleh,''), COALESCE(s.nomor_bukti_penerimaan,''),
	s.tgl_konfirmasi, COALESCE(s.url_bukti,''), COALESCE(s.catatan,''),
	(SELECT COUNT(*) FROM transaksi_pajak WHERE setoran_id = s.id) as jumlah_transaksi,
	s.created_at, s.updated_at
`

func scanSetoran(s interface {
	Scan(dest ...any) error
}) (domain.SetoranPajak, error) {
	var sp domain.SetoranPajak
	var statusStr string
	var tglKonf sql.NullTime

	err := s.Scan(
		&sp.ID, &sp.NomorSetoran, &sp.Tujuan, &sp.TanggalSetor, &sp.TotalSetor, &statusStr,
		&sp.DisetorOleh, &sp.DiterimaOleh, &sp.NomorBuktiPenerimaan,
		&tglKonf, &sp.URLBukti, &sp.Catatan, &sp.JumlahTransaksi,
		&sp.CreatedAt, &sp.UpdatedAt,
	)
	if err != nil {
		return sp, err
	}
	sp.Status = domain.StatusSetoranPajak(statusStr)
	if tglKonf.Valid {
		sp.TglKonfirmasi = &tglKonf.Time
	}
	return sp, nil
}

func (r *PajakRepo) ListSetoran(ctx context.Context, tahun int) ([]domain.SetoranPajak, error) {
	qy := fmt.Sprintf("SELECT %s FROM setoran_pajak s", setoranCols)
	args := []any{}
	if tahun > 0 {
		qy += " WHERE YEAR(s.tanggal_setor) = ?"
		args = append(args, tahun)
	}
	qy += " ORDER BY s.tanggal_setor DESC, s.created_at DESC"

	rows, err := q(ctx, r.db).QueryContext(ctx, qy, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []domain.SetoranPajak{}
	for rows.Next() {
		sp, err := scanSetoran(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, sp)
	}
	return items, rows.Err()
}

func (r *PajakRepo) GetSetoran(ctx context.Context, id string) (domain.SetoranPajak, error) {
	qy := fmt.Sprintf("SELECT %s FROM setoran_pajak s WHERE s.id = ?", setoranCols)
	sp, err := scanSetoran(q(ctx, r.db).QueryRowContext(ctx, qy, id))
	if errors.Is(err, sql.ErrNoRows) {
		return domain.SetoranPajak{}, domain.ErrNotFound
	}
	return sp, err
}

func (r *PajakRepo) CreateSetoran(ctx context.Context, s domain.SetoranPajak, detil []pajak.SetoranDetil) error {
	exec := q(ctx, r.db)

	qySetoran := `
		INSERT INTO setoran_pajak (id, nomor_setoran, tujuan, tanggal_setor, total_setor, status, disetor_oleh, dibuat_oleh)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`
	var dibuatOleh *string
	if s.DisetorOleh != "" {
		dibuatOleh = &s.DisetorOleh
	}

	if _, err := exec.ExecContext(ctx, qySetoran, s.ID, s.NomorSetoran, s.Tujuan, s.TanggalSetor, s.TotalSetor, string(s.Status), s.DisetorOleh, dibuatOleh); err != nil {
		return err
	}

	for _, d := range detil {
		qyUpdateTrx := "UPDATE transaksi_pajak SET status = ?, setoran_id = ? WHERE id = ?"
		if _, err := exec.ExecContext(ctx, qyUpdateTrx, string(d.Transaksi.Status), s.ID, d.Transaksi.ID); err != nil {
			return err
		}

		qyAudit := `
			INSERT INTO audit_log_pajak (id, ref_tipe, ref_id, perubahan, status_lama, status_baru, catatan, user_id)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`
		var auditUserID, auditCatatan *string
		if d.Audit.UserID != "" {
			auditUserID = &d.Audit.UserID
		}
		if d.Audit.Catatan != "" {
			auditCatatan = &d.Audit.Catatan
		}
		if _, err := exec.ExecContext(ctx, qyAudit, d.Audit.ID, d.Audit.RefTipe, d.Audit.RefID, d.Audit.Perubahan, d.Audit.StatusLama, d.Audit.StatusBaru, auditCatatan, auditUserID); err != nil {
			return err
		}
	}
	return nil
}

func (r *PajakRepo) ConfirmSetoran(ctx context.Context, s domain.SetoranPajak, detil []pajak.SetoranDetil) error {
	exec := q(ctx, r.db)

	qySetoran := `
		UPDATE setoran_pajak SET status = ?, diterima_oleh = ?, nomor_bukti_penerimaan = ?, tgl_konfirmasi = ?, catatan = ? WHERE id = ?
	`
	var diterima, noBukti, catatan *string
	if s.DiterimaOleh != "" {
		diterima = &s.DiterimaOleh
	}
	if s.NomorBuktiPenerimaan != "" {
		noBukti = &s.NomorBuktiPenerimaan
	}
	if s.Catatan != "" {
		catatan = &s.Catatan
	}

	res, err := exec.ExecContext(ctx, qySetoran, string(s.Status), diterima, noBukti, s.TglKonfirmasi, catatan, s.ID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return domain.ErrNotFound
	}

	for _, d := range detil {
		qyUpdateTrx := "UPDATE transaksi_pajak SET status = ? WHERE id = ?"
		if _, err := exec.ExecContext(ctx, qyUpdateTrx, string(d.Transaksi.Status), d.Transaksi.ID); err != nil {
			return err
		}

		qyAudit := `
			INSERT INTO audit_log_pajak (id, ref_tipe, ref_id, perubahan, status_lama, status_baru, catatan, user_id)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`
		var auditUserID, auditCat *string
		if d.Audit.UserID != "" {
			auditUserID = &d.Audit.UserID
		}
		if d.Audit.Catatan != "" {
			auditCat = &d.Audit.Catatan
		}
		if _, err := exec.ExecContext(ctx, qyAudit, d.Audit.ID, d.Audit.RefTipe, d.Audit.RefID, d.Audit.Perubahan, d.Audit.StatusLama, d.Audit.StatusBaru, auditCat, auditUserID); err != nil {
			return err
		}
	}
	return nil
}

func (r *PajakRepo) SetSetoranBukti(ctx context.Context, id, url string) error {
	res, err := q(ctx, r.db).ExecContext(ctx, "UPDATE setoran_pajak SET url_bukti = ? WHERE id = ?", url, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *PajakRepo) GetTransaksiBySetoran(ctx context.Context, setoranID string) ([]domain.TransaksiPajak, error) {
	qy := fmt.Sprintf(`
		SELECT %s
		FROM transaksi_pajak t
		JOIN master_jenis_pajak jp ON t.jenis_pajak_id = jp.id
		JOIN wajib_pajak wp ON t.wajib_pajak_id = wp.id
		LEFT JOIN setoran_pajak sp ON t.setoran_id = sp.id
		WHERE t.setoran_id = ?
		ORDER BY t.created_at ASC
	`, transaksiCols)

	rows, err := q(ctx, r.db).QueryContext(ctx, qy, setoranID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []domain.TransaksiPajak{}
	for rows.Next() {
		t, err := scanTransaksi(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, t)
	}
	return items, rows.Err()
}

// ---- Audit ----

func (r *PajakRepo) ListAudit(ctx context.Context, refTipe, refID string) ([]domain.AuditLogPajak, error) {
	qy := "SELECT id, ref_tipe, ref_id, perubahan, status_lama, status_baru, COALESCE(catatan,''), COALESCE(user_id,''), created_at FROM audit_log_pajak WHERE 1=1"
	args := []any{}

	if refTipe != "" {
		qy += " AND ref_tipe = ?"
		args = append(args, refTipe)
	}
	if refID != "" {
		qy += " AND ref_id = ?"
		args = append(args, refID)
	}
	qy += " ORDER BY created_at DESC"

	rows, err := q(ctx, r.db).QueryContext(ctx, qy, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []domain.AuditLogPajak{}
	for rows.Next() {
		var a domain.AuditLogPajak
		if err := rows.Scan(&a.ID, &a.RefTipe, &a.RefID, &a.Perubahan, &a.StatusLama, &a.StatusBaru, &a.Catatan, &a.UserID, &a.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, a)
	}
	return items, rows.Err()
}

func (r *PajakRepo) AppendAudit(ctx context.Context, a domain.AuditLogPajak) error {
	qy := `
		INSERT INTO audit_log_pajak (id, ref_tipe, ref_id, perubahan, status_lama, status_baru, catatan, user_id)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`
	var uID, cat *string
	if a.UserID != "" {
		uID = &a.UserID
	}
	if a.Catatan != "" {
		cat = &a.Catatan
	}
	_, err := q(ctx, r.db).ExecContext(ctx, qy, a.ID, a.RefTipe, a.RefID, a.Perubahan, a.StatusLama, a.StatusBaru, cat, uID)
	return err
}

// ---- Ringkasan Agregasi ----

func (r *PajakRepo) Ringkasan(ctx context.Context, tahun int) (domain.RingkasanPajak, error) {
	ringkasan := domain.RingkasanPajak{
		Tahun:    tahun,
		PerJenis: []domain.RingkasanPerJenis{},
		PerBulan: []domain.RingkasanPerBulan{},
	}

	// 1. Jumlah Wajib Pajak
	_ = q(ctx, r.db).QueryRowContext(ctx, "SELECT COUNT(*) FROM wajib_pajak").Scan(&ringkasan.JumlahWajib)

	// 2. Summary per status
	qyStatus := `
		SELECT status, COALESCE(SUM(nominal), 0)
		FROM transaksi_pajak
		WHERE tahun = ?
		GROUP BY status
	`
	rowsStatus, err := q(ctx, r.db).QueryContext(ctx, qyStatus, tahun)
	if err == nil {
		for rowsStatus.Next() {
			var st string
			var val float64
			if err := rowsStatus.Scan(&st, &val); err == nil {
				switch domain.StatusTransaksiPajak(st) {
				case domain.StatusPajakTercatat:
					ringkasan.TotalTercatat = val
				case domain.StatusPajakDiverifikasi:
					ringkasan.TotalDiverifikasi = val
				case domain.StatusPajakDisetor:
					ringkasan.TotalDisetor = val
				case domain.StatusPajakDikonfirmasi:
					ringkasan.TotalDikonfirmasiBPD = val
				case domain.StatusPajakDibatalkan:
					ringkasan.TotalDibatalkan = val
				}
			}
		}
		rowsStatus.Close()
	}

	ringkasan.SisaBelumDisetor = ringkasan.TotalDiverifikasi
	ringkasan.TotalSetoran = ringkasan.TotalDisetor + ringkasan.TotalDikonfirmasiBPD

	// 3. Ringkasan Per Jenis Pajak
	qyJenis := `
		SELECT jp.id, jp.kode, jp.nama,
		       COUNT(t.id) as count_trx,
		       COALESCE(SUM(CASE WHEN t.status != 'dibatalkan' THEN t.nominal ELSE 0 END), 0) as total_valid,
		       COALESCE(SUM(CASE WHEN t.status IN ('disetor', 'dikonfirmasi_bpd') THEN t.nominal ELSE 0 END), 0) as total_disetor,
		       COALESCE(SUM(CASE WHEN t.status = 'diverifikasi' THEN t.nominal ELSE 0 END), 0) as sisa
		FROM master_jenis_pajak jp
		LEFT JOIN transaksi_pajak t ON jp.id = t.jenis_pajak_id AND t.tahun = ?
		GROUP BY jp.id, jp.kode, jp.nama
		ORDER BY jp.kode ASC
	`
	rowsJenis, err := q(ctx, r.db).QueryContext(ctx, qyJenis, tahun)
	if err == nil {
		for rowsJenis.Next() {
			var rj domain.RingkasanPerJenis
			if err := rowsJenis.Scan(&rj.JenisPajakID, &rj.Kode, &rj.Nama, &rj.JumlahTransaksi, &rj.Total, &rj.Disetorkan, &rj.Sisa); err == nil {
				ringkasan.PerJenis = append(ringkasan.PerJenis, rj)
			}
		}
		rowsJenis.Close()
	}

	// 4. Ringkasan Per Bulan
	qyBulan := `
		SELECT MONTH(tanggal_bayar) as bln,
		       COALESCE(SUM(nominal), 0) as total_bln,
		       COUNT(id) as count_trx
		FROM transaksi_pajak
		WHERE tahun = ? AND status != 'dibatalkan'
		GROUP BY bln
		ORDER BY bln ASC
	`
	rowsBulan, err := q(ctx, r.db).QueryContext(ctx, qyBulan, tahun)
	if err == nil {
		for rowsBulan.Next() {
			var rb domain.RingkasanPerBulan
			if err := rowsBulan.Scan(&rb.Bulan, &rb.Total, &rb.JumlahTransaksi); err == nil {
				ringkasan.PerBulan = append(ringkasan.PerBulan, rb)
			}
		}
		rowsBulan.Close()
	}

	return ringkasan, nil
}
