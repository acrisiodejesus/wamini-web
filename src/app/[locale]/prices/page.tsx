'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { Link } from '@/i18n/routing';
import { Settings } from 'lucide-react';

const MOCK_PRICES = [
  { id: 1, product: 'Tomate', price: '70 MT/kg', location: 'Nampula', date: '23 Nov 2024' },
  { id: 2, product: 'Milho', price: '45 MT/kg', location: 'Monapo', date: '23 Nov 2024' },
  { id: 3, product: 'Feijão', price: '120 MT/kg', location: 'Murrupula', date: '22 Nov 2024' },
  { id: 4, product: 'Arroz', price: '85 MT/kg', location: 'Nampula', date: '22 Nov 2024' },
];

export default function PricesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPrices = MOCK_PRICES.filter(price =>
    price.product.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Sidebar />
      <MobileNav />
      
      <div className="min-h-screen bg-gray-50 md:ml-48 pb-20">
        <header className="bg-white p-4 md:p-6 flex justify-between items-center shadow-sm sticky top-0 z-10">
          <h1 className="text-2xl md:text-3xl font-black logo-wamini">
            Wamini
          </h1>
          <div className="flex gap-3">
            <LanguageSwitcher />
            <Link href="/settings" className="p-2 rounded-full hover:bg-gray-100">
              <Settings size={24} />
            </Link>
          </div>
        </header>
        <main className="p-4 md:p-8">
          <h2 className="text-2xl font-bold mb-6">Preços de Mercado</h2>
          <div className="mb-6 relative">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="PROCURAR"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12"
            />
          </div>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="gradient-wamini">
                <tr>
                  <th className="text-left p-4 font-bold">Produto</th>
                  <th className="text-left p-4 font-bold">Preço</th>
                  <th className="text-left p-4 font-bold hidden md:table-cell">Localização</th>
                  <th className="text-left p-4 font-bold hidden md:table-cell">Data</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrices.map((price) => (
                  <tr key={price.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-semibold">{price.product}</td>
                    <td className="p-4 text-green-600 font-bold">{price.price}</td>
                    <td className="p-4 text-gray-600 hidden md:table-cell">{price.location}</td>
                    <td className="p-4 text-gray-500 text-sm hidden md:table-cell">{price.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPrices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Nenhum preço encontrado</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
