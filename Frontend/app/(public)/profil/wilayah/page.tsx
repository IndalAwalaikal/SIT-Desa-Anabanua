import React from 'react';
import { getDusunList } from '@/lib/services/desa.service';
import type { Dusun } from '@/types/desa';
import { WilayahClient } from './WilayahClient';

export const metadata = {
  title: 'Wilayah Administratif & Geografis Desa Borong',
};

export default async function WilayahPage() {
  const dusunList: Dusun[] = await getDusunList().catch(() => []);
  return <WilayahClient dusunList={dusunList} />;
}
