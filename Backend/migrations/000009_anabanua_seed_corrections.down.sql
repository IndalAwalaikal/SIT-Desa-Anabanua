-- Pulihkan teks sebelum koreksi bila migrasi ini di-rollback.
UPDATE jenis_surat
SET deskripsi = REPLACE(deskripsi, 'Desa Anabanua', 'Desa Borong')
WHERE deskripsi LIKE '%Desa Anabanua%'
  AND kode IN ('SKD', 'SKU');
