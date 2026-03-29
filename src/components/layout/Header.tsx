import Sidebar from "./Sidebar";
import LanguageSwitcher from "./LanguageSwitcher";
import { Link } from '@/i18n/routing';
import { Settings } from 'lucide-react';

export function Header() {
  return(
    <header className="bg-white p-4 md:p-6  md:shadow-sm sticky top-0 z-10" aria-label="Cabeçalho da aplicação Wamini">
              <div className='flex justify-between items-center'>
                <h1 className="text-2xl md:text-3xl font-black logo-wamini">
                  <Link href="/" aria-label="Wamini — página inicial">
                    Wamini
                  </Link>
                </h1>
                <div className="flex gap-3" role="toolbar" aria-label="Ações do cabeçalho">
                  <LanguageSwitcher />
                  <Link href="/settings" className="p-2 rounded-full hover:bg-gray-100" aria-label="Abrir configurações da conta">
                    <Settings size={24} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            <Sidebar />
            </header>
  )
}