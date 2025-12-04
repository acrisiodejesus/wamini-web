'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/useAuth';

const loginSchema = z.object({
  mobile_number: z.string().min(10, 'Mobile number must be at least 10 digits'),
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
      setApiError(error.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('login')}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label htmlFor="mobile-number" className="sr-only">Mobile Number</label>
              <input
                id="mobile-number"
                type="tel"
                autoComplete="tel"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Mobile number"
                {...register('mobile_number')}
              />
              {errors.mobile_number && <p className="text-red-500 text-xs mt-1">{errors.mobile_number.message}</p>}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Password"
                {...register('password')}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
          </div>

          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {apiError}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {isSubmitting ? 'Loading...' : t('login')}
            </button>
          </div>
          
          <div className="text-center mt-4">
            <Link href="/auth/register" className="text-sm text-primary hover:text-primary-hover">
              Don't have an account? Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
