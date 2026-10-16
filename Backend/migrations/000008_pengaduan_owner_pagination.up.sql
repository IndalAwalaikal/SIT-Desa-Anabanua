ALTER TABLE pengaduan
  ADD KEY idx_pengaduan_owner_created_id (pelapor_id, created_at, id),
  DROP KEY pelapor_id;
