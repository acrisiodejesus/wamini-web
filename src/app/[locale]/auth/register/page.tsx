'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Lock, MapPin, AlertCircle, Sprout, Truck, ShoppingBag, Users } from 'lucide-react';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';

const ROLE_ICONS = {
  farmer:      { Icon: Sprout,      color: '#2D6A4F', bg: '#f0faf4' },
  transporter: { Icon: Truck,       color: '#FBB03B', bg: '#fffbf0' },
  seller:      { Icon: ShoppingBag, color: '#374151', bg: '#f3f4f6' },
  buyer:       { Icon: Users,       color: '#1d4ed8', bg: '#eff6ff' },
};

const DISTRICTS = [
  'Angoche',
  'Eráti',
  'Ilha de Moçambique',
  'Lalaua',
  'Larde',
  'Liúpo',
  'Malema',
  'Meconta',
  'Mecubúri',
  'Memba',
  'Mogincual',
  'Mogovolas',
  'Moma',
  'Monapo',
  'Mossuril',
  'Muecate',
  'Murrupula',
  'Nacala-Porto',
  'Nacala-a-Velha',
  'Nacarôa',
  'Nampula',
  'Rapale',
  'Ribáuè',
];

const registerSchema = z.object({
  role:            z.string().min(1),
  name:            z.string().min(2),
  phone:           z.string().min(9),
  localization:    z.string().min(1),
  password:        z.string().min(6),
  confirmPassword: z.string(),
  terms:           z.boolean().refine((v) => v === true),
}).refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'] });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const t = useTranslations('common');
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const roleValue = watch('role');

  const handleRoleSelect = (value: string) => {
    setValue('role', value, { shouldValidate: true });
  };

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setApiError(null);
    try {
      await registerUser({
        name: data.name,
        password: data.password,
        mobile_number: data.phone,
        localization: data.localization,
      });
      router.push('/auth/login');
    } catch (error: any) {
      if (error.response?.status === 409) {
        setApiError(t('errors.phone_taken'));
      } else {
        setApiError(error.response?.data?.error || error.message || t('errors.generic'));
      }
    } finally {
      setIsLoading(false);
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
            {(Object.keys(ROLE_ICONS) as Array<keyof typeof ROLE_ICONS>).map((key) => (
              <span key={key} className="bg-black/10 text-gray-900 text-xs font-bold px-4 py-2 rounded-full">
                {t(`auth.roles.${key}`)}
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

          <h2 className="text-3xl font-black text-gray-900 mb-1">{t('auth.register_title')}</h2>
          <p className="text-gray-500 mb-8 text-sm">{t('auth.register_subtitle')}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

            {/* ── Role selector ── */}
            <div>
              <p className="text-sm font-bold text-gray-700 mb-2">{t('auth.role_prompt')}</p>
              <div className="grid grid-cols-2 gap-3">
                {(Object.entries(ROLE_ICONS) as Array<[keyof typeof ROLE_ICONS, typeof ROLE_ICONS[keyof typeof ROLE_ICONS]]>).map(([key, { Icon, color, bg }]) => {
                  const active = roleValue === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleRoleSelect(key)}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-sm font-bold transition-all duration-200"
                      style={{
                        background: active ? bg : '#fff',
                        borderColor: active ? color : '#E5E7EB',
                        color: active ? color : '#6B7280',
                        transform: active ? 'scale(1.04)' : 'scale(1)',
                      }}
                    >
                      <Icon size={24} strokeWidth={1.8} />
                      {t(`auth.roles.${key}`)}
                    </button>
                  );
                })}
              </div>
              <input type="hidden" {...register('role')} />
              {errors.role && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {t('auth.role_prompt')}
                </p>
              )}
            </div>

            {/* ── Fields revealed after role selection ── */}
            <AnimatePresence>
              {roleValue && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-4 overflow-hidden"
                >
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('auth.name_label')}</label>
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input type="text" placeholder={t('auth.name_placeholder')} className="w-full input-icon-left" {...register('name')} />
                    </div>
                    {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} />{t('auth.name_label')}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('auth.phone_label')}</label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input type="tel" placeholder={t('auth.phone_placeholder')} className="w-full input-icon-left" {...register('phone')} />
                    </div>
                    {errors.phone && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} />{t('auth.phone_label')}</p>}
                  </div>

                  {/* District */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('auth.district_label')}</label>
                    <div className="relative">
                      <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <select className="w-full input-icon-left appearance-none" defaultValue="" {...register('localization')}>
                        <option value="" disabled>{t('auth.district_placeholder')}</option>
                        {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    {errors.localization && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} />{t('auth.district_label')}</p>}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('auth.password_label')}</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input type="password" placeholder={t('auth.password_placeholder')} className="w-full input-icon-left" {...register('password')} />
                    </div>
                    {errors.password && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} />{t('auth.password_label')}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('auth.confirm_password_label')}</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input type="password" placeholder={t('auth.confirm_password_placeholder')} className="w-full input-icon-left" {...register('confirmPassword')} />
                    </div>
                    {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} />{t('auth.confirm_password_label')}</p>}
                  </div>

                  {/* Terms */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="terms"
                      className="mt-1 w-5 h-5 rounded border-2 border-black flex-shrink-0"
                      {...register('terms')}
                    />
                    <label htmlFor="terms" className="text-sm text-gray-700 leading-snug">
                      {t('auth.terms_label')}
                    </label>
                  </div>
                  {errors.terms && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle size={12} />{t('auth.terms_label')}</p>}

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

                  {/* Submit */}
                  <button type="submit" disabled={isLoading} className="btn-gradient w-full py-4 text-base">
                    {isLoading ? t('auth.creating') : t('register')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <p className="mt-6 text-sm text-center text-gray-600">
            {t('auth.have_account')}{' '}
            <Link
              href="/auth/login"
              className="font-black"
              style={{
                background: 'linear-gradient(135deg, #D8FF12, #FBB03B)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {t('login')}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
