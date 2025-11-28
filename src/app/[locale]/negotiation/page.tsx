'use client';

import React, { useState } from 'react';
import { Search, Send, ArrowLeft } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { Link } from '@/i18n/routing';
import { Settings } from 'lucide-react';
import clsx from 'clsx';

const CATEGORIES = ['TUDO', 'PRODUTOS', 'TRANSPORTE', 'INSUMOS'];

const CONVERSATIONS = [
  { id: 1, user: 'Antônio Guerra', lastMessage: 'Bom dia, já despachei o produto!', avatar: 'A', unread: false },
  { id: 2, user: 'Antônio Guerra', lastMessage: 'Bom dia, já despachei o produto!', avatar: 'A', unread: false },
  { id: 3, user: 'Antônio Guerra', lastMessage: 'Bom dia, já despachei o produto!', avatar: 'A', unread: false },
  { id: 4, user: 'Antônio Guerra', lastMessage: 'Bom dia, já despachei o produto!', avatar: 'A', unread: false },
  { id: 5, user: 'Antônio Guerra', lastMessage: 'Bom dia, já despachei o produto!', avatar: 'A', unread: false },
  { id: 6, user: 'Antônio Guerra', lastMessage: 'Bom dia, já despachei o produto!', avatar: 'A', unread: false },
];

const MOCK_PRODUCT = {
  name: 'Tomate - 50kg - MURIASE',
  price: '70 mts/kg',
  image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400',
  question: 'BOM DIA! Tenho interesse neste produto, ainda esta disponivel?'
};

export default function NegotiationPage() {
  const [activeCategory, setActiveCategory] = useState('TUDO');
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');

  return (
    <>
      <div className="min-h-screen bg-gray-50 md:ml-48 pb-20">
        <header className="bg-white p-4 md:p-6 flex justify-between items-center shadow-sm sticky top-0 z-10">
          <Sidebar />
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
        <main className="p-4 md:p-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className={clsx(
              'md:col-span-1 bg-white rounded-2xl shadow-sm overflow-hidden',
              selectedChat ? 'hidden md:block' : 'block'
            )}>
              <div className="divide-y divide-gray-100">
                {CONVERSATIONS.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedChat(conv.id)}
                    className={clsx(
                      'w-full p-4 text-left hover:bg-gray-50 transition-colors',
                      selectedChat === conv.id && 'bg-gray-50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {conv.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm mb-1">{conv.user}</p>
                        <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div 
              className={clsx(
                'md:col-span-2 bg-white rounded-2xl shadow-sm flex flex-col',
                !selectedChat ? 'hidden md:flex' : 'flex'
              )} 
              style={{ height: '600px' }}
            >
              <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                <button 
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-full"
                >
                  <ArrowLeft size={20} />
                </button>
                <h3 className="font-bold text-lg">João João</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl p-3 max-w-[70%]">
                    <p className="text-xs font-bold mb-1">Antônio Guerra</p>
                    <p className="text-sm">Bom dia, já despachei o produto!</p>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-gray-200">
                <div className="bg-gray-50 rounded-xl p-3 mb-3">
                  <div className="flex gap-3">
                    <img 
                      src={MOCK_PRODUCT.image} 
                      alt={MOCK_PRODUCT.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-sm mb-1">{MOCK_PRODUCT.name}</h4>
                      <p className="text-sm font-semibold text-green-600">{MOCK_PRODUCT.price}</p>
                    </div>
                  </div>
                  <p className="text-sm mt-2 text-gray-700">{MOCK_PRODUCT.question}</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Mensagem"
                    className="flex-1"
                  />
                  <button 
                    className="w-12 h-12 rounded-full gradient-wamini flex items-center justify-center"
                    onClick={() => setMessage('')}
                  >
                    <Send size={20} className="text-black" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
