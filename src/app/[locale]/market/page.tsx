'use client';

import React, { useState } from 'react';
import MarketFilters from '@/components/features/MarketFilters';
import ProductCard from '@/components/features/ProductCard';
import AdvertiseModal from '@/components/features/AdvertiseModal';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { Product } from '@/types';
import { Product as ApiProduct } from '@/lib/api/types';
import { Settings, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useProducts } from '@/hooks/useProducts';
import { useTranslations } from 'next-intl';

// Adapter function to convert API Product to UI Product
function adaptApiProduct(apiProduct: ApiProduct): Product {
  return {
    id: apiProduct.id.toString(),
    name: apiProduct.name,
    category: 'General', // Default category since backend doesn't provide it
    price: apiProduct.price,
    unit: 'kg', // Default unit since backend doesn't provide it
    quantity: apiProduct.quantity || 0,
    location: '', // Backend doesn't provide location
    seller: {
      id: apiProduct.user_id.toString(),
      name: 'Seller', // Backend doesn't return user info in product list
    },
    image: apiProduct.photo || '/placeholder-product.jpg',
    description: '', // Backend doesn't provide description
  };
}

export default function MarketPage() {
  const t = useTranslations('common');
  const [activeCategory, setActiveCategory] = useState('Tudo');
  const [isAdvertiseModalOpen, setIsAdvertiseModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch products from API
  const { products, isLoading, error } = useProducts(
    activeCategory !== 'Tudo' ? { category: activeCategory, search: searchQuery } : { search: searchQuery },
    { page: 1, per_page: 20 }
  );

  return (
    <>
      <div className="min-h-screen bg-gray-50 md:ml-48 pb-20">
          
        
        <main className="p-4 md:p-8">
          <MarketFilters 
            onSearch={setSearchQuery} 
            onCategoryChange={setActiveCategory}
            activeCategory={activeCategory}
            onAdvertiseClick={() => setIsAdvertiseModalOpen(true)}
          />

          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 size={48} className="animate-spin text-yellow-500" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700  px-6 py-4 rounded-lg mt-6">
              <p className="font-semibold">Error loading products</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!isLoading && !error && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {products.map(product => (
                  <ProductCard key={product.id} product={adaptApiProduct(product)} />
                ))}
              </div>

              {products.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">{t('no_products_found')}</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <AdvertiseModal 
        isOpen={isAdvertiseModalOpen} 
        onClose={() => setIsAdvertiseModalOpen(false)} 
      />
    </>
  );
}
