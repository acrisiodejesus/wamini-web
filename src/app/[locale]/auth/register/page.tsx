'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/useAuth';
import { Accessibility } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(9, 'Número inválido'),
  localization: z.string().min(1, 'Selecione um distrito'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val === true, 'Você deve concordar com os termos'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

const DISTRICTS = [
  'Nampula',
  'Monapo',
  'Murrupula',
  'Nacala',
  'Angoche',
  'Ilha de Moçambique',
  'Memba',
  'Mossuril',
];

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

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

      router.push('/market');
    } catch (error: any) {
      setApiError(error.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <h1 className="text-5xl md:text-6xl font-black mb-2 logo-wamini">
        Wamini
      </h1>
      <p className="text-gray-600 mb-8">Encontre, negocie e receba</p>

      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md space-y-4">
        <div>
          <input
            {...register('name')}
            type="text"
            placeholder="Seu Nome"
            className="w-full"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <input
            {...register('email')}
            type="email"
            placeholder="Seu Email"
            className="w-full"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <input
            {...register('phone')}
            type="tel"
            placeholder="Seu Número"
            className="w-full"
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <select
            {...register('localization')}
            className="w-full"
            defaultValue=""
          >
            <option value="" disabled>Distrito</option>
            {DISTRICTS.map((district) => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
          {errors.localization && <p className="text-red-500 text-sm mt-1">{errors.localization.message}</p>}
        </div>

        <div>
          <input
            {...register('password')}
            type="password"
            placeholder="Crie Senha"
            className="w-full"
          />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <input
            {...register('confirmPassword')}
            type="password"
            placeholder="Confirme a Senha"
            className="w-full"
          />
          {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <div className="flex items-center gap-2">
          <input
            {...register('terms')}
            type="checkbox"
            id="terms"
            className="w-5 h-5 rounded border-2 border-black"
          />
          <label htmlFor="terms" className="text-sm text-gray-700">
            Concordo com os termos e condições
          </label>
        </div>
        {errors.terms && <p className="text-red-500 text-sm">{errors.terms.message}</p>}

        {apiError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {apiError}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-gradient py-4 text-lg font-bold"
        >
          {isLoading ? 'Criando conta...' : 'Registar'}
        </button>
      </form>
      <p className="mt-6 text-sm">
        Já tem uma conta?{' '}
        <Link href="/auth/login" style={{
          background: 'linear-gradient(135deg, #D8FF12 0%, #FBB03B 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: 'bold'
        }}>
          Entre!
        </Link>
      </p>

      <p className="mt-4 text-center text-sm text-gray-500">
        <Link href="/auth/login" className="hover:underline">Recuperar senha</Link>
      </p>
      <button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg gradient-wamini"
        aria-label="Acessibilidade"
      >
        <Accessibility size={24} className="text-black" />
      </button>
    </div>
  );
}
