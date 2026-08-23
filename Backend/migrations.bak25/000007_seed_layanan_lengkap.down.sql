-- reverse 000007: hapus 8 jenis surat tambahan
DELETE FROM jenis_surat WHERE kode IN ('SPK','SPKK','SKL','SKM','SKBM','SKP','SKH','LAIN');
