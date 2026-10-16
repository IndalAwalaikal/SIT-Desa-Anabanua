import React from 'react';
import { getAgendaKegiatan } from '@/lib/services/statistik.service';
import { AgendaClient } from './AgendaClient';

export const metadata = {
  title: 'Agenda & Kalender Kegiatan Desa Anabanua',
};

export default async function AgendaPage() {
  const agendaList = await getAgendaKegiatan();
  return <AgendaClient agendaList={agendaList} />;
}
