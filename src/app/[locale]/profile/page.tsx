'use client';

import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/authStore';
import { Settings, MapPin, Star, Package, MessageSquare } from 'lucide-react';
import { Link } from '@/i18n/routing';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';

export default function ProfilePage() {
  const t = useTranslations('Common');
  const { user } = useAuthStore();
  const posts = [
    { id: 1, title: 'Milho Branco 50kg', price: '1.200 MT', date: '20 Nov', status: 'Active' },
    { id: 2, title: 'Feijão Manteiga', price: '800 MT', date: '18 Nov', status: 'Sold' },
  ];

  const reviews = [
    { id: 1, user: 'Maria Silva', rating: 5, comment: 'Ótimo vendedor, produto de qualidade!', date: '2 dias atrás' },
    { id: 2, user: 'João Paulo', rating: 4, comment: 'Entrega rápida.', date: '1 semana atrás' },
  ];

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
        <div className="p-4 md:p-8">
          <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-black" style={{
                background: 'linear-gradient(135deg, #D8FF12 0%, #FBB03B 100%)'
              }}>
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="text-center md:text-left flex-1">
                <h2 className="text-2xl font-bold">{user?.name || 'Usuário'}</h2>
                <p className="text-gray-500 flex items-center justify-center md:justify-start gap-1 mt-1">
                  <MapPin size={16} /> Nampula, Moçambique
                </p>
                <div className="flex items-center justify-center md:justify-start gap-4 mt-3">
                  <div className="flex items-center gap-1 gradient-wamini px-3 py-1 rounded-full text-black text-sm font-medium">
                    <Star size={16} className="fill-black" />
                    <span>4.8 (12 avaliações)</span>
                  </div>
                  <div className="flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full text-green-700 text-sm font-medium">
                    <Package size={16} />
                    <span>5 anúncios ativos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Package size={20} />
                  Meus Anúncios
                </h3>
                <button className="text-sm font-medium hover:underline" style={{
                  background: 'linear-gradient(135deg, #D8FF12 0%, #FBB03B 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>Ver todos</button>
              </div>
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-semibold">{post.title}</p>
                      <p className="text-sm text-gray-500">{post.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{post.price}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${post.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {post.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <MessageSquare size={20} />
                  Avaliações Recentes
                </h3>
                <button className="text-sm font-medium hover:underline" style={{
                  background: 'linear-gradient(135deg, #D8FF12 0%, #FBB03B 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>Ver todas</button>
              </div>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="p-3 border border-gray-100 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold text-sm">{review.user}</p>
                      <div className="flex" style={{ color: '#FBB03B' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} className={i < review.rating ? 'fill-current' : 'text-gray-300'} />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm italic">"{review.comment}"</p>
                    <p className="text-xs text-gray-400 mt-2 text-right">{review.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
