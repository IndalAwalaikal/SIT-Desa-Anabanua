-- Rollback migration 000008.
DROP TABLE IF EXISTS email_log;
ALTER TABLE pengajuan_surat DROP COLUMN dokumen_email_terkirim_at;
ALTER TABLE pengajuan_surat DROP COLUMN dokumen_email_terkirim;
DROP TABLE IF EXISTS otp_codes;
ALTER TABLE users DROP COLUMN email_verified;
