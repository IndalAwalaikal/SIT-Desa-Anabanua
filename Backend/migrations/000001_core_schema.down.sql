-- from 000005_seed_catalog.down.sql
-- reverse 000005: seeded galeri & UMKM (urutan dibalik karena FK)
DELETE FROM umkm       WHERE id IN ('umkm-001','umkm-002');
DELETE FROM galeri_item WHERE album_id = 'alb-001';
DELETE FROM galeri_album WHERE id = 'alb-001';

-- from 000004_seed_finance.down.sql
-- reverse 000004: seeded statistik / APBDes / agenda
DELETE FROM agenda_kegiatan WHERE id IN ('agd-001','agd-002');
DELETE FROM apbdes_item    WHERE tahun = 2026;
DELETE FROM statistik_penduduk WHERE tahun = 2026;

-- from 000003_seed_content.down.sql
-- reverse 000003: seeded profil/perangkat/dusun/potensi/fasilitas
DELETE FROM fasilitas_desa WHERE id IN ('fas-01','fas-02','fas-03','fas-04','fas-05','fas-06');
DELETE FROM potensi_desa  WHERE id IN ('pot-001','pot-002','pot-003');
DELETE FROM dusun          WHERE id IN ('dsn-001','dsn-002','dsn-003','dsn-004');
DELETE FROM perangkat_desa WHERE id IN ('pd-001','pd-002','pd-003','pd-004','pd-005','pd-008');
DELETE FROM profil_desa    WHERE id = 1;

-- from 000002_seed_core.down.sql
-- reverse 000002: remove dokumen_hasil column + seeded jenis surat
DELETE FROM jenis_surat WHERE kode IN ('SKD','SKU','SKTM','SPN');
ALTER TABLE pengajuan_surat DROP COLUMN dokumen_hasil;

-- from 000001_initial.down.sql
DROP TABLE IF EXISTS fasilitas_desa,potensi_desa,dusun,perangkat_desa,umkm,galeri_item,galeri_album,agenda_kegiatan,apbdes_item,statistik_penduduk,profil_desa,berita,pengaduan,pengajuan_riwayat_status,pengajuan_lampiran,pengajuan_surat,jenis_surat,refresh_tokens,users;
