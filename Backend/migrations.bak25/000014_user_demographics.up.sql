-- Migration 000014: Expand user profile with demographic fields for smart persuratan auto-fill.
ALTER TABLE users ADD COLUMN no_kk             VARCHAR(20)  NULL AFTER nik;
ALTER TABLE users ADD COLUMN tempat_lahir      VARCHAR(100) NULL AFTER no_kk;
ALTER TABLE users ADD COLUMN tanggal_lahir     DATE         NULL AFTER tempat_lahir;
ALTER TABLE users ADD COLUMN jenis_kelamin     ENUM('L','P') NULL AFTER tanggal_lahir;
ALTER TABLE users ADD COLUMN agama             VARCHAR(50)  NULL AFTER jenis_kelamin;
ALTER TABLE users ADD COLUMN status_perkawinan VARCHAR(50)  NULL AFTER agama;
ALTER TABLE users ADD COLUMN pekerjaan        VARCHAR(100) NULL AFTER status_perkawinan;
ALTER TABLE users ADD COLUMN rt                VARCHAR(5)   NULL AFTER pekerjaan;
ALTER TABLE users ADD COLUMN rw                VARCHAR(5)   NULL AFTER rt;
ALTER TABLE users ADD COLUMN dusun             VARCHAR(100) NULL AFTER rw;
