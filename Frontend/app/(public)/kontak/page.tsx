import React from 'react';
import type { Metadata } from 'next';
import { getProfilDesa } from '@/lib/services/desa.service';
import { KontakClient } from './KontakClient';

export const metadata: Metadata = {
  title: 'Kontak & Lokasi Kantor Desa Borong',
  description:
    'Informasi kontak resmi Pemerintah Desa Borong, Kecamatan Herlang, Kabupaten Bulukumba. Alamat kantor, nomor telepon/WhatsApp, email, dan jam pelayanan publik.',
};

export default async function KontakPage() {
  const profil = await getProfilDesa().catch(() => null);
  return <KontakClient profil={profil} />;
}
