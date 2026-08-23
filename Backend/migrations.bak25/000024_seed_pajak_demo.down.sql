-- Rollback seed data demo modul Pajak (hanya menghapus data dengan ID prefix seed)
DELETE FROM audit_log_pajak   WHERE id LIKE 'aud-%';
DELETE FROM transaksi_pajak    WHERE id LIKE 'trx-%';
DELETE FROM setoran_pajak      WHERE id LIKE 'stn-%';
DELETE FROM wajib_pajak          WHERE id LIKE 'wp-%';
