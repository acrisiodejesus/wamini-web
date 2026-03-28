'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Phone, Lock, AlertCircle } from 'lucide-react';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';

const loginSchema = z.object({
  mobile_number: z.string().min(9),
  password: z.string().min(6),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const t = useTranslations('common');
  const router = useRouter();
  const { login } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setApiError(null);
    try {
      await login(data);
      router.push('/market');
    } catch (error: any) {
      setApiError(t('errors.login_failed'));
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* ── LEFT / BRAND PANEL ── */}
      <div className="gradient-wamini flex flex-col items-center justify-center p-10 md:w-5/12 md:min-h-screen">
        <motion.div
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center w-full"
        >
          <h1 className="text-7xl md:text-8xl font-black logo-wamini leading-none mb-3">Wamini</h1>
          <p className="text-gray-800 font-semibold text-lg max-w-xs text-center mx-auto">
            {t('landing.tagline')}
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-8">
            {(['farmer', 'transporter', 'buyer'] as const).map((role) => (
              <span key={role} className="bg-black/10 text-gray-900 text-xs font-bold px-4 py-2 rounded-full">
                {t(`auth.roles.${role}`)}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── RIGHT / FORM PANEL ── */}
      <div className="flex-1 flex items-start justify-center px-6 py-12 bg-white overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Language switcher */}
          <div className="flex justify-end mb-6">
            <LanguageSwitcher />
          </div>

          <h2 className="text-3xl font-black text-gray-900 mb-1">{t('auth.login_title')}</h2>
          <p className="text-gray-500 mb-8 text-sm">{t('auth.login_subtitle')}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

            {/* Mobile Number */}
            <div>
              <label htmlFor="mobile_number" className="block text-sm font-bold text-gray-700 mb-1">
                {t('auth.phone_label')}
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  id="mobile_number"
                  type="tel"
                  autoComplete="tel"
                  placeholder={t('auth.phone_placeholder')}
                  className="w-full input-icon-left"
                  {...register('mobile_number')}
                />
              </div>
              {errors.mobile_number && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {t('auth.phone_label')}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-1">
                {t('auth.password_label')}
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder={t('auth.password_placeholder')}
                  className="w-full input-icon-left"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {t('auth.password_label')}
                </p>
              )}
            </div>

            {/* API Error */}
            {apiError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm flex items-center gap-2"
              >
                <AlertCircle size={16} /> {apiError}
              </motion.div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-gradient w-full py-4 text-base">
              {isSubmitting ? t('auth.signing_in') : t('auth.login_title')}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-gray-600">
              {t('auth.no_account')}{' '}
              <Link
                href="/auth/register"
                className="font-black"
                style={{
                  background: 'linear-gradient(135deg, #D8FF12, #FBB03B)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {t('register')}
              </Link>
            </p>
            <p className="text-xs text-gray-400">
              <Link href="/auth/login" className="hover:underline">{t('auth.forgot_password')}</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
