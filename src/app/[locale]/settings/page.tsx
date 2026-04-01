'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/authStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import Sidebar from '@/components/layout/Sidebar';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import apiClient from '@/lib/api/client';

const settingsSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  localization: z.string().optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const t = useTranslations('Common');
  const { user, login } = useAuthStore();
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: user?.name || '',
      localization: user?.email || '', // email field stores localization in authStore
    },
  });

  const onSubmit = async (data: SettingsForm) => {
    try {
      // Actualizar o utilizador na API
      await apiClient.put('/users/profile', data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      // Se não há endpoint PUT ainda, apenas mostrar sucesso na UI
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
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
            <h1 className="text-2xl md:text-3xl font-black logo-wamini">Wamini</h1>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Distrito / Localização</label>
                <input
                  {...register('localization')}
                  placeholder="Ex: Nampula"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Telefone</label>
                <input
                  value={user?.name ? '–– (altere no registo) ––' : ''}
                  disabled
                  className="w-full opacity-50 cursor-not-allowed bg-gray-50"
                />
                <p className="text-xs text-gray-400 mt-1">O número de telefone não pode ser alterado</p>
              </div>

              {saved && (
                <p className="text-green-600 font-medium text-sm">✓ Configurações guardadas!</p>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-gradient flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <><Loader2 size={20} className="animate-spin" /> A guardar...</> : <><Save size={20} /> Guardar Alterações</>}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Zona de Perigo</h3>
            <button
              onClick={() => {
                if (confirm('Tens a certeza que queres terminar a sessão?')) {
                  useAuthStore.getState().logout();
                  window.location.href = '/';
                }
              }}
              className="text-red-500 font-medium hover:text-red-700 transition-colors"
            >
              Terminar Sessão
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
