'use client';

import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/authStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save } from 'lucide-react';
import { Link } from '@/i18n/routing';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';

const settingsSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(9, 'Número inválido'),
  location: z.string().optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const t = useTranslations('Common');
  const { user, login } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: '841234567',
      location: 'Nampula, Moçambique',
    },
  });

  const onSubmit = async (data: SettingsForm) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('Updated settings:', data);
    alert('Configurações atualizadas com sucesso!');
  };

  return (
    <>
      <Sidebar />
      
      <div className="min-h-screen bg-gray-50 md:ml-48 pb-20">
        <header className="bg-white p-4 md:p-6 flex justify-between items-center shadow-sm sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Link href="/profile" className="md:hidden p-2 -ml-2 rounded-full hover:bg-gray-100">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-2xl md:text-3xl font-black logo-wamini">
              Wamini
            </h1>
          </div>
          <LanguageSwitcher />
        </header>

        <div className="max-w-2xl mx-auto p-4 md:p-8">
          <h2 className="text-2xl font-bold mb-6">Configurações da Conta</h2>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Dados Pessoais</h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input
                  {...register('name')}
                  className="w-full"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="w-full"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
                <input
                  {...register('location')}
                  className="w-full"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-gradient flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Zona de Perigo</h3>
            <button className="text-red-500 font-medium hover:text-red-700 transition-colors">
              Excluir minha conta
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
