'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getPengajuanByUser } from '@/lib/services/persuratan.service';
import { getPengaduanByUser } from '@/lib/services/pengaduan.service';
import type { PengajuanSurat } from '@/types/persuratan';
import type { Pengaduan } from '@/types/pengaduan';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { updateProfileService } from '@/lib/services/auth.service';
import { formatTanggal } from '@/lib/utils/format';
import { FileText, MessageSquare, Clock, LogOut, Download, Pencil, XCircle, UserCheck, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function AkunPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated, setHasHydrated, logout, setUser } = useAuthStore();

  const [pengajuanList, setPengajuanList] = useState<PengajuanSurat[]>([]);
  const [pengaduanList, setPengaduanList] = useState<Pengaduan[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    nama: '',
    email: '',
    nik: '',
    noKk: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: '',
    agama: '',
    statusPerkawinan: '',
    pekerjaan: '',
    rt: '',
    rw: '',
    dusun: '',
    telepon: '',
    alamat: '',
    passwordBaru: '',
  });

  // Tunggu sampai Zustand persist selesai hydrate dari localStorage
  // sebelum mengecek status autentikasi, agar tidak terjadi race condition.
  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHasHydrated(true);
    }
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });
    return () => unsubscribe();
  }, [setHasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
    if (user.role === 'admin' || user.role === 'super_admin') {
      router.replace('/dashboard');
      return;
    }
    getPengajuanByUser(user.id).then(setPengajuanList);
    getPengaduanByUser(user.id).then(setPengaduanList);
  }, [hasHydrated, isAuthenticated, user, router]);

    if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <div className="container-desa py-10 space-y-6">
          <Skeleton variant="rectangular" className="h-8 w-48 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton variant="rectangular" className="h-10 w-full rounded-xl" />
              <Skeleton variant="rectangular" className="h-10 w-full rounded-xl" />
              <Skeleton variant="rectangular" className="h-10 w-full rounded-xl" />
            </div>
            <Skeleton variant="rectangular" className="h-48 w-full rounded-2xl" />
          </div>
          <Skeleton variant="rectangular" className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!user) return null;


  const openProfile = () => {
    const rawStatus = (user.statusPerkawinan || '').toUpperCase().replace(/_/g, ' ');
    const validStatus = ['BELUM KAWIN', 'KAWIN', 'CERAI HIDUP', 'CERAI MATI'].includes(rawStatus)
      ? rawStatus
      : 'BELUM KAWIN';

    setProfileForm({
      nama: user.nama || '',
      email: user.email || '',
      nik: user.nik || '',
      noKk: user.noKk || '',
      tempatLahir: user.tempatLahir || '',
      tanggalLahir: user.tanggalLahir || '',
      jenisKelamin: user.jenisKelamin || 'L',
      agama: user.agama || 'ISLAM',
      statusPerkawinan: validStatus,
      pekerjaan: user.pekerjaan || '',
      rt: user.rt || '',
      rw: user.rw || '',
      dusun: user.dusun || '',
      telepon: user.telepon || '',
      alamat: user.alamat || '',
      passwordBaru: '',
    });
    setProfileOpen(true);
  };

  const saveProfile = async () => {
    setProfileSaving(true);
    try {
      const normalizedForm = {
        ...profileForm,
        nama: profileForm.nama.toUpperCase().trim(),
        email: profileForm.email.toLowerCase().trim(),
        nik: profileForm.nik.toUpperCase().trim(),
        noKk: profileForm.noKk.toUpperCase().trim(),
        tempatLahir: profileForm.tempatLahir.toUpperCase().trim(),
        tanggalLahir: profileForm.tanggalLahir.trim(),
        jenisKelamin: profileForm.jenisKelamin.toUpperCase().trim(),
        agama: profileForm.agama.toUpperCase().trim(),
        statusPerkawinan: profileForm.statusPerkawinan.toUpperCase().trim(),
        pekerjaan: profileForm.pekerjaan.toUpperCase().trim(),
        rt: profileForm.rt.toUpperCase().trim(),
        rw: profileForm.rw.toUpperCase().trim(),
        dusun: profileForm.dusun.toUpperCase().trim(),
        telepon: profileForm.telepon.toUpperCase().trim(),
        alamat: profileForm.alamat.toUpperCase().trim(),
        passwordBaru: profileForm.passwordBaru,
      };
      const updated = await updateProfileService(user.id, normalizedForm);
      setUser(updated);
      setProfileOpen(false);
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="py-12 bg-neutral-50 dark:bg-neutral-950">
      <div className="container-desa max-w-4xl space-y-8">
        {/* User Card */}
        <Card className="p-6 sm:p-8 bg-gradient-to-r from-primary-900 via-primary-800 to-secondary-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-16 h-16 rounded-full bg-white/20 text-white flex items-center justify-center font-black text-2xl border-2 border-white/40">
              {user.nama.charAt(0)}
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl font-bold">{user.nama}</h1>
                <span className="bg-accent-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full capitalize">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-primary-200 mt-1">{user.email} • NIK: {user.nik || '-'}</p>
              <p className="text-xs text-primary-300">{user.alamat || 'Desa Borong'}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/20 text-xs" onClick={openProfile}>
              <Pencil className="w-4 h-4" /> Ubah Profil
            </Button>
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/20 text-xs" onClick={logout}>
              <LogOut className="w-4 h-4" /> Keluar
            </Button>
          </div>
        </Card>

        {/* Ringkasan Data Kependudukan */}
        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary-600" />
              Data Profil Kependudukan Warga
            </h2>
            <Button variant="ghost" size="sm" onClick={openProfile} className="text-xs text-primary-600 hover:text-primary-700">
              <Pencil className="w-3.5 h-3.5" /> Ubah Data
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
              <p className="text-[10px] font-bold uppercase text-neutral-400">NIK (Nomor Induk Kependudukan)</p>
              <p className="font-mono font-bold text-neutral-900 dark:text-white mt-0.5">{user.nik || '-'}</p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
              <p className="text-[10px] font-bold uppercase text-neutral-400">No. Kartu Keluarga (KK)</p>
              <p className="font-mono font-bold text-neutral-900 dark:text-white mt-0.5">{user.noKk || '-'}</p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
              <p className="text-[10px] font-bold uppercase text-neutral-400">Tempat, Tanggal Lahir</p>
              <p className="font-bold text-neutral-900 dark:text-white mt-0.5 truncate">
                {user.tempatLahir ? `${user.tempatLahir}, ${user.tanggalLahir || ''}` : '-'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
              <p className="text-[10px] font-bold uppercase text-neutral-400">Jenis Kelamin / Agama</p>
              <p className="font-bold text-neutral-900 dark:text-white mt-0.5">
                {user.jenisKelamin === 'L' ? 'LAKI-LAKI' : user.jenisKelamin === 'P' ? 'PEREMPUAN' : '-'} • {user.agama || '-'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
              <p className="text-[10px] font-bold uppercase text-neutral-400">Status Perkawinan / Pekerjaan</p>
              <p className="font-bold text-neutral-900 dark:text-white mt-0.5 truncate">
                {user.statusPerkawinan || '-'} • {user.pekerjaan || '-'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
              <p className="text-[10px] font-bold uppercase text-neutral-400">Wilayah / Dusun / RT-RW</p>
              <p className="font-bold text-neutral-900 dark:text-white mt-0.5 truncate">
                DUSUN {user.dusun || '-'} • RT {user.rt || '-'}/RW {user.rw || '-'}
              </p>
            </div>
          </div>
        </Card>

        {/* Ringkasan Aktivitas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-black text-neutral-900 dark:text-white">{pengajuanList.length}</p>
              <p className="text-[11px] font-bold text-neutral-500 uppercase">Permohonan Surat</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Clock className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-black text-neutral-900 dark:text-white">
                {pengajuanList.filter((x) => x.status === 'selesai').length}
              </p>
              <p className="text-[11px] font-bold text-neutral-500 uppercase">Surat Selesai</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary-100 text-secondary-700 dark:bg-secondary-950 dark:text-secondary-300">
              <MessageSquare className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-black text-neutral-900 dark:text-white">{pengaduanList.length}</p>
              <p className="text-[11px] font-bold text-neutral-500 uppercase">Pengaduan</p>
            </div>
          </Card>
        </div>

        {/* Riwayat Pengajuan Surat */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-neutral-900 dark:text-white flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-primary-600" />
              {t('Akun.title', 'Dashboard Warga')}
            </h1>
            <Link href="/layanan">
              <Button variant="primary" size="sm">
                Ajukan Surat Baru
              </Button>
            </Link>
          </div>

          {pengajuanList.length > 0 ? (
            <div className="space-y-4">
              {pengajuanList.map((item) => (
                <Card key={item.id} className={`p-5 flex flex-col gap-4 border ${
                  item.status === 'ditolak'
                    ? 'border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20'
                    : ''
                }`}>
                  {/* Top row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-primary-600 dark:text-primary-400">
                          {item.nomorResi}
                        </span>
                        <Badge variant="neutral" size="sm">{item.jenisSuratKode}</Badge>
                      </div>
                      <h3 className="font-bold text-neutral-900 dark:text-white text-sm">
                        {item.jenisSuratNama}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1">
                        Diajukan: {formatTanggal(item.dibuatPada, { withTime: true })}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={item.status === 'selesai' ? 'success' : item.status === 'ditolak' ? 'danger' : 'warning'}>
                        {item.status.toUpperCase()}
                      </Badge>
                      <Link href={`/layanan/lacak?resi=${item.nomorResi}`}>
                        <Button variant="outline" size="sm">Detail</Button>
                      </Link>
                      {(item.dokumenHasil || item.status === 'selesai') && (
                        <Link href={`/surat/${item.nomorResi}`}>
                          <Button variant="primary" size="sm">
                            <Download className="w-3.5 h-3.5" /> Unduh PDF
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Rejection reason banner */}
                  {item.status === 'ditolak' && item.catatanAdmin && (
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800">
                      <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-rose-800 dark:text-rose-200">Alasan Penolakan dari Admin:</p>
                        <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5 leading-relaxed">{item.catatanAdmin}</p>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center space-y-4">
              <p className="text-xs text-neutral-500">Belum ada riwayat permohonan surat.</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/layanan">
                  <Button variant="primary" size="sm"><FileText className="w-4 h-4" /> Ajukan Surat Online</Button>
                </Link>
                <Link href="/faq">
                  <Button variant="ghost" size="sm">Lihat Panduan Layanan</Button>
                </Link>
              </div>
            </Card>
          )}
        </div>

        {/* Riwayat Pengaduan */}
        <div className="space-y-4 pt-4">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-secondary-600" />
            Riwayat Pengaduan Anda
          </h2>

          {pengaduanList.length > 0 ? (
            <div className="space-y-4">
              {pengaduanList.map((adg) => (
                <Card key={adg.id} className="p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-secondary-600">
                      {adg.nomorTiket}
                    </span>
                    <Badge variant={adg.status === 'selesai' ? 'success' : 'info'}>
                      {adg.status.toUpperCase()}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-sm text-neutral-900 dark:text-white">{adg.judul}</h4>
                  <p className="text-xs text-neutral-500">{adg.deskripsi}</p>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center space-y-4">
              <p className="text-xs text-neutral-500">Belum ada riwayat pengaduan.</p>
              <Link href="/pengaduan">
                <Button variant="primary" size="sm"><MessageSquare className="w-4 h-4" /> Buat Pengaduan</Button>
              </Link>
            </Card>
          )}
        </div>

        <Modal isOpen={profileOpen} onClose={() => setProfileOpen(false)} title="Perbarui Profil Kependudukan Anda" maxWidth="2xl">
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
            {/* Header info */}
            <div className="p-3 bg-primary-50 dark:bg-primary-950/40 rounded-xl border border-primary-100 dark:border-primary-900 text-xs text-primary-800 dark:text-primary-200">
              💡 <b>Tips Auto-Fill:</b> Data profil ini akan otomatis diisikan pada setiap formulir permohonan surat online, sehingga Anda tidak perlu mengetik ulang setiap kali membuat surat.
            </div>

            {/* Section 1: Identitas Utama */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 border-b pb-1">
                1. Identitas &amp; Kontak Utama
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Nama Lengkap"
                  className="uppercase placeholder:normal-case"
                  value={profileForm.nama}
                  onChange={(e) => setProfileForm({ ...profileForm, nama: e.target.value })}
                />
                <Input
                  label="Email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />
                <Input
                  label="NIK (16 Digit)"
                  className="uppercase placeholder:normal-case"
                  value={profileForm.nik}
                  onChange={(e) => setProfileForm({ ...profileForm, nik: e.target.value })}
                />
                <Input
                  label="No. Kartu Keluarga (KK)"
                  className="uppercase placeholder:normal-case"
                  value={profileForm.noKk}
                  onChange={(e) => setProfileForm({ ...profileForm, noKk: e.target.value })}
                />
                <Input
                  label="No. HP / WhatsApp"
                  className="uppercase placeholder:normal-case"
                  value={profileForm.telepon}
                  onChange={(e) => setProfileForm({ ...profileForm, telepon: e.target.value })}
                />
              </div>
            </div>

            {/* Section 2: Lahir & Demografi */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 border-b pb-1">
                2. Tempat/Tanggal Lahir &amp; Demografi
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Tempat Lahir"
                  className="uppercase placeholder:normal-case"
                  value={profileForm.tempatLahir}
                  onChange={(e) => setProfileForm({ ...profileForm, tempatLahir: e.target.value })}
                />
                <Input
                  label="Tanggal Lahir"
                  type="date"
                  value={profileForm.tanggalLahir}
                  onChange={(e) => setProfileForm({ ...profileForm, tanggalLahir: e.target.value })}
                />
                <Select
                  label="Jenis Kelamin"
                  value={profileForm.jenisKelamin}
                  onChange={(e) => setProfileForm({ ...profileForm, jenisKelamin: e.target.value })}
                  options={[
                    { value: 'L', label: 'LAKI-LAKI' },
                    { value: 'P', label: 'PEREMPUAN' },
                  ]}
                />
                <Input
                  label="Agama"
                  className="uppercase placeholder:normal-case"
                  value={profileForm.agama}
                  onChange={(e) => setProfileForm({ ...profileForm, agama: e.target.value })}
                  placeholder="Misal: ISLAM, KRISTEN..."
                />
                <Select
                  label="Status Perkawinan"
                  value={profileForm.statusPerkawinan}
                  onChange={(e) => setProfileForm({ ...profileForm, statusPerkawinan: e.target.value })}
                  options={[
                    { value: 'BELUM KAWIN', label: 'BELUM KAWIN' },
                    { value: 'KAWIN', label: 'KAWIN' },
                    { value: 'CERAI HIDUP', label: 'CERAI HIDUP' },
                    { value: 'CERAI MATI', label: 'CERAI MATI' },
                  ]}
                />
                <Input
                  label="Pekerjaan"
                  className="uppercase placeholder:normal-case"
                  value={profileForm.pekerjaan}
                  onChange={(e) => setProfileForm({ ...profileForm, pekerjaan: e.target.value })}
                  placeholder="Misal: Petani, PNS, Wiraswasta..."
                />
              </div>
            </div>

            {/* Section 3: Alamat Domisili */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 border-b pb-1">
                3. Alamat &amp; Wilayah Dusun
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Dusun"
                  className="uppercase placeholder:normal-case"
                  value={profileForm.dusun}
                  onChange={(e) => setProfileForm({ ...profileForm, dusun: e.target.value })}
                  placeholder="Nama Dusun"
                />
                <Input
                  label="RT"
                  className="uppercase placeholder:normal-case"
                  value={profileForm.rt}
                  onChange={(e) => setProfileForm({ ...profileForm, rt: e.target.value })}
                  placeholder="001"
                />
                <Input
                  label="RW"
                  className="uppercase placeholder:normal-case"
                  value={profileForm.rw}
                  onChange={(e) => setProfileForm({ ...profileForm, rw: e.target.value })}
                  placeholder="002"
                />
              </div>
              <Textarea
                label="Alamat Lengkap / Jalan"
                className="uppercase placeholder:normal-case"
                value={profileForm.alamat}
                onChange={(e) => setProfileForm({ ...profileForm, alamat: e.target.value })}
                placeholder="Jl. Poros Desa Borong No..."
              />
            </div>

            {/* Section 4: Keamanan */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 border-b pb-1">
                4. Ubah Password (Opsional)
              </h3>
              <Input
                label="Password Baru"
                type="password"
                placeholder="Kosongkan jika tidak ingin diubah"
                value={profileForm.passwordBaru}
                onChange={(e) => setProfileForm({ ...profileForm, passwordBaru: e.target.value })}
                helperText="Password minimal 8 karakter."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setProfileOpen(false)}>
              Batal
            </Button>
            <Button onClick={() => void saveProfile()} isLoading={profileSaving}>
              Simpan Perubahan
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
