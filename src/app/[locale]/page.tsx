import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function HomePage() {
  const t = useTranslations('common');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8 text-primary">{t('welcome')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Link href="/auth/login" className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100">
          <h2 className="text-2xl font-semibold mb-2">{t('login')} &rarr;</h2>
          <p className="text-gray-600">Access your account to start trading.</p>
        </Link>

        <Link href="/market" className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100">
          <h2 className="text-2xl font-semibold mb-2">{t('market')} &rarr;</h2>
          <p className="text-gray-600">Browse available products and prices.</p>
        </Link>
      </div>
    </main>
  );
}
