'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { loginSchema, type LoginSchemaType } from '@/lib/validations/auth.schema';
import { loginService } from '@/lib/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const { showSuccess, showError } = useToastStore();
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchemaType) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const user = await loginService(data);
      setUser(user);
      showSuccess(`Selamat datang kembali, ${user.nama}!`);
      router.push(user.role === 'admin' || user.role === 'super_admin' ? '/dashboard' : '/');
    } catch (err) {
      // Backend sekarang mengirim pesan spesifik: "Email tidak terdaftar" (401 INVALID_EMAIL),
      // "Password salah" (401 WRONG_PASSWORD), "Akun dinonaktifkan…" (403), dll —
      // ApiError.message sudah berisi pesan user-facing yang tepat, jadi tampilkan apa adanya.
      // ponytail: jika ingin field-level feedback, branch di sini pakai (err as ApiError).code.
      const msg = err instanceof Error ? err.message : t('Login.errorDefault');
      setErrorMsg(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-16 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <div className="container-desa max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 text-xs font-bold">
            <span>{t('Login.eyebrow')}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
            {t('Login.title')}
          </h1>
          <p className="text-xs text-neutral-500">
            {t('Login.subtitle')}
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          {errorMsg && (
            <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label={t('Login.emailLabel')}
              placeholder={t('Login.emailPlaceholder')}
              leftIcon={<Mail className="w-4 h-4" />}
              {...register('email')}
              error={errors.email?.message}
            />

            <Input
              label={t('Login.passwordLabel')}
              type={showPassword ? 'text' : 'password'}
              placeholder={t('Login.passwordPlaceholder')}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={<button type="button" onClick={() => setShowPassword(!showPassword)} className="pointer-events-auto rounded p-1 text-neutral-400 hover:text-primary-600" aria-label={showPassword ? t('Login.hidePassword') : t('Login.showPassword')}>{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>}
              {...register('password')}
              error={errors.password?.message}
            />

            <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>
              <LogIn className="w-4 h-4" />
              {t('Login.submit')}
            </Button>
          </form>


          <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800 text-center text-xs text-neutral-500 space-y-2">
            <div>
              <Link href="/forgot-password" className="font-semibold text-primary-600 hover:underline">
                {t('Login.forgotPassword')}
              </Link>
            </div>
            <div>
              {t('Login.noAccount')}{' '}
              <Link href="/register" className="font-bold text-primary-600 hover:underline">
                {t('Login.register')}
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
