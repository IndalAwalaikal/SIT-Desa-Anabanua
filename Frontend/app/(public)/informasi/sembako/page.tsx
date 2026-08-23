import React from 'react';
import { getSembakoPeriods } from '@/lib/services/sembako.service';
import { SembakoClient } from './SembakoClient';

export const metadata = {
  title: 'Informasi Pembagian Sembako — Desa Borong',
  description:
    'Jadwal dan rincian pembagian sembako (bansos sembaka) untuk warga Desa Borong, Kecamatan Herlang, Kabupaten Bulukumba.',
};

export default async function SembakoPage() {
  const periods = await getSembakoPeriods();
  return <SembakoClient periods={periods ?? []} />;
}
