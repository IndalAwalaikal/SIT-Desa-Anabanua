-- 000011 (down): hapus kolom periode bulanan/triwulanan
ALTER TABLE apbdes_item
  DROP COLUMN triwulan,
  DROP COLUMN bulan;