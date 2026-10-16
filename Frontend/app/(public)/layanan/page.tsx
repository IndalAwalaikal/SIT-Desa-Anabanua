import React from 'react';
import { getJenisSuratList } from '@/lib/services/persuratan.service';
import { getProfilDesa } from '@/lib/services/desa.service';
import { LayananClient } from './LayananClient';

export const metadata = {
  title: 'Layanan Persuratan Online Desa Anabanua',
  description: 'Daftar 50+ jenis surat keterangan & pengantar resmi desa yang dapat diajukan secara daring.',
};

export default async function LayananPage() {
  const [jenisSuratList, profil] = await Promise.all([
    getJenisSuratList(),
    getProfilDesa(),
  ]);
  return <LayananClient jenisSuratList={jenisSuratList} profil={profil} />;
}
