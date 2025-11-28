'use client';

import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { Package, DollarSign, MessageSquare, User } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { href: '/market', label: 'Mercado', icon: Package },
  { href: '/prices', label: 'Preços', icon: DollarSign },
  { href: '/negotiation', label: 'Chat', icon: MessageSquare },
  { href: '/profile', label: 'Perfil', icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    const cleanPath = pathname.replace(/^\/(en|pt|emakua)/, '');
    return cleanPath.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
      <div className="flex justify-around p-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex flex-col items-center p-2 transition-colors',
                active ? 'text-black' : 'text-gray-500'
              )}
            >
              <Icon size={24} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
