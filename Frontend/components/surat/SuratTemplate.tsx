'use client';

import React, { useEffect, useState } from 'react';
import KopSurat from './KopSurat';
import type { LampiranFile, PengajuanSurat } from '@/types/persuratan';
import { getLampiranBlob, isLampiranImage } from '@/lib/services/persuratan.service';

const BULAN_ROMAWI = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const BULAN_INDONESIA = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// Kode surat yang memuat pas foto (surat nikah/calon pengantin & sejenisnya).
const KODE_BERFOTO = new Set([
  'SPN', 'SP_NIKAH', 'SPK', 'SKBM', 'SK_BELUM_NIKAH', 'SK_JANDA_DUDA',
]);

// Mengenali file lampiran yang merupakan pas foto (bukan fotokopi dokumen).
function isPasFotoFile(lamp: LampiranFile): boolean {
  if (!isLampiranImage(lamp)) return false;
  const n = lamp.nama.toLowerCase();
  if (/fotokopi|kartu|kk\./i.test(n)) return false;
  return (
    /pas[\s_-]*foto/i.test(n) ||
    /pasfoto/i.test(n) ||
    /2\s?x\s?3/i.test(n) ||
    /3\s?x\s?4/i.test(n) ||
    /4\s?x\s?6/i.test(n) ||
    /foto[\s_-]*(pas|suami|istri|mempelai|calon)/i.test(n)
  );
}

// Ukuran fisik pas foto (standar Indonesia) sesuai keterangan pada nama file.
function pasFotoUkuran(nama: string): { w: string; h: string } {
  const n = nama.toLowerCase();
  if (/2\s?x\s?3/i.test(n)) return { w: '20mm', h: '30mm' };
  if (/4\s?x\s?6/i.test(n)) return { w: '40mm', h: '60mm' };
  return { w: '30mm', h: '40mm' }; // default 3 x 4
}

function fmtTanggal(val?: string | Date): string {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return `${d.getDate()} ${BULAN_INDONESIA[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtRupiah(val?: string | number): string {
  if (!val) return '-';
  const n = Number(String(val).replace(/\D/g, ''));
  if (isNaN(n)) return String(val);
  return 'Rp. ' + n.toLocaleString('id-ID');
}

function FieldRow({ label, value }: { label: string; value?: string | number }) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  return (
    <tr className="align-top leading-relaxed">
      <td className="w-32 sm:w-48 md:w-56 pr-2 py-1 text-neutral-900 font-medium text-xs sm:text-sm shrink-0">{label}</td>
      <td className="w-4 py-1 text-neutral-900 font-bold text-center text-xs sm:text-sm">:</td>
      <td className="py-1 text-neutral-950 font-semibold pl-1 text-xs sm:text-sm break-words">{String(value)}</td>
    </tr>
  );
}

export default function SuratTemplate({ surat }: { surat: PengajuanSurat }) {
  // Pas foto dimuat terpisah via endpoint ber-autentikasi (lampiran privat).
  const [fotoPas, setFotoPas] = useState<{ url: string; w: string; h: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    let aktif: { url: string }[] = [];

    const resetFoto = () => {
      setFotoPas((prev) => {
        prev.forEach((f) => URL.revokeObjectURL(f.url));
        return [];
      });
    };

    const kode = (surat?.jenisSuratKode || '').toUpperCase();
    if (!surat?.id || !KODE_BERFOTO.has(kode)) {
      resetFoto();
      return;
    }

    const lampiran = surat.lampiran || [];
    const calon = lampiran.filter(isPasFotoFile).slice(0, 2);
    // Jika tidak ada file yang jelas-jelas pas foto, gunakan gambar pertama
    // (non-fotokopi) agar surat tetap memuat foto pemohon/calon pengantin.
    const fallback =
      calon.length === 0
        ? lampiran
            .filter((l) => isLampiranImage(l) && !/fotokopi|scan/i.test(l.nama))
            .slice(0, 1)
        : [];

    (async () => {
      const hasil: { url: string; w: string; h: string }[] = [];
      for (const lamp of [...calon, ...fallback]) {
        try {
          const blob = await getLampiranBlob(surat.id!, lamp.id);
          hasil.push({ url: URL.createObjectURL(blob), ...pasFotoUkuran(lamp.nama) });
        } catch {
          // Foto lampiran privat tidak bisa dimuat tanpa autentikasi
          // (misalnya pada halaman publik) — dilewati secara aman.
        }
      }
      if (cancelled) {
        hasil.forEach((f) => URL.revokeObjectURL(f.url));
        return;
      }
      aktif = hasil;
      setFotoPas((prev) => {
        prev.forEach((f) => URL.revokeObjectURL(f.url));
        return hasil;
      });
    })();

    return () => {
      cancelled = true;
      aktif.forEach((f) => URL.revokeObjectURL(f.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- data surat diambil sekali; `surat?.id` sebagai kunci stabil
  }, [surat?.id]);

  if (!surat) return null;

  const kode = (surat.jenisSuratKode || '').toUpperCase();
  const d = surat.data || {};

  // Formasi Nomor Surat Resmi
  const now = new Date();
  const defaultNomor = `140 / ${kode || 'SURAT'} / DB / ${BULAN_ROMAWI[now.getMonth() + 1]} / ${now.getFullYear()}`;
  const nomorSurat = surat.dokumenHasil?.nomorSurat || defaultNomor;

  const rawTanggalTerbit = surat.dokumenHasil?.diterbitkanPada || surat.dibuatPada;
  const tanggalTerbit = fmtTanggal(rawTanggalTerbit) || fmtTanggal(new Date());

  const get = (k: string) => (d[k] && String(d[k]).trim() !== '' ? String(d[k]) : '');

  // Track rendered keys to dynamically capture remaining unrendered fields
  const renderedKeys = new Set<string>();
  const mark = (...keys: string[]) => keys.forEach((k) => { if (k) renderedKeys.add(k); });

  const namaLengkap = get('namaLengkap') || get('nama') || get('namaPemohon') || surat.pemohonNama || '..............................';
  mark('namaLengkap', 'nama', 'namaPemohon');

  const nik = get('nik') || get('nikPemohon'); mark('nik', 'nikPemohon');
  const tempatLahir = get('tempatLahir'); if (tempatLahir) mark('tempatLahir');
  const tanggalLahir = get('tanggalLahir'); if (tanggalLahir) mark('tanggalLahir');
  const jenisKelamin = get('jenisKelamin'); if (jenisKelamin) mark('jenisKelamin');
  const agama = get('agama'); if (agama) mark('agama');
  const pekerjaan = get('pekerjaan'); if (pekerjaan) mark('pekerjaan');
  const statusPerkawinan = get('statusPerkawinan'); if (statusPerkawinan) mark('statusPerkawinan');

  const alamat = get('alamatLengkap') || get('alamat') || get('alamatAsal') || get('alamatPemohon');
  mark('alamatLengkap', 'alamat', 'alamatAsal', 'alamatPemohon');

  const keperluan = get('keperluan') || get('tujuan');
  mark('keperluan', 'tujuan');
  mark('noKK', 'nomorKk', 'telepon', 'noHp');

  const ttl = [tempatLahir, tanggalLahir ? fmtTanggal(tanggalLahir) : ''].filter(Boolean).join(', ');

  return (
    <div className="w-full max-w-[210mm] mx-auto bg-white text-neutral-950 font-serif text-xs sm:text-sm leading-relaxed p-4 sm:p-8 md:p-[14mm] shadow-2xl rounded-sm print:p-0 print:shadow-none print:max-w-none">
      {/* Kop Surat Dinas */}
      <KopSurat />

      {/* Header Judul & Nomor Surat */}
      <div className="mt-6 text-center space-y-1">
        <h2 className="text-base sm:text-lg font-bold tracking-wider uppercase underline decoration-2 underline-offset-4 text-neutral-950">
          {surat.jenisSuratNama || 'SURAT KETERANGAN'}
        </h2>
        <p className="text-xs sm:text-sm font-semibold text-neutral-900 font-sans tracking-wide">
          Nomor : {nomorSurat}
        </p>
      </div>

      {/* Pembuka Formal */}
      <p className="mt-6 text-justify text-neutral-950 leading-relaxed font-serif">
        Yang bertanda tangan di bawah ini, Kepala Desa Anabanua, Kecamatan Barru, Kabupaten Barru, Provinsi Sulawesi Selatan, dengan ini menerangkan dengan sebenarnya bahwa:
      </p>

      {/* Seksi I: Identitas Pemohon */}
      <div className="mt-4 space-y-2">
        <p className="font-bold text-neutral-950 uppercase tracking-wide text-xs font-sans">
          I. IDENTITAS PEMOHON / YANG BERSANGKUTAN:
        </p>
        <div className="flex flex-wrap items-start gap-4">
          <div className="pl-2 sm:pl-6 overflow-x-auto flex-1 min-w-[260px]">
            <table className="w-full border-collapse text-xs sm:text-sm">
              <tbody>
                <FieldRow label="Nama Lengkap" value={namaLengkap} />
                {nik && <FieldRow label="NIK (No. Induk Kependudukan)" value={nik} />}
                {ttl && <FieldRow label="Tempat, Tanggal Lahir" value={ttl} />}
                {jenisKelamin && <FieldRow label="Jenis Kelamin" value={jenisKelamin} />}
                {agama && <FieldRow label="Agama" value={agama} />}
                {pekerjaan && <FieldRow label="Pekerjaan" value={pekerjaan} />}
                {statusPerkawinan && <FieldRow label="Status Perkawinan" value={statusPerkawinan} />}
                {alamat && <FieldRow label="Alamat / Tempat Tinggal" value={alamat} />}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Seksi II: Rincian Narasi & Keterangan Khusus */}
      <div className="mt-6 space-y-4 font-serif">
        <p className="font-bold text-neutral-950 uppercase tracking-wide text-xs font-sans">
          II. KETERANGAN &amp; RINCIAN DOKUMEN PERMOHONAN:
        </p>

        {kode === 'SKU' && (
          <div className="space-y-3">
            <p className="text-justify leading-relaxed">
              Berdasarkan hasil pemeriksaan data administrasi pertanahan/kewargaan serta verifikasi di lapangan oleh Pemerintah Desa Anabanua, bahwa nama yang bersangkutan tersebut di atas adalah benar-benar warga Desa Anabanua yang memiliki dan mengelola kegiatan usaha aktif sebagai berikut:
            </p>
            <div className="pl-2 sm:pl-6 overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border-collapse">
                <tbody>
                  {get('namaUsaha') && (mark('namaUsaha'), <FieldRow label="Nama Usaha" value={get('namaUsaha')} />)}
                  {get('jenisUsaha') && (mark('jenisUsaha'), <FieldRow label="Jenis / Bidang Usaha" value={get('jenisUsaha')} />)}
                  {get('alamatUsaha') && (mark('alamatUsaha'), <FieldRow label="Alamat Lokasi Usaha" value={get('alamatUsaha')} />)}
                </tbody>
              </table>
            </div>
            <p className="text-justify leading-relaxed">
              Usaha tersebut di atas saat ini aktif beroperasi di wilayah hukum Desa Anabanua, Kecamatan Barru, serta tidak sedang dalam sengketa dengan pihak manapun.
            </p>
          </div>
        )}

        {kode === 'SKTM' && (
          <div className="space-y-3">
            <p className="text-justify leading-relaxed">
              Berdasarkan hasil verifikasi lapangan dan pendataan kesejahteraan sosial oleh Pemerintah Desa Anabanua, bahwa yang bersangkutan adalah benar-benar warga masyarakat Desa Anabanua yang tergolong ke dalam <strong>Keluarga Kurang Mampu / Prasejahtera (Golongan Ekonomi Lemah)</strong>.
            </p>
            <div className="pl-2 sm:pl-6 overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border-collapse">
                <tbody>
                  {get('penghasilanPerBulan') && (mark('penghasilanPerBulan'), <FieldRow label="Penghasilan Rata-rata" value={fmtRupiah(get('penghasilanPerBulan'))} />)}
                  {get('namaAyah') && (mark('namaAyah'), <FieldRow label="Nama Ayah" value={get('namaAyah')} />)}
                  {get('namaIbu') && (mark('namaIbu'), <FieldRow label="Nama Ibu" value={get('namaIbu')} />)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {kode === 'SKH' && (
          <div className="space-y-3">
            <p className="text-justify leading-relaxed">
              Berdasarkan laporan dan keterangan lisan yang disampaikan oleh yang bersangkutan kepada Pemerintah Desa Anabanua, bahwa yang bersangkutan telah mengalami kehilangan barang/dokumen penting dengan rincian sebagai berikut:
            </p>
            <div className="pl-2 sm:pl-6 overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border-collapse">
                <tbody>
                  {(get('barangHilang') || get('barangDokumen')) && (mark('barangHilang', 'barangDokumen'), <FieldRow label="Barang / Dokumen Hilang" value={get('barangHilang') || get('barangDokumen')} />)}
                  {get('tempatKehilangan') && (mark('tempatKehilangan'), <FieldRow label="Tempat / Lokasi Kehilangan" value={get('tempatKehilangan')} />)}
                  {get('waktuKehilangan') && (mark('waktuKehilangan'), <FieldRow label="Waktu Kehilangan" value={fmtTanggal(get('waktuKehilangan')) || get('waktuKehilangan')} />)}
                  {get('kronologi') && (mark('kronologi'), <FieldRow label="Kronologi Kejadian" value={get('kronologi')} />)}
                </tbody>
              </table>
            </div>
            <p className="text-justify leading-relaxed">
              Surat keterangan ini diterbitkan sebagai pengantar resmi dari Pemerintah Desa Anabanua untuk melapor dan membuat Surat Tanda Penerimaan Laporan Kehilangan (STPLK) pada kepolisian setempat (Polsek Barru / Polres Barru).
            </p>
          </div>
        )}

        {kode === 'SKL' && (
          <div className="space-y-3">
            <p className="text-justify leading-relaxed">
              Berdasarkan Surat Keterangan Lahir dari Penolong Persalinan dan laporan resmi dari pihak keluarga, bahwa telah lahir seorang anak di wilayah Desa Anabanua dengan rincian data sebagai berikut:
            </p>
            <div className="pl-2 sm:pl-6 overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border-collapse">
                <tbody>
                  {get('namaAnak') && (mark('namaAnak'), <FieldRow label="Nama Anak" value={get('namaAnak')} />)}
                  {ttl && <FieldRow label="Tempat, Tanggal Lahir Anak" value={ttl} />}
                  {get('namaAyah') && (mark('namaAyah'), <FieldRow label="Nama Ayah Kandung" value={get('namaAyah')} />)}
                  {get('namaIbu') && (mark('namaIbu'), <FieldRow label="Nama Ibu Kandung" value={get('namaIbu')} />)}
                </tbody>
              </table>
            </div>
            <p className="text-justify leading-relaxed">
              Surat keterangan ini dibuat sebagai bukti pelaporan kelahiran warga desa dan sebagai pengantar pengurusan Akta Kelahiran pada Dinas Kependudukan dan Pencatatan Sipil (Disdukcapil) Kabupaten Barru.
            </p>
          </div>
        )}

        {kode === 'SKM' && (
          <div className="space-y-3">
            <p className="text-justify leading-relaxed">
              Berdasarkan laporan dari pihak keluarga dan keterangan pemerintah setempat (RT/RW), bahwa telah meninggal dunia seorang warga masyarakat Desa Anabanua dengan rincian sebagai berikut:
            </p>
            <div className="pl-2 sm:pl-6 overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border-collapse">
                <tbody>
                  {get('namaAlmarhum') && (mark('namaAlmarhum'), <FieldRow label="Nama Almarhum/ah" value={get('namaAlmarhum')} />)}
                  {get('tanggalMeninggal') && (mark('tanggalMeninggal'), <FieldRow label="Tanggal Meninggal" value={fmtTanggal(get('tanggalMeninggal')) || get('tanggalMeninggal')} />)}
                  {get('tempatMeninggal') && (mark('tempatMeninggal'), <FieldRow label="Tempat Meninggal" value={get('tempatMeninggal')} />)}
                  {get('sebabKematian') && (mark('sebabKematian'), <FieldRow label="Sebab Kematian" value={get('sebabKematian')} />)}
                  {get('namaPelapor') && (mark('namaPelapor'), <FieldRow label="Nama Pelapor" value={get('namaPelapor')} />)}
                </tbody>
              </table>
            </div>
            <p className="text-justify leading-relaxed">
              Surat keterangan ini diterbitkan sebagai bukti sah pelaporan kematian untuk pengurusan Akta Kematian serta administrasi kependudukan keluarga yang bersangkutan.
            </p>
          </div>
        )}

        {kode === 'SKP' && (
          <div className="space-y-3">
            <p className="text-justify leading-relaxed">
              Bahwa yang bersangkutan bermaksud mengajukan Permohonan Pindah Domisili Kependudukan dari Desa Anabanua dengan data rencana kepindahan sebagai berikut:
            </p>
            <div className="pl-2 sm:pl-6 overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border-collapse">
                <tbody>
                  {get('alamatTujuan') && (mark('alamatTujuan'), <FieldRow label="Alamat Tujuan Pindah" value={get('alamatTujuan')} />)}
                  {get('alasanPindah') && (mark('alasanPindah'), <FieldRow label="Alasan Kepindahan" value={get('alasanPindah')} />)}
                  {get('jumlahPengikut') && (mark('jumlahPengikut'), <FieldRow label="Jumlah Pengikut Pindah" value={`${get('jumlahPengikut')} Orang`} />)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(kode === 'SPK' || kode === 'SPKTP') && (
          <div className="space-y-3">
            <p className="text-justify leading-relaxed">
              Surat pengantar ini diterbitkan oleh Pemerintah Desa Anabanua untuk keperluan pengurusan Kartu Tanda Penduduk Elektronik (KTP-el) pada Dinas Kependudukan dan Pencatatan Sipil Kabupaten Barru dengan rincian:
            </p>
            <div className="pl-2 sm:pl-6 overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border-collapse">
                <tbody>
                  {get('noKK') && (mark('noKK'), <FieldRow label="Nomor Kartu Keluarga (KK)" value={get('noKK')} />)}
                  {get('jenisPermohonan') && (mark('jenisPermohonan'), <FieldRow label="Jenis Permohonan KTP" value={get('jenisPermohonan')} />)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {kode === 'SPKK' && (
          <div className="space-y-3">
            <p className="text-justify leading-relaxed">
              Surat pengantar ini diterbitkan untuk pengurusan penerbitan / perbaikan Kartu Keluarga (KK) pada Kantor Disdukcapil Kabupaten Barru dengan rincian:
            </p>
            <div className="pl-2 sm:pl-6 overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border-collapse">
                <tbody>
                  {get('namaKepalaKeluarga') && (mark('namaKepalaKeluarga'), <FieldRow label="Nama Kepala Keluarga" value={get('namaKepalaKeluarga')} />)}
                  {get('jenisPermohonan') && (mark('jenisPermohonan'), <FieldRow label="Jenis Permohonan KK" value={get('jenisPermohonan')} />)}
                  {get('alasanPerubahan') && (mark('alasanPerubahan'), <FieldRow label="Alasan / Keterangan" value={get('alasanPerubahan')} />)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {kode === 'SPN' && (
          <div className="space-y-3">
            <p className="text-justify leading-relaxed">
              Berdasarkan pendaftaran kehendak nikah, Pemerintah Desa Anabanua memberikan pengantar untuk melangsungkan pernikahan di Kantor Urusan Agama (KUA) / Disdukcapil bagi calon pengantin:
            </p>
            <div className="pl-2 sm:pl-6 overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border-collapse">
                <tbody>
                  {get('namaCalonSuami') && (mark('namaCalonSuami'), <FieldRow label="Nama Calon Suami" value={get('namaCalonSuami')} />)}
                  {get('namaCalonIstri') && (mark('namaCalonIstri'), <FieldRow label="Nama Calon Istri" value={get('namaCalonIstri')} />)}
                  {get('tanggalRencanaNikah') && (mark('tanggalRencanaNikah'), <FieldRow label="Rencana Tanggal Pelaksanaan" value={fmtTanggal(get('tanggalRencanaNikah')) || get('tanggalRencanaNikah')} />)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {kode === 'SKBM' && (
          <div className="space-y-3">
            <p className="text-justify leading-relaxed">
              Berdasarkan catatan register kependudukan Desa Anabanua dan surat pernyataan yang bersangkutan, bahwa sampai dengan tanggal diterbitkannya surat keterangan ini, yang bersangkutan adalah benar-benar <strong>Belum Pernah Menikah / Berkeluarga (Jejaka / Perawan)</strong>.
            </p>
          </div>
        )}

        {kode === 'SKD' && (
          <div className="space-y-3">
            <p className="text-justify leading-relaxed">
              Berdasarkan data register kependudukan Desa Anabanua, bahwa yang bersangkutan tersebut di atas adalah benar-benar berdomisili dan bertempat tinggal di wilayah Desa Anabanua, Kecamatan Barru, Kabupaten Barru. Yang bersangkutan terdaftar aktif dalam administrasi kependudukan desa.
            </p>
          </div>
        )}

        {/* Tabel Pemetaan Tambahan untuk Semua Field Input User yang Belum Ter-render */}
        {Object.entries(d).some(([k, v]) => v && String(v).trim() !== '' && !renderedKeys.has(k)) && (
          <div className="pt-2">
            <p className="font-semibold text-neutral-950 mb-1 font-sans text-xs">RINCIAN DATA KETERANGAN TAMBAHAN:</p>
            <div className="pl-2 sm:pl-6 overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border-collapse">
                <tbody>
                  {Object.entries(d)
                    .filter(([k, v]) => v && String(v).trim() !== '' && !renderedKeys.has(k))
                    .map(([k, v]) => (
                      <FieldRow
                        key={k}
                        label={k.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                        value={['penghasilan', 'biaya', 'uang'].some(item => k.toLowerCase().includes(item)) && !isNaN(Number(v)) ? 'Rp. ' + String(v) : String(v)}
                      />
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {keperluan && (
          <p className="text-justify leading-relaxed mt-2">
            Surat Keterangan ini dibuat dan diberikan kepada yang bersangkutan khusus untuk keperluan: <strong>{keperluan}</strong>.
          </p>
        )}
      </div>

      {/* Penutup Formal */}
      <p className="mt-6 sm:mt-8 text-justify text-neutral-950 leading-relaxed font-serif">
        Demikian Surat Keterangan ini dibuat dengan sebenarnya dan diberikan kepada yang bersangkutan untuk dapat dipergunakan sebagaimana mestinya dan/atau sebagai kelengkapan berkas administrasi.
      </p>

      {/* Blok Penandatangan Resmi & Pas Foto */}
      <div className={`mt-8 sm:mt-12 flex items-start ${fotoPas.length > 0 ? 'justify-between' : 'justify-end'} gap-6 font-serif`}>
        {/* Pas Foto di sebelah kiri untuk surat nikah & sejenisnya */}
        {fotoPas.length > 0 && (
          <div className="flex gap-3 ml-8">
            {fotoPas.map((foto, i) => (
              <figure key={i} className="text-center space-y-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element -- pas foto untuk template cetak/PDF */}
                <img
                  src={foto.url}
                  alt={`Pas Foto ${i + 1}`}
                  className="object-cover border border-neutral-500 rounded-[2px] bg-white"
                  style={{ width: foto.w, height: foto.h }}
                />
                <figcaption className="text-[9px] text-neutral-700">
                  Pas Foto {i + 1}
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        <div className={`text-center w-56 sm:w-72 md:w-80 ${fotoPas.length === 0 ? 'ml-auto' : ''}`}>
          <p className="text-neutral-950 text-xs sm:text-sm">Diterbitkan di : Anabanua</p>
          <p className="text-neutral-950 text-xs sm:text-sm">Pada Tanggal &nbsp;: {tanggalTerbit}</p>
          <div className="border-b border-neutral-950 my-1 w-full" aria-hidden="true" />
          <p className="font-bold uppercase text-neutral-950 tracking-wider text-xs sm:text-sm">KEPALA DESA ANABANUA</p>
          <div className="h-20 sm:h-24 flex items-end justify-center">
            {/* Ruang Stempel Basah & Tanda Tangan */}
          </div>
          <p className="font-bold underline text-xs sm:text-base uppercase text-neutral-950 tracking-wide">
            {surat.penandatangan?.nama || 'Kepala Desa Anabanua'}
          </p>
          <p className="text-[10px] sm:text-xs font-mono text-neutral-800 mt-0.5">
            NIP. {surat.penandatangan?.nip || '........................................'}
          </p>
        </div>
      </div>
    </div>
  );
}