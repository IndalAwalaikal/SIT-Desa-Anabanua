-- 000005: seed galeri & UMKM
INSERT IGNORE INTO galeri_album (id,judul,deskripsi,tanggal,kategori,cover_foto) VALUES
('alb-001','Panen Kopi Bersama Petani Dusun Tondon','Suasana kegembiraan musim panen raya kopi arabika bersama kelompok tani.',
 '2026-06-15','pertanian','https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80');
INSERT IGNORE INTO galeri_item (id,album_id,url,caption,tanggal) VALUES
('alb-001f1','alb-001','https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1200&q=80','Buah Kopi Arabika Siap Petik','2026-06-15'),
('alb-001f2','alb-001','https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80','Proses Sortir dan Sangrai Kopi','2026-06-16');

INSERT IGNORE INTO umkm (id,slug,nama_usaha,pemilik,kategori,deskripsi,foto,kontak,alamat,produk_unggulan,jam_operasional) VALUES
('umkm-001','hasil-tani-borong','Hasil Tani Borong','Andi Rahman','Pertanian',
 'Produk pertanian pilihan warga Desa Borong yang dipanen dan diolah dengan perhatian pada kualitas.',
 JSON_ARRAY('https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80'),'0812-4567-8901',
 'Desa Borong, Kecamatan Herlang, Kabupaten Bulukumba',
 JSON_ARRAY('Beras Lokal','Sayuran Segar','Olahan Hasil Tani'),'08.00 - 18.00 WITA'),
('umkm-002','dapur-rasa-borong','Dapur Rasa Borong','Hj. Fatmawati','Kuliner & Resto',
 'Kuliner rumahan khas Sulawesi Selatan dengan menu harian yang segar dan ramah untuk keluarga.',
 JSON_ARRAY('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80'),'0813-7788-9900',
 'Jl. Poros Borong No. 15, Desa Borong',
 JSON_ARRAY('Ikan Bakar','Nasi Kuning','Kue Tradisional'),'10.00 - 21.00 WITA');
