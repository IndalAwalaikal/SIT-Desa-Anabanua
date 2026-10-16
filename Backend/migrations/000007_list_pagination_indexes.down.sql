ALTER TABLE users DROP KEY idx_users_created_id;

ALTER TABLE pengaduan
  DROP KEY idx_pengaduan_created_id,
  DROP KEY idx_pengaduan_status_created_id,
  ADD KEY idx_pengaduan_status (status);

ALTER TABLE pengajuan_surat
  DROP KEY idx_ps_created_id,
  DROP KEY idx_ps_status_created_id,
  DROP KEY idx_ps_owner_created_id,
  ADD KEY idx_ps_status (status),
  ADD KEY idx_ps_owner (pemohon_id);
