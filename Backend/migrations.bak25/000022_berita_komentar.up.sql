-- Gambar opsional yang tampil di tengah artikel berita
ALTER TABLE berita ADD COLUMN gambar_tengah VARCHAR(500) NULL AFTER gambar_sampul;

-- Komentar berita (user bisa berkomentar pada setiap artikel)
CREATE TABLE IF NOT EXISTS berita_komentar (
  id CHAR(26) PRIMARY KEY,
  berita_id CHAR(26) NOT NULL,
  user_id CHAR(26) NULL,
  nama VARCHAR(150) NOT NULL DEFAULT 'Warga',
  konten VARCHAR(1000) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (berita_id) REFERENCES berita(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  KEY idx_berita_komentar(berita_id, created_at)
);