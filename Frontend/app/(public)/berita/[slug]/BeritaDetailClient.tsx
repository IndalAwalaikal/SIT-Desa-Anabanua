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
import {
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  History,
  MessageSquare,
  Newspaper,
  Send,
  Tag,
  Trash2,
  User,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80';

/* ---------- Gambar aman: lazy load + fallback bila URL rusak ---------- */
function SafeImage({ src, alt, className, loading = 'lazy' }: { src: string; alt: string; className?: string; loading?: 'lazy' | 'eager' }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src || FALLBACK_IMAGE}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={(e) => {
        const el = e.currentTarget;
        if (el.src !== FALLBACK_IMAGE) el.src = FALLBACK_IMAGE;
      }}
      className={className}
    />
  );
}

/* ================================================================== */
/*  Parser markdown ringan: paragraf, heading, quote, list, gambar, hr  */
/* ================================================================== */

interface MdBlock {
  kind: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'quote' | 'ul' | 'ol' | 'hr' | 'img';
  text?: string;
  items?: string[];
  src?: string;
  alt?: string;
  /** Gambar "tengah artikel" (spreader) */
  central?: boolean;
  /** Baris pertama blok di sumber markdown — untuk menempatkan gambar tengah */
  startLine: number;
}

function tokenizeBlocks(content: string): MdBlock[] {
  const lines = content.split(/\r?\n/);
  const blocks: MdBlock[] = [];
  let paragraph: string[] = [];
  let paragraphStart = 0;
  let list: MdBlock | null = null;

  const flushParagraph = () => {
    const text = paragraph.join(' ').replace(/\s+/g, ' ').trim();
    if (text) blocks.push({ kind: 'p', text, startLine: paragraphStart });
    paragraph = [];
  };

  const flushList = () => {
    if (list && list.items && list.items.length > 0) blocks.push(list);
    list = null;
  };

  lines.forEach((raw, i) => {
    const line = raw.trim();

    if (!line) {
      flushParagraph();
      flushList();
      return;
    }

    // Heading 1–4
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({
        kind: `h${heading[1].length}` as MdBlock['kind'],
        text: heading[2],
        startLine: i,
      });
      return;
    }

    // Garis pemisah horizontal
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      flushParagraph();
      flushList();
      blocks.push({ kind: 'hr', startLine: i });
      return;
    }

    // Kutipan
    if (line.startsWith('> ')) {
      flushParagraph();
      flushList();
      blocks.push({ kind: 'quote', text: line.replace(/^>\s?/, ''), startLine: i });
      return;
    }

    // Gambar pada baris sendiri: ![deskripsi](url)
    const img = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (img) {
      flushParagraph();
      flushList();
      blocks.push({ kind: 'img', src: img[2], alt: img[1], startLine: i });
      return;
    }

    // Daftar (berurutan / tidak berurutan), dikelompokkan rapi
    const orderedItem = line.match(/^\d+[.)]\s+(.*)$/);
    const unorderedItem = line.match(/^[-*•]\s+(.*)$/);
    if (orderedItem || unorderedItem) {
      flushParagraph();
      const ordered = Boolean(orderedItem);
      if (!list || list.kind !== (ordered ? 'ol' : 'ul')) {
        flushList();
        list = { kind: ordered ? 'ol' : 'ul', items: [], startLine: i };
      }
      list.items!.push((orderedItem ? orderedItem[1] : unorderedItem![1]).trim());
      return;
    }

    // Paragraf biasa (akumulasi baris menjadi satu paragraf)
    flushList();
    if (paragraph.length === 0) paragraphStart = i;
    paragraph.push(line);
  });

  flushParagraph();
  flushList();
  return blocks;
}

/* ================================================================== */
/*  Render inline: **tebal**, *miring*, [tautan](url)                   */
/* ================================================================== */
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
        <em key={i} className="italic text-neutral-700 dark:text-neutral-200">
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
          className="font-semibold text-primary-600 underline decoration-primary-300 underline-offset-2 hover:text-primary-700 dark:text-primary-400 dark:decoration-primary-700"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
}

const NARASI_TEXT_CLASS =
  'text-[1.02rem] leading-[1.85] text-neutral-700 dark:text-neutral-300';

/* ================================================================== */
/*  Render satu blok markdown                                            */
/* ================================================================== */
function renderBlock(block: MdBlock, key: number): React.ReactNode {
  switch (block.kind) {
    case 'h1':
      return (
        <h1
          key={key}
          className="mt-8 mb-4 text-2xl font-extrabold text-neutral-900 dark:text-white sm:text-3xl"
        >
          {formatInlineText(block.text!)}
        </h1>
      );
    case 'h2':
      return (
        <h2
          key={key}
          className="mt-10 mb-4 text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white sm:text-2xl"
        >
          {formatInlineText(block.text!)}
        </h2>
      );
    case 'h3':
      return (
        <h3
          key={key}
          className="mt-8 mb-3 text-lg font-bold text-neutral-900 dark:text-white sm:text-xl"
        >
          {formatInlineText(block.text!)}
        </h3>
      );
    case 'h4':
      return (
        <h4 key={key} className="mt-6 mb-2 text-base font-bold text-neutral-900 dark:text-white">
          {formatInlineText(block.text!)}
        </h4>
      );
    case 'p':
      return (
        <p key={key} className={`mb-5 ${NARASI_TEXT_CLASS}`}>
          {formatInlineText(block.text!)}
        </p>
      );
    case 'quote':
      return (
        <blockquote
          key={key}
          className="my-6 rounded-r-xl border-l-4 border-primary-500 bg-primary-50/60 px-5 py-4 italic leading-relaxed text-neutral-700 dark:bg-primary-950/30 dark:text-neutral-200"
        >
          {formatInlineText(block.text!)}
        </blockquote>
      );
    case 'ul':
      return (
        <ul key={key} className="my-5 space-y-2.5">
          {block.items!.map((item, i) => (
            <li key={i} className={`flex items-start gap-2.5 ${NARASI_TEXT_CLASS}`}>
              <span
                aria-hidden="true"
                className="mt-[0.72em] h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500"
              />
              <span>{formatInlineText(item)}</span>
            </li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol
          key={key}
          className={`my-5 list-decimal space-y-2.5 pl-6 marker:text-primary-600 ${NARASI_TEXT_CLASS}`}
        >
          {block.items!.map((item, i) => (
            <li key={i}>{formatInlineText(item)}</li>
          ))}
        </ol>
      );
    case 'hr':
      return <hr key={key} className="my-10 border-neutral-200 dark:border-neutral-800" />;
    case 'img':
      return (
        <figure key={key} className={block.central ? 'my-10' : 'my-8'}>
          <div className="mx-auto w-fit max-w-full rounded-2xl bg-neutral-100 p-2 shadow-md ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800">
            <SafeImage
              src={block.src!}
              alt={block.alt || 'Gambar berita'}
              className={`h-auto w-auto max-w-full ${
                block.central ? 'max-h-[460px]' : 'max-h-[600px]'
              } rounded-xl object-contain`}
            />
          </div>
          {block.alt && (
            <figcaption className="mt-2.5 text-center text-xs italic text-neutral-400">
              {block.alt}
            </figcaption>
          )}
        </figure>
      );
    default:
      return null;
  }
}

function renderMarkdownContent(content: string, gambarTengah?: string) {
  if (!content) return null;

  const blocks = tokenizeBlocks(content);

  // Letakkan "gambar tengah" tepat setelah separuh artikel, di awal
  // paragraf/heading berikutnya — bukan di tengah-tengah kalimat.
  if (gambarTengah) {
    const midLine = Math.floor(content.split(/\r?\n/).length / 2);
    const contentKinds: MdBlock['kind'][] = ['p', 'quote', 'ul', 'ol', 'h1', 'h2', 'h3', 'h4'];
    let insertIdx = blocks.findIndex(
      (b) => b.startLine >= midLine && contentKinds.includes(b.kind),
    );
    if (insertIdx === -1) {
      insertIdx = Math.max(0, Math.ceil(blocks.length * 0.45));
    }
    blocks.splice(insertIdx, 0, {
      kind: 'img',
      src: gambarTengah,
      alt: 'Dokumentasi Desa Anabanua',
      central: true,
      startLine: midLine,
    });
  }

  return <div className="clear-both">{blocks.map((b, i) => renderBlock(b, i))}</div>;
}

/* Pemisah titik kecil di baris metadata artikel */
function Dot() {
  return <span aria-hidden="true" className="hidden h-1 w-1 rounded-full bg-neutral-300 sm:block dark:bg-neutral-700" />;
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
    <div className="bg-neutral-50 py-10 sm:py-14 dark:bg-neutral-950">
      <div className="container-desa max-w-6xl space-y-8">
        {/* ── Kembali ke daftar berita ── */}
        <Link
          href="/berita"
          className="inline-flex items-center gap-2 text-xs font-medium text-neutral-500 hover:text-primary-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t('BeritaDetail.backToNews')}
        </Link>

        <Breadcrumb
          items={[
            { label: t('BeritaDetail.breadcrumb'), href: '/berita' },
            { label: berita.judul },
          ]}
        />

        {/* ── Header artikel (kategori, judul, metadata) ── */}
        <header className="mx-auto max-w-3xl space-y-4 text-center">
          <Badge variant="primary" size="md">
            {berita.kategori.toUpperCase()}
          </Badge>
          <h1 className="text-2xl font-extrabold leading-tight text-neutral-900 sm:text-4xl dark:text-white">
            {berita.judul}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="flex items-center gap-1.5 font-semibold text-neutral-700 dark:text-neutral-300">
              <User className="h-4 w-4 text-primary-500" />
              {berita.penulis}
            </span>
            <Dot />
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary-500" />
              {formatTanggal(berita.tanggalTerbit, { withTime: true })}
            </span>
            <Dot />
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary-500" />
              {estimasiWaktuBaca(berita.konten)}
            </span>
            <Dot />
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-primary-500" />
              {berita.dibaca} {t('BeritaDetail.readCount')}
            </span>
          </div>
        </header>

        {/* ── Layout utama: artikel (kiri) + sidebar berita terbaru (kanan) ── */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          {/* Kolom artikel */}
          <article className="min-w-0">
            <Card className="shadow-[0_18px_50px_rgba(9,53,119,0.06)] dark:shadow-none">
              {/* Gambar sampul — menyatu dengan kartu narasi */}
              <div className="relative bg-neutral-100 dark:bg-neutral-800">
                <SafeImage
                  src={berita.gambarSampul}
                  alt={berita.judul}
                  loading="eager"
                  className="aspect-[16/8] w-full object-cover"
                />
              </div>

              <div className="p-6 sm:p-10 lg:p-12">
                {/* Ringkasan / lede */}
              {berita.ringkasan && (
                <p className="mb-8 border-l-4 border-primary-500 bg-primary-50/60 px-5 py-3.5 text-base font-medium italic leading-relaxed text-neutral-700 sm:text-lg dark:bg-primary-950/25 dark:text-neutral-200">
                  {berita.ringkasan}
                </p>
              )}

              {/* Narasi */}
              <div className="text-neutral-800 dark:text-neutral-200">
                {renderMarkdownContent(berita.konten, berita.gambarTengah)}
              </div>

              {/* Tags */}
              {berita.tags.length > 0 && (
                <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-6 dark:border-neutral-800">
                  <Tag className="mr-1 h-4 w-4 text-neutral-400" aria-hidden="true" />
                  {berita.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Bagikan */}
                <ShareButtons title={berita.judul} />
              </div>
            </Card>
          </article>

          {/* ── Sidebar: Berita Terbaru (desktop) ── */}
          <aside className="hidden lg:block lg:sticky lg:top-24">
            <Card className="p-5">
              <div className="mb-4 flex items-center gap-2 border-b border-neutral-100 pb-3 dark:border-neutral-800">
                <History className="h-4 w-4 text-primary-500" aria-hidden="true" />
                <h3 className="text-xs font-extrabold uppercase tracking-[0.15em] text-neutral-500 dark:text-neutral-400">
                  {t('BeritaDetail.latestTitle')}
                </h3>
              </div>

              <div className="space-y-4">
                {terbaru.map((item) => (
                  <Link
                    key={item.id}
                    href={`/berita/${item.slug}`}
                    className="group flex items-start gap-3"
                  >
                    <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
                      <SafeImage
                        src={item.gambarSampul}
                        alt={item.judul}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[10px] font-bold uppercase tracking-wide text-primary-600 dark:text-primary-400">
                        {item.kategori}
                      </span>
                      <h4 className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug text-neutral-900 transition-colors group-hover:text-primary-600 dark:text-white">
                        {item.judul}
                      </h4>
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-neutral-400">
                        <Calendar className="h-3 w-3" aria-hidden="true" />
                        {formatTanggal(item.tanggalTerbit)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              <Link
                href="/berita"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 transition-all hover:gap-2.5 dark:text-primary-400"
              >
                {t('BeritaDetail.backToNews')} →
              </Link>
            </Card>
          </aside>
        </div>

        {/* ── Berita Terbaru di bawah narasi (mobile/tablet) ── */}
        {terbaru.length > 0 && (
          <section className="lg:hidden" aria-label={t('BeritaDetail.latestTitle')}>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-neutral-900 dark:text-white">
              <History className="h-5 w-5 text-primary-500" aria-hidden="true" />
              {t('BeritaDetail.latestTitle')}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {terbaru.map((item) => (
                <Card key={item.id} hoverable className="group">
                  <Link href={`/berita/${item.slug}`} className="block">
                    <div className="relative aspect-[16/9] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                      <SafeImage
                        src={item.gambarSampul}
                        alt={item.judul}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-primary-600 dark:text-primary-400">
                        {item.kategori}
                      </span>
                      <h4 className="mt-1 line-clamp-2 text-sm font-bold text-neutral-900 transition-colors group-hover:text-primary-600 dark:text-white">
                        {item.judul}
                      </h4>
                      <p className="mt-1.5 text-[11px] text-neutral-400">
                        {formatTanggal(item.tanggalTerbit)}
                      </p>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ── Komentar ── */}
        <section className="space-y-5 pt-2" aria-label="Komentar">
          <h3 className="flex items-center gap-2 text-xl font-extrabold text-neutral-900 dark:text-white">
            <MessageSquare className="h-5 w-5 text-primary-500" aria-hidden="true" />
            Komentar ({komentar.length})
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
                className="w-full rounded-xl border border-neutral-200 bg-white p-3 text-sm text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
              />
              <div className="flex justify-end">
                <Button type="submit" variant="primary" size="md" isLoading={submitting}>
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Kirim Komentar
                </Button>
              </div>
            </form>
          ) : (
            <p className="rounded-xl bg-neutral-100 px-4 py-3 text-xs text-neutral-500 dark:bg-neutral-900">
              <Link
                href="/login"
                className="font-bold text-primary-600 hover:underline dark:text-primary-400"
              >
                Masuk
              </Link>{' '}
              untuk ikut berkomentar.
            </p>
          )}

          <div className="space-y-3">
            {komentar.length === 0 ? (
              <p className="text-xs text-neutral-400">
                Belum ada komentar. Jadilah yang pertama berkomentar.
              </p>
            ) : (
              komentar.map((k) => (
                <div
                  key={k.id}
                  className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                    {(k.nama || 'W').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-neutral-900 dark:text-white">
                        {k.nama}
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        {formatTanggal(k.createdAt, { withTime: true })}
                      </span>
                      {(isAdmin || k.userId === user?.id) && (
                        <button
                          onClick={() => void handleDeleteKomentar(k.id)}
                          className="ml-auto text-rose-500 transition-colors hover:text-rose-700"
                          title="Hapus komentar"
                          aria-label="Hapus komentar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <p className="mt-1 break-words text-sm text-neutral-700 dark:text-neutral-300">
                      {k.konten}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── Berita Terkait ── */}
        {terkait.length > 0 && (
          <section className="space-y-6 pt-2" aria-label={t('BeritaDetail.relatedTitle')}>
            <h3 className="flex items-center gap-2 text-xl font-extrabold text-neutral-900 dark:text-white">
              <Newspaper className="h-5 w-5 text-primary-500" aria-hidden="true" />
              {t('BeritaDetail.relatedTitle')}
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {terkait.map((item) => (
                <Card key={item.id} hoverable className="group">
                  <Link href={`/berita/${item.slug}`} className="block">
                    <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                      <SafeImage
                        src={item.gambarSampul}
                        alt={item.judul}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="space-y-2 p-5">
                      <span className="block text-[11px] font-bold uppercase text-primary-600 dark:text-primary-400">
                        {item.kategori}
                      </span>
                      <h4 className="line-clamp-2 text-sm font-extrabold leading-snug text-neutral-900 transition-colors group-hover:text-primary-600 dark:text-white">
                        {item.judul}
                      </h4>
                      <p className="flex items-center gap-1.5 text-xs text-neutral-400">
                        <Calendar className="h-3 w-3" aria-hidden="true" />
                        {formatTanggal(item.tanggalTerbit)}
                        <span aria-hidden="true">·</span>
                        <Eye className="h-3 w-3" aria-hidden="true" />
                        {item.dibaca} {t('BeritaDetail.readCount')}
                      </p>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};