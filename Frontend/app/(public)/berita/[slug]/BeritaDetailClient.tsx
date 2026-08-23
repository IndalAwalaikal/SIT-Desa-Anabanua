'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Berita, BeritaKomentar } from '@/types/berita';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { ShareButtons } from '@/components/features/ShareButtons';
import {
  getBeritaKomentar,
  createBeritaKomentar,
  deleteBeritaKomentar,
} from '@/lib/services/berita.service';
import { useAuthStore } from '@/store/authStore';
import { formatTanggal, estimasiWaktuBaca } from '@/lib/utils/format';
import { Calendar, User, Eye, ArrowLeft, Tag, Clock, MessageSquare, Send, Trash2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

function formatInlineText(text: string): React.ReactNode {
  if (!text) return null;
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={i} className="font-extrabold text-neutral-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={i} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 dark:text-primary-400 font-semibold underline hover:text-primary-700"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
}

function renderMarkdownContent(content: string, gambarTengah?: string) {
  if (!content) return null;

  const lines = content.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let currentParagraphLines: string[] = [];
  let insertedTengah = false;
  const middleIdx = Math.floor(lines.length / 2);

  const flushParagraph = (key: string | number) => {
    if (currentParagraphLines.length > 0) {
      const text = currentParagraphLines.join(' ').trim();
      if (text) {
        elements.push(
          <p key={`p-${key}`} className="text-neutral-800 dark:text-neutral-200 leading-relaxed text-sm sm:text-base mb-4">
            {formatInlineText(text)}
          </p>
        );
      }
      currentParagraphLines = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Sisipkan gambar opsional di tengah artikel bila tersedia.
    if (gambarTengah && !insertedTengah && idx === middleIdx) {
      insertedTengah = true;
      elements.push(
        <figure key="gambar-tengah" className="my-8 rounded-2xl overflow-hidden shadow-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={gambarTengah} alt="Ilustrasi artikel" className="w-full h-auto object-contain" />
          <figcaption className="text-center text-xs text-neutral-500 py-2 italic bg-neutral-50 dark:bg-neutral-900">Gambar Artikel</figcaption>
        </figure>
      );
    }

    if (!trimmed) {
      flushParagraph(idx);
      return;
    }

    if (trimmed.startsWith('#### ')) {
      flushParagraph(idx);
      elements.push(
        <h4 key={`h4-${idx}`} className="text-base font-bold text-neutral-900 dark:text-white pt-3 pb-1 mt-4">
          {formatInlineText(trimmed.replace(/^####\s+/, ''))}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith('### ')) {
      flushParagraph(idx);
      elements.push(
        <h3 key={`h3-${idx}`} className="text-lg font-bold text-neutral-900 dark:text-white pt-4 pb-1 mt-4">
          {formatInlineText(trimmed.replace(/^###\s+/, ''))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith('## ')) {
      flushParagraph(idx);
      elements.push(
        <h2 key={`h2-${idx}`} className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white pt-6 pb-2 mt-6 border-b border-neutral-200 dark:border-neutral-800">
          {formatInlineText(trimmed.replace(/^##\s+/, ''))}
        </h2>
      );
      return;
    }

    if (trimmed.startsWith('# ')) {
      flushParagraph(idx);
      elements.push(
        <h1 key={`h1-${idx}`} className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white pt-6 pb-2 mt-6">
          {formatInlineText(trimmed.replace(/^#\s+/, ''))}
        </h1>
      );
      return;
    }

    if (trimmed.startsWith('> ')) {
      flushParagraph(idx);
      elements.push(
        <blockquote key={`bq-${idx}`} className="border-l-4 border-primary-500 pl-4 py-2 italic text-neutral-700 dark:text-neutral-300 bg-primary-50/40 dark:bg-primary-950/20 rounded-r-xl my-4 text-sm sm:text-base">
          {formatInlineText(trimmed.replace(/^>\s+/, ''))}
        </blockquote>
      );
      return;
    }

    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      flushParagraph(idx);
      const [, altText, imgUrl] = imgMatch;
      elements.push(
        <div key={`img-${idx}`} className="my-6 rounded-2xl overflow-hidden shadow-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgUrl} alt={altText || 'Gambar berita'} className="w-full h-auto object-contain" />
          {altText && <p className="text-center text-xs text-neutral-500 py-2 italic bg-neutral-50 dark:bg-neutral-900">{altText}</p>}
        </div>
      );
      return;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushParagraph(idx);
      elements.push(
        <div key={`li-${idx}`} className="flex items-start gap-2 ml-4 my-1 text-sm sm:text-base text-neutral-800 dark:text-neutral-200">
          <span className="text-primary-500 font-bold text-base leading-none mt-1">•</span>
          <span>{formatInlineText(trimmed.replace(/^[-*]\s+/, ''))}</span>
        </div>
      );
      return;
    }

    currentParagraphLines.push(trimmed);
  });

  flushParagraph('final');

  return <div className="space-y-2">{elements}</div>;
}

interface BeritaDetailClientProps {
  berita: Berita;
  terkait: Berita[];
  /** Berita terbaru (sudah di-filter dari artikel ini) untuk sidebar & section bawah. */
  terbaru: Berita[];
}

export const BeritaDetailClient: React.FC<BeritaDetailClientProps> = ({
  berita,
  terkait,
  terbaru,
}) => {
  const { t } = useTranslation();

  const { isAuthenticated, user } = useAuthStore();
  const [komentar, setKomentar] = useState<BeritaKomentar[]>([]);
  const [kontenKomentar, setKontenKomentar] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    getBeritaKomentar(berita.slug)
      .then(setKomentar)
      .catch(() => setKomentar([]));
  }, [berita.slug]);

  const handleSubmitKomentar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kontenKomentar.trim() || !isAuthenticated) return;
    setSubmitting(true);
    try {
      const created = await createBeritaKomentar(berita.slug, kontenKomentar);
      setKomentar((prev) => [...prev, created]);
      setKontenKomentar('');
    } catch {
      // abaikan — gagal kirim komentar
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteKomentar = async (id: string) => {
    try {
      await deleteBeritaKomentar(berita.slug, id);
      setKomentar((prev) => prev.filter((k) => k.id !== id));
    } catch {
      // abaikan
    }
  };

  return (
    <div className="py-12 bg-neutral-50 dark:bg-neutral-950">
      <div className="container-desa max-w-6xl space-y-8">
        {/* Back Link */}
        <Link
          href="/berita"
          className="inline-flex items-center gap-2 text-xs font-medium text-neutral-500 hover:text-primary-600"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('BeritaDetail.backToNews')}
        </Link>

        <Breadcrumb
          items={[
            { label: t('BeritaDetail.breadcrumb'), href: '/berita' },
            { label: berita.judul },
          ]}
        />

        {/* Article Header */}
        <div className="space-y-4">
          <Badge variant="primary" size="md">
            {berita.kategori.toUpperCase()}
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white leading-tight">
            {berita.judul}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 pb-6">
            <span className="flex items-center gap-1 font-semibold text-neutral-700 dark:text-neutral-300">
              <User className="w-4 h-4 text-primary-500" />
              {berita.penulis}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-primary-500" />
              {formatTanggal(berita.tanggalTerbit, { withTime: true })}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-primary-500" />
              {estimasiWaktuBaca(berita.konten)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4 text-primary-500" />
              {berita.dibaca} {t('BeritaDetail.readCount')}
            </span>
          </div>
        </div>

        {/* Cover Image — full, tanpa crop, tanpa blur */}
        <div className="w-full rounded-3xl overflow-hidden shadow-lg bg-neutral-100 dark:bg-neutral-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={berita.gambarSampul || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80'}
            alt={berita.judul}
            className="w-full h-auto max-h-[70vh] object-contain"
          />
        </div>

        {/* ── Layout utama: artikel (kiri) + sidebar berita terbaru (kanan) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
        {/* Main Content */}
        <Card className="p-8 sm:p-12 space-y-6 text-neutral-800 dark:text-neutral-200 leading-relaxed font-sans text-sm sm:text-base">
          {berita.ringkasan && (
            <p className="text-base sm:text-lg font-medium text-neutral-700 dark:text-neutral-300 border-l-4 border-primary-500 pl-4 py-2 italic bg-primary-50/50 dark:bg-primary-950/30 rounded-r-xl">
              {berita.ringkasan}
            </p>
          )}

          <div className="prose dark:prose-invert max-w-none">
            {renderMarkdownContent(berita.konten, berita.gambarTengah)}
          </div>

          {/* Tags */}
          <div className="pt-8 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center gap-2">
            <Tag className="w-4 h-4 text-neutral-400 mr-2" />
            {berita.tags.map((tag) => (
              <span
                key={tag}
                className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs px-3 py-1 rounded-full font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        </Card>

        {/* Share */}
        <ShareButtons title={berita.judul} />

        {/* ── Sidebar: Berita Terbaru (desktop) ── */}
        <aside className="hidden lg:block lg:sticky lg:top-24 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
            {t('BeritaDetail.latestTitle')}
          </h3>
          <div className="space-y-3">
            {terbaru.map((item) => (
              <Link
                key={item.id}
                href={`/berita/${item.slug}`}
                className="group block rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 hover:border-primary-500/40 hover:shadow-[0_14px_36px_-20px_rgba(11,93,187,0.35)] transition-all"
              >
                <span className="block text-[10px] font-bold text-primary-600 uppercase tracking-wide">
                  {item.kategori}
                </span>
                <h4 className="mt-1 font-bold text-sm leading-snug text-neutral-900 line-clamp-2 group-hover:text-primary-600 transition-colors dark:text-white">
                  {item.judul}
                </h4>
                <p className="mt-1.5 text-[11px] text-neutral-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatTanggal(item.tanggalTerbit)}
                </p>
              </Link>
            ))}
          </div>
          <Link
            href="/berita"
            className="inline-flex items-center gap-1.5 pt-1 text-xs font-bold text-primary-600 hover:gap-2.5 transition-all dark:text-primary-400"
          >
            {t('BeritaDetail.backToNews')} →
          </Link>
        </aside>
        </div>

        {/* ── Berita Terbaru di bawah narasi (mobile/tablet) ── */}
        {terbaru.length > 0 && (
          <div className="lg:hidden space-y-4 pt-2">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              {t('BeritaDetail.latestTitle')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {terbaru.map((item) => (
                <Link
                  key={item.id}
                  href={`/berita/${item.slug}`}
                  className="group block rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 hover:border-primary-500/40 transition-all"
                >
                  <span className="block text-[10px] font-bold text-primary-600 uppercase tracking-wide">
                    {item.kategori}
                  </span>
                  <h4 className="mt-1 font-bold text-sm leading-snug text-neutral-900 line-clamp-2 group-hover:text-primary-600 transition-colors dark:text-white">
                    {item.judul}
                  </h4>
                  <p className="mt-1.5 text-[11px] text-neutral-400">
                    {formatTanggal(item.tanggalTerbit)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Komentar */}
        <section className="space-y-5 pt-4" aria-label="Komentar">
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-500" /> Komentar ({komentar.length})
          </h3>

          {isAuthenticated ? (
            <form onSubmit={handleSubmitKomentar} className="space-y-3">
              <textarea
                value={kontenKomentar}
                onChange={(e) => setKontenKomentar(e.target.value)}
                rows={3}
                maxLength={1000}
                required
                placeholder="Tulis komentar Anda di sini..."
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-3 text-sm text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
              />
              <div className="flex justify-end">
                <Button type="submit" variant="primary" size="md" isLoading={submitting}>
                  <Send className="w-4 h-4" /> Kirim Komentar
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-900 rounded-xl px-4 py-3">
              <Link href="/login" className="text-primary-600 dark:text-primary-400 font-bold hover:underline">
                Masuk
              </Link>{' '}
              untuk ikut berkomentar.
            </p>
          )}

          <div className="space-y-3">
            {komentar.length === 0 ? (
              <p className="text-xs text-neutral-400">Belum ada komentar. Jadilah yang pertama berkomentar.</p>
            ) : (
              komentar.map((k) => (
                <div
                  key={k.id}
                  className="flex items-start gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900"
                >
                  <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 grid place-items-center font-bold text-xs shrink-0">
                    {(k.nama || 'W').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-neutral-900 dark:text-white">{k.nama}</span>
                      <span className="text-[11px] text-neutral-400">
                        {formatTanggal(k.createdAt, { withTime: true })}
                      </span>
                      {(isAdmin || k.userId === user?.id) && (
                        <button
                          onClick={() => void handleDeleteKomentar(k.id)}
                          className="ml-auto text-rose-500 hover:text-rose-700 transition-colors"
                          title="Hapus komentar"
                          aria-label="Hapus komentar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-1 break-words">{k.konten}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Related Articles */}
        {terkait.length > 0 && (
          <div className="space-y-6 pt-6">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
              {t('BeritaDetail.relatedTitle')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {terkait.map((item) => (
                <Card key={item.id} hoverable>
                  <div className="p-5 space-y-3">
                    <span className="block text-[11px] font-bold text-primary-600 uppercase">
                      {item.kategori}
                    </span>
                    <Link href={`/berita/${item.slug}`}>
                      <h4 className="font-bold text-sm text-neutral-900 dark:text-white hover:text-primary-600 transition-colors line-clamp-2">
                        {item.judul}
                      </h4>
                    </Link>
                    <p className="text-xs text-neutral-400">
                      {formatTanggal(item.tanggalTerbit)}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

