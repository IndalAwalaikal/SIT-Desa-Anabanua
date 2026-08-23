-- 000012: Rollback Dynamic Persuratan

DROP TABLE IF EXISTS pengajuan_approval_step;

ALTER TABLE pengajuan_surat
  DROP COLUMN nomor_surat_resmi,
  DROP COLUMN subjek_nik,
  DROP COLUMN data_snapshot,
  DROP COLUMN current_step,
  DROP COLUMN file_pdf_url,
  DROP COLUMN qr_verification_code;

DROP TABLE IF EXISTS penduduk;

ALTER TABLE jenis_surat
  DROP COLUMN kategori,
  DROP COLUMN template_html,
  DROP COLUMN workflow_config,
  DROP COLUMN nomor_surat_format;
