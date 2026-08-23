-- reverse 000002: remove dokumen_hasil column + seeded jenis surat
DELETE FROM jenis_surat WHERE kode IN ('SKD','SKU','SKTM','SPN');
ALTER TABLE pengajuan_surat DROP COLUMN dokumen_hasil;
