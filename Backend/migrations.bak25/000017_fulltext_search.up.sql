-- FULLTEXT indexes on InnoDB teks/varchar kolom.
-- NB: kolom produk_unggulan pada umkm adalah tipe JSON, yang TIDAK didukung
-- oleh FULLTEXT index; ia otomatis dikelompokkan lewat generated column jika
-- dibutuhkan. hanya kolom text/varchar yang diindeks di sini agar berjalan
-- pada MySQL 8.4 (error 1072/3152 terjadi bila memaksa kolom nama/JSON).

ALTER TABLE berita ADD FULLTEXT INDEX idx_berita_ft(judul, ringkasan, konten);
ALTER TABLE umkm ADD FULLTEXT INDEX idx_umkm_ft(nama_usaha, deskripsi);
ALTER TABLE pengaduan ADD FULLTEXT INDEX idx_pengaduan_ft(judul, deskripsi);
