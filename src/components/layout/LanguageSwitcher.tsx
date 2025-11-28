'use client';

import { useState, useTransition } from 'react';
import { Globe, X, Check } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import clsx from 'clsx';

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const languages = [
    { code: 'pt', label: 'Português' },
    { code: 'en', label: 'English' },
    { code: 'emakua', label: 'Emakhuwa' },
  ];

  const switchLanguage = (newLocale: string) => {
    setIsOpen(false);
    const currentSearchParams = searchParams.toString();
    const queryString = currentSearchParams ? `?${currentSearchParams}` : '';
    
    startTransition(() => {
      router.push(`${pathname}${queryString}`, { locale: newLocale as any });
    });
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Change language"
        disabled={isPending}
      >
        <Globe size={24} />
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="font-semibold text-lg">Selecionar Idioma</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => switchLanguage(lang.code)}
                  disabled={isPending}
                  className={clsx(
                    "w-full flex items-center justify-between p-4 rounded-xl transition-colors",
                    locale === lang.code 
                      ? "bg-yellow-50 text-yellow-900" 
                      : "hover:bg-gray-50 text-gray-700",
                    isPending && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span className="font-medium">{lang.label}</span>
                  {locale === lang.code && <Check size={20} className="text-yellow-500" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
