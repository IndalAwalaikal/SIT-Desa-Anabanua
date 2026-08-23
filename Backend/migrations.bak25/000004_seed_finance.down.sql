-- reverse 000004: seeded statistik / APBDes / agenda
DELETE FROM agenda_kegiatan WHERE id IN ('agd-001','agd-002');
DELETE FROM apbdes_item    WHERE tahun = 2026;
DELETE FROM statistik_penduduk WHERE tahun = 2026;
