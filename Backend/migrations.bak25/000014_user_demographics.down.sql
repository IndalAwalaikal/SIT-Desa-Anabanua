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
