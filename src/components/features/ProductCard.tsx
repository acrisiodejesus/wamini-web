import React from 'react';
import Image from 'next/image';
import { MapPin, User, Tag } from 'lucide-react';
import { Product } from '@/types';
import { Link } from '@/i18n/routing';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/market/${product.id}`} className="group block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden">
      <div className="relative h-48 w-full bg-gray-200">
        {/* Placeholder for image, in real app use next/image with valid src */}
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          {product.image ? (
             <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span>No Image</span>
          )}
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">{product.name}</h3>
        <div className="mt-1 flex items-center text-sm text-gray-500">
          <Tag size={14} className="mr-1" />
          <span>{product.category}</span>
        </div>
        
        <div className="mt-3 flex items-center justify-between">
          <div className="font-bold text-xl text-gray-900">
            {product.price} MTs <span className="text-sm font-normal text-gray-500">/ {product.unit}</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <User size={14} className="mr-1" />
            <span>{product.seller.name}</span>
          </div>
          <div className="flex items-center">
            <MapPin size={14} className="mr-1" />
            <span>{product.location}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
