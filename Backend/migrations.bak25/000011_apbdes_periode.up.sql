-- 000011: APBDes periode (bulanan/triwulanan) selain tahunan.
-- Sebelumnya apbdes_item hanya punya `tahun`, padahal transparansi APBDes lazim
-- diinput setiap akhir bulan atau triwulan. Sekarang tiap baris boleh ditandai:
--   bulan   1-12  -> entri bulanan
--   triwulan 1-4  -> entri triwulanan
--   keduanya NULL  -> entri tahunan (lihat seed 000004)
ALTER TABLE apbdes_item
  ADD COLUMN bulan TINYINT UNSIGNED NULL AFTER tahun,
  ADD COLUMN triwulan TINYINT UNSIGNED NULL AFTER bulan;