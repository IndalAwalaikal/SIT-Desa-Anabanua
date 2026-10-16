-- Indexes support deterministic page ordering and status filters for admin lists.
ALTER TABLE pengajuan_surat
  ADD KEY idx_ps_created_id (created_at, id),
  ADD KEY idx_ps_status_created_id (status, created_at, id),
  ADD KEY idx_ps_owner_created_id (pemohon_id, created_at, id),
  DROP KEY idx_ps_status,
  DROP KEY idx_ps_owner;

ALTER TABLE pengaduan
  ADD KEY idx_pengaduan_created_id (created_at, id),
  ADD KEY idx_pengaduan_status_created_id (status, created_at, id),
  DROP KEY idx_pengaduan_status;

ALTER TABLE users
  ADD KEY idx_users_created_id (created_at, id);
