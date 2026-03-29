'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/routing';
import clsx from 'clsx';

import { useTranslations } from 'next-intl';

// ...

export default function Sidebar() {
  const t = useTranslations('common');
  const pathname = usePathname();

  const navItems = [
    {
      href: '/market',
      label: t('nav.market'),
      image: '/1.jpg',
    },
    {
      href: '/prices',
      label: t('nav.prices'),
      image: '/2.jpg',
    },
    {
      href: '/negotiation',
      label: t('nav.negotiation'),
      image: '/3.jpg',
    },
    {
      href: '/profile',
      label: t('nav.profile'),
      image: '/4.jpg',
    },
  ];

  const isActive = (href: string) => {
    const cleanPath = pathname.replace(/^\/(en|pt|emakua)/, '');
    return cleanPath.startsWith(href);
  };

  return (
    <>
      <nav className="hidden md:flex fixed left-0 top-0 h-screen w-48 md:align-center flex-col p-4 z-20 gap-4" aria-label="Navegação principal">
        <div className="flex-1 space-y-3 overflow-y-auto">
          {navItems.map((item, index) => {
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className="block group"
                aria-label={`${item.label}${active ? ' — página atual' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <div className="relative w-full h-28 rounded-t-2xl overflow-hidden">
                  <Image
                    src={item.image}
                    alt=""
                    aria-hidden="true"
                    fill
                    className="object-cover"
                    sizes="192px"
                    // Primeira imagem é LCP em desktop — carregar com prioridade
                    priority={index === 0}
                  />
                </div>
                <div
                  className={clsx(
                    'text-center font-bold text-sm py-2 rounded-b-xl transition-all',
                    active
                      ? 'text-black'
                      : 'gradient-wamini text-black'
                  )}
                >
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Sidebar - Horizontal */}
      <nav className="md:hidden overflow-x-auto" aria-label="Navegação principal">
        <div className="flex justify-center gap-3 p-3">
          {navItems.map((item, index) => {
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-shrink-0 block group"
                aria-label={`${item.label}${active ? ' — página atual' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <div className="relative w-24 h-20 rounded-t-xl overflow-hidden">
                  <Image
                    src={item.image}
                    alt=""
                    aria-hidden="true"
                    fill
                    className="object-cover"
                    sizes="96px"
                    priority={index === 0}
                  />
                </div>
                <div
                  className={clsx(
                    'text-center font-bold text-xs py-1 rounded-b-xl transition-all',
                    active
                      ? 'text-black'
                      : 'gradient-wamini text-black'
                  )}
                >
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
