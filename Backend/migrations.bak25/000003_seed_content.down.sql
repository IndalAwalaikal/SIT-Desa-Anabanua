-- reverse 000003: seeded profil/perangkat/dusun/potensi/fasilitas
DELETE FROM fasilitas_desa WHERE id IN ('fas-01','fas-02','fas-03','fas-04','fas-05','fas-06');
DELETE FROM potensi_desa  WHERE id IN ('pot-001','pot-002','pot-003');
DELETE FROM dusun          WHERE id IN ('dsn-001','dsn-002','dsn-003','dsn-004');
DELETE FROM perangkat_desa WHERE id IN ('pd-001','pd-002','pd-003','pd-004','pd-005','pd-008');
DELETE FROM profil_desa    WHERE id = 1;
