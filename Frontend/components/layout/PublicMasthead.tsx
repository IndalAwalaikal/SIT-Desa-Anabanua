import React from 'react';
import Image from 'next/image';
import { ArrowDownRight, MapPin } from 'lucide-react';

interface PublicMastheadProps {
  eyebrow: string;
  title: string;
  description: string;
  image?: string;
  meta?: string;
}

export function PublicMasthead({ eyebrow, title, description, image, meta = 'Desa Anabanua · Kecamatan Barru · Kabupaten Barru' }: PublicMastheadProps) {
  return (
    <section className="public-masthead relative overflow-hidden rounded-[2rem] border border-white/15 bg-[#174b17] text-white shadow-[0_24px_60px_rgba(36,61,33,0.20)]">
      {image && <Image src={image} alt="" fill sizes="100vw" priority className="object-cover opacity-35" />}
      <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(11,43,12,.96)_8%,rgba(36,118,35,.86)_57%,rgba(23,75,23,.38)_100%)]" />
      <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full border border-white/15" />
      <div className="absolute -right-8 -top-8 h-52 w-52 rounded-full border border-white/10" />
      <div className="relative grid min-h-[290px] items-end gap-8 p-8 sm:p-10 lg:grid-cols-[1fr_auto] lg:p-14">
        <div className="max-w-3xl animate-reveal">
          <p className="inline-flex items-center gap-2 border-l-2 border-amber-400 pl-3 text-[11px] font-bold uppercase tracking-[0.2em] text-primary-100">{eyebrow}</p>
          <h1 className="mt-5 font-serif text-4xl font-bold leading-[.98] tracking-tight sm:text-5xl lg:text-6xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-primary-100 sm:text-base">{description}</p>
        </div>
        <div className="hidden border-l border-white/20 pl-6 lg:block"><MapPin className="h-5 w-5 text-amber-300" /><p className="mt-3 text-xs font-semibold text-primary-100">{meta}</p><ArrowDownRight className="mt-6 h-5 w-5 text-white" /></div>
      </div>
    </section>
  );
}
