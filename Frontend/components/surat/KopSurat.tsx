'use client';

// Kop resmi surat dinas — Pemerintah Kabupaten Barru / Kecamatan Barru / Desa Anabanua.

type KopProps = {
  title?: string;
};

function LogoEmblem() {
  return (
    <div className="shrink-0 flex items-center justify-center pr-2 sm:pr-4">
      {/* eslint-disable-next-line @next/next/no-img-element -- logo untuk template cetak/PDF (next/image tidak cocok untuk print) */}
      <img
        src="/logo-barru.png"
        alt="Logo Kabupaten Barru"
        className="h-32 sm:h-40 w-auto object-contain"
      />
    </div>
  );
}

export default function KopSurat({ title }: KopProps) {
  return (
    <div className="kop-surat print-color font-serif">
      <div className="flex items-center justify-center gap-2 sm:gap-4 pb-1">
        <div className="w-32 shrink-0">
          <LogoEmblem />
        </div>
        <div className="flex-1 leading-snug text-center space-y-0.5">
          <p className="text-xs sm:text-sm font-bold tracking-widest uppercase text-neutral-950">
            PEMERINTAH KABUPATEN BARRU
          </p>
          <p className="text-sm sm:text-base font-extrabold tracking-wider uppercase text-neutral-950">
            KECAMATAN BARRU
          </p>
          <p className="text-base sm:text-2xl font-black tracking-wider uppercase text-neutral-950">
            PEMERINTAH DESA ANABANUA
          </p>
          <p className="text-[11px] sm:text-xs text-neutral-900 leading-tight">
            Alamat: Dusun Gellengnge, Jl. Poros Pekkae–Soppeng
          </p>
          <p className="text-[11px] sm:text-xs text-neutral-900 leading-tight">
            Kec. Barru, Kab. Barru, Kode Pos 90712
          </p>
          <p className="text-[10px] sm:text-[11px] text-neutral-800 font-sans italic">
            Email: desaanabanua.id@gmail.com | Website: https://desaanabanua.id
          </p>
          {title ? <p className="mt-1 text-xs sm:text-sm font-bold text-neutral-900 uppercase">{title}</p> : null}
        </div>
        <div className="w-20 shrink-0 hidden sm:block" />
      </div>

      {/* Garis Pembatas Ganda Khas Surat Dinas */}
      <div className="border-b-[3px] border-neutral-950 w-full mt-1" aria-hidden="true" />
      <div className="border-b border-neutral-950 mt-[2px] w-full" aria-hidden="true" />
    </div>
  );
}
