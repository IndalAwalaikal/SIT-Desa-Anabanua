import React from 'react';
import { getProfilDesa, getPerangkatDesaList } from '@/lib/services/desa.service';
import { ProfilClient } from './ProfilClient';

export const metadata = { title: 'Profil Desa Anabanua', description: 'Gambaran umum, visi, misi, dan pemerintahan Desa Anabanua, Kecamatan Barru, Kabupaten Barru.' };

export default async function ProfilPage() {
  const [profil, perangkat] = await Promise.all([getProfilDesa(), getPerangkatDesaList()]);
  return <ProfilClient profil={profil} perangkat={perangkat ?? []} />;
}
