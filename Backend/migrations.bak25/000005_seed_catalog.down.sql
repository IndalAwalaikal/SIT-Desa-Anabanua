-- reverse 000005: seeded galeri & UMKM (urutan dibalik karena FK)
DELETE FROM umkm       WHERE id IN ('umkm-001','umkm-002');
DELETE FROM galeri_item WHERE album_id = 'alb-001';
DELETE FROM galeri_album WHERE id = 'alb-001';
