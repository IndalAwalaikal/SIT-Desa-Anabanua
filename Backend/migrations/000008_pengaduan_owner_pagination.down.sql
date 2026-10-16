ALTER TABLE pengaduan
  DROP KEY idx_pengaduan_owner_created_id,
  ADD KEY pelapor_id (pelapor_id);
