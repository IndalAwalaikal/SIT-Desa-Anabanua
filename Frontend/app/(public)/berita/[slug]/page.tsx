import React from 'react';
import { notFound } from 'next/navigation';
import { getBeritaBySlug, getBeritaTerkait, getBeritaTerbaru } from '@/lib/services/berita.service';
import { BeritaDetailClient } from './BeritaDetailClient';

interface BeritaDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BeritaDetailPageProps) {
  const { slug } = await params;
    const berita = await getBeritaBySlug(slug);
  if (!berita) return { title: 'Berita Tidak Ditemukan' };

  return {
    title: berita.judul,
    description: berita.ringkasan,
    openGraph: {
      title: berita.judul,
      description: berita.ringkasan,
      images: [{ url: berita.gambarSampul }],
    },
  };
}

export default async function BeritaDetailPage({ params }: BeritaDetailPageProps) {
    const { slug } = await params;
  const berita = await getBeritaBySlug(slug);

  if (!berita) {
    notFound();
  }

  const [terkait, terbaru] = await Promise.all([
    getBeritaTerkait(slug, 3),
    getBeritaTerbaru(5),
  ]);

  return (
    <BeritaDetailClient
      berita={berita}
      terkait={terkait}
      terbaru={terbaru.filter((b) => b.slug !== slug).slice(0, 4)}
    />
  );
}
