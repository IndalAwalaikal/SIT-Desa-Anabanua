package mysql

import (
	"context"
	"database/sql"
	"encoding/json"

	"desa-anabanua-api/internal/domain"
	"desa-anabanua-api/internal/usecase/persuratan"
)

// ---- Jenis Surat ----

type JenisSuratRepo struct{ db *sql.DB }

func NewJenisSuratRepo(db *sql.DB) *JenisSuratRepo { return &JenisSuratRepo{db: db} }

func scanJenis(s rowScanner) (domain.JenisSurat, error) {
	var j domain.JenisSurat
	var persyaratan, formFields string
	var kategori, nomorFormat sql.NullString
	var tplHTML, wfConfig sql.NullString
	if err := s.Scan(&j.Kode, &kategori, &j.Nama, &j.Deskripsi, &persyaratan, &formFields, &tplHTML, &wfConfig, &nomorFormat, &j.EstimasiHari, &j.Ikon, &j.IsActive); err != nil {
		return j, err
	}
	_ = json.Unmarshal([]byte(persyaratan), &j.Persyaratan)
	_ = json.Unmarshal([]byte(formFields), &j.FormFields)
	if tplHTML.Valid {
		j.TemplateHTML = &tplHTML.String
	}
	if wfConfig.Valid && wfConfig.String != "" {
		_ = json.Unmarshal([]byte(wfConfig.String), &j.WorkflowConfig)
	}
	if kategori.Valid {
		j.Kategori = kategori.String
	} else {
		j.Kategori = "Umum"
	}
	if nomorFormat.Valid {
		j.NomorSuratFormat = nomorFormat.String
	} else {
		j.NomorSuratFormat = "470/{index}/DB/{bulan_romawi}/{tahun}"
	}
	if j.Persyaratan == nil {
		j.Persyaratan = []string{}
	}
	if j.FormFields == nil {
		j.FormFields = []domain.FormFieldConfig{}
	}
	if j.WorkflowConfig == nil {
		j.WorkflowConfig = []domain.WorkflowStepConfig{}
	}
	return j, nil
}

func (r *JenisSuratRepo) List(ctx context.Context, includeInactive bool) ([]domain.JenisSurat, error) {
	qy := "SELECT kode,kategori,nama,deskripsi,persyaratan,form_fields,template_html,workflow_config,nomor_surat_format,estimasi_hari,ikon,is_active FROM jenis_surat"
	if !includeInactive {
		qy += " WHERE is_active=TRUE"
	}
	qy += " ORDER BY nama ASC"
	rows, err := r.db.QueryContext(ctx, qy)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var res []domain.JenisSurat
	seenKode := make(map[string]bool)
	seenNama := make(map[string]bool)
	for rows.Next() {
		j, err := scanJenis(rows)
		if err != nil {
			return nil, err
		}
		if seenKode[j.Kode] || seenNama[j.Nama] {
			continue
		}
		seenKode[j.Kode] = true
		seenNama[j.Nama] = true
		res = append(res, j)
	}
	return res, rows.Err()
}

func (r *JenisSuratRepo) GetByKode(ctx context.Context, kode string) (domain.JenisSurat, error) {
	return scanJenis(q(ctx, r.db).QueryRowContext(ctx, "SELECT kode,kategori,nama,deskripsi,persyaratan,form_fields,template_html,workflow_config,nomor_surat_format,estimasi_hari,ikon,is_active FROM jenis_surat WHERE kode=?", kode))
}

func (r *JenisSuratRepo) Create(ctx context.Context, j domain.JenisSurat) error {
	var tpl *string = j.TemplateHTML
	var wf any = nil
	if len(j.WorkflowConfig) > 0 {
		wf = mustJSON(j.WorkflowConfig)
	}
	if j.Kategori == "" {
		j.Kategori = "Umum"
	}
	if j.NomorSuratFormat == "" {
		j.NomorSuratFormat = "470/{index}/DB/{bulan_romawi}/{tahun}"
	}
	_, err := q(ctx, r.db).ExecContext(ctx,
		"INSERT INTO jenis_surat(kode,kategori,nama,deskripsi,persyaratan,form_fields,template_html,workflow_config,nomor_surat_format,estimasi_hari,ikon,is_active) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
		j.Kode, j.Kategori, j.Nama, j.Deskripsi, mustJSON(j.Persyaratan), mustJSON(j.FormFields), tpl, wf, j.NomorSuratFormat, j.EstimasiHari, j.Ikon, j.IsActive)
	return err
}

func (r *JenisSuratRepo) Update(ctx context.Context, j domain.JenisSurat) error {
	var tpl *string = j.TemplateHTML
	var wf any = nil
	if len(j.WorkflowConfig) > 0 {
		wf = mustJSON(j.WorkflowConfig)
	}
	if j.Kategori == "" {
		j.Kategori = "Umum"
	}
	if j.NomorSuratFormat == "" {
		j.NomorSuratFormat = "470/{index}/DB/{bulan_romawi}/{tahun}"
	}
	_, err := q(ctx, r.db).ExecContext(ctx,
		"UPDATE jenis_surat SET kategori=?,nama=?,deskripsi=?,persyaratan=?,form_fields=?,template_html=?,workflow_config=?,nomor_surat_format=?,estimasi_hari=?,ikon=?,is_active=? WHERE kode=?",
		j.Kategori, j.Nama, j.Deskripsi, mustJSON(j.Persyaratan), mustJSON(j.FormFields), tpl, wf, j.NomorSuratFormat, j.EstimasiHari, j.Ikon, j.IsActive, j.Kode)
	return err
}


func (r *JenisSuratRepo) Delete(ctx context.Context, kode string) error {
	_, err := q(ctx, r.db).ExecContext(ctx, "DELETE FROM jenis_surat WHERE kode=?", kode)
	return err
}

// PengajuanRepo methods continue in the same package file below.
var _ persuratan.JenisSuratRepository = (*JenisSuratRepo)(nil)

