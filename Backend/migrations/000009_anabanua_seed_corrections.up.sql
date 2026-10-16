-- Koreksi data seed yang sudah telanjur diterapkan pada database lama.
-- Migrasi 000001 tidak dijalankan ulang pada instalasi yang sudah ada.
UPDATE jenis_surat
SET deskripsi = REPLACE(deskripsi, 'Desa Borong', 'Desa Anabanua')
WHERE deskripsi LIKE '%Desa Borong%'
  AND kode IN ('SKD', 'SKU');
