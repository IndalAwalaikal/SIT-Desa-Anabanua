-- from 000025_sembako.down.sql
DROP TABLE IF EXISTS sembako_item;
DROP TABLE IF EXISTS sembako_period;

-- from 000024_seed_pajak_demo.down.sql
-- Rollback seed data demo modul Pajak (hanya menghapus data dengan ID prefix seed)
DELETE FROM audit_log_pajak   WHERE id LIKE 'aud-%';
DELETE FROM transaksi_pajak    WHERE id LIKE 'trx-%';
DELETE FROM setoran_pajak      WHERE id LIKE 'stn-%';
DELETE FROM wajib_pajak          WHERE id LIKE 'wp-%';

-- from 000023_expand_galeri_columns.down.sql
ALTER TABLE `galeri_album` MODIFY `cover_foto` VARCHAR(255) NOT NULL;
ALTER TABLE `galeri_item` MODIFY `url` VARCHAR(255) NOT NULL;

-- from 000022_berita_komentar.down.sql
DROP TABLE IF EXISTS berita_komentar;
ALTER TABLE berita DROP COLUMN gambar_tengah;

-- from 000021_jobs.down.sql
DROP TABLE IF EXISTS jobs;
