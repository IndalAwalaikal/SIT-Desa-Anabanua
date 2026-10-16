'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { getUsersAdmin, updateUserRoleAdmin } from '@/lib/services/user.service';
import type { Role, User } from '@/types/user';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { Search } from 'lucide-react';

export default function DashboardPenggunaPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const refreshUsers = useCallback(async () => {
    try {
      const result = await getUsersAdmin(page, 20, search);
      setUsers(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      if (page > Math.max(1, result.totalPages)) setPage(Math.max(1, result.totalPages));
    } catch {
      setUsers([]);
      setTotal(0);
      setTotalPages(1);
    }
  }, [page, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refreshUsers(); }, search ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [refreshUsers, search]);

  const changeRole = async (id: string, role: Role) => {
    setSavingId(id);
    try {
      const updated = await updateUserRoleAdmin(id, role);
      setUsers((current) => current.map((user) => user.id === id ? updated : user));
    } finally { setSavingId(null); }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="eyebrow">Administrasi akses</p><h1 className="mt-2 text-2xl font-extrabold text-neutral-900 dark:text-white">Manajemen Pengguna & Peran</h1><p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Kelola warga, operator, dan hak akses pengelolaan website dari satu tempat.</p></div>
        <div className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-xs text-primary-700 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-200"><span className="font-bold text-primary-900 dark:text-white">{total.toLocaleString('id-ID')}</span> akun terdaftar</div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
        <input
          value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); }}
          placeholder="Cari nama, email, atau NIK..."
          aria-label="Cari pengguna"
          className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-10 pr-4 text-xs text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
        />
      </div>

      <Card className="overflow-hidden bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="border-b border-neutral-200 bg-neutral-100 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950/70 dark:text-neutral-400"><tr><th className="p-4">Pengguna</th><th className="p-4">Kontak</th><th className="p-4">Peran saat ini</th><th className="p-4">Ubah akses</th></tr></thead>
            <tbody className="divide-y divide-neutral-200 text-neutral-600 dark:divide-neutral-800 dark:text-neutral-300">
              {users.map((user) => <tr key={user.id} className="transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800/70">
                <td className="p-4"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-primary-700 text-xs font-bold text-white">{user.nama.charAt(0)}</span><div><p className="font-bold text-neutral-900 dark:text-white">{user.nama}</p><p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">NIK: {user.nik || '—'}</p></div></div></td>
                <td className="p-4"><p>{user.email}</p><p className="mt-1 text-neutral-500 dark:text-neutral-400">{user.telepon || '—'}</p></td>
                <td className="p-4"><Badge variant={user.role === 'super_admin' ? 'danger' : user.role === 'admin' ? 'warning' : 'primary'}>{user.role.replace('_', ' ').toUpperCase()}</Badge></td>
                <td className="p-4"><Select aria-label={`Ubah peran ${user.nama}`} value={user.role} disabled={savingId === user.id} onChange={(event) => void changeRole(user.id, event.target.value as Role)} options={[{ value: 'warga', label: 'Warga' }, { value: 'admin', label: 'Admin' }, { value: 'super_admin', label: 'Super Admin' }]} className="px-3 py-2 text-xs font-semibold" /></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </Card>
      <PaginationControls page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
    </div>
  );
}
