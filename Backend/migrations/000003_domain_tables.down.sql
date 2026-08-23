-- from 000019_statistik_tren_bulanan.down.sql
DROP TABLE IF EXISTS statistik_bulanan;

-- from 000017_fulltext_search.down.sql
ALTER TABLE berita DROP INDEX idx_berita_ft;
ALTER TABLE umkm DROP INDEX idx_umkm_ft;
ALTER TABLE pengaduan DROP INDEX idx_pengaduan_ft;

-- from 000016_notifications.down.sql
DROP TABLE IF EXISTS notifikasi;

-- from 000015_pajak.down.sql
-- reverse 000015: Transparansi Pajak Desa
DROP TABLE IF EXISTS audit_log_pajak;
DROP TABLE IF EXISTS transaksi_pajak;
DROP TABLE IF EXISTS setoran_pajak;
DROP TABLE IF EXISTS wajib_pajak;
DROP TABLE IF EXISTS master_jenis_pajak;

-- from 000014_user_demographics.down.sql
-- Reverse migration 000014
ALTER TABLE users DROP COLUMN dusun;
ALTER TABLE users DROP COLUMN rw;
ALTER TABLE users DROP COLUMN rt;
ALTER TABLE users DROP COLUMN pekerjaan;
ALTER TABLE users DROP COLUMN status_perkawinan;
ALTER TABLE users DROP COLUMN agama;
ALTER TABLE users DROP COLUMN jenis_kelamin;
ALTER TABLE users DROP COLUMN tanggal_lahir;
ALTER TABLE users DROP COLUMN tempat_lahir;
ALTER TABLE users DROP COLUMN no_kk;
