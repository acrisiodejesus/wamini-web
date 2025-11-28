'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import clsx from 'clsx';

interface AdvertiseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categories = ['TUDO', 'PRODUTOS', 'TRANSPORTE', 'INSUMOS'];

export default function AdvertiseModal({ isOpen, onClose }: AdvertiseModalProps) {
  const [activeCategory, setActiveCategory] = useState('TUDO');
  const { register, handleSubmit, reset } = useForm();

  if (!isOpen) return null;

  const onSubmit = (data: any) => {
    console.log('Anúncio criado:', data);
    alert('Anúncio criado com sucesso!');
    reset();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold">ANUNCIAR</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 p-4 border-b border-gray-200 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={clsx(
                'px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all',
                activeCategory === cat
                  ? 'gradient-wamini text-black'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <select 
              {...register('productType')} 
              className="w-full"
              defaultValue="Produto Agrícola"
            >
              <option value="Produto Agrícola">Produto Agrícola</option>
              <option value="Transporte">Transporte</option>
              <option value="Insumos">Insumos</option>
            </select>
          </div>

          <div>
            <input 
              {...register('name', { required: true })} 
              type="text" 
              placeholder="Nome"
              className="w-full"
            />
          </div>

          <div>
            <input 
              {...register('quantity', { required: true })} 
              type="text" 
              placeholder="Quantidade"
              className="w-full"
            />
          </div>

          <div>
            <input 
              {...register('price', { required: true })} 
              type="number" 
              placeholder="Preço"
              className="w-full"
            />
            <p className="text-xs text-orange-500 mt-1">O Preço de mercado é 50mts/kg</p>
          </div>

          <div>
            <input 
              {...register('location', { required: true })} 
              type="text" 
              placeholder="Nametil"
              className="w-full"
            />
          </div>

          <div>
            <textarea 
              {...register('details')} 
              placeholder="Detalhes"
              rows={3}
              className="w-full resize-none"
            />
          </div>

          <button 
            type="submit" 
            className="w-full btn-gradient font-bold py-3 text-lg"
          >
            SUBMETER
          </button>
        </form>
      </div>
    </div>
  );
}
