import React from 'react';
import { getSembakoPeriods } from '@/lib/services/sembako.service';
import { SembakoClient } from './SembakoClient';

export const metadata = {
  title: 'Informasi Pembagian Sembako — Desa Anabanua',
  description:
    'Jadwal dan rincian pembagian sembako (bansos sembaka) untuk warga Desa Anabanua, Kecamatan Barru, Kabupaten Barru.',
};

export default async function SembakoPage() {
  const periods = await getSembakoPeriods();
  return <SembakoClient periods={periods ?? []} />;
}
