'use client';

import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import clsx from 'clsx';
import apiClient from '@/lib/api/client';
import { useQueryClient } from '@tanstack/react-query';

interface AdvertiseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categories = ['PRODUTOS', 'TRANSPORTE', 'INSUMOS'] as const;
type Category = typeof categories[number];

export default function AdvertiseModal({ isOpen, onClose }: AdvertiseModalProps) {
  const [activeCategory, setActiveCategory] = useState<Category>('PRODUTOS');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset } = useForm();
  const queryClient = useQueryClient();

  if (!isOpen) return null;

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name,
        quantity: Number(data.quantity) || 0,
        price: Number(data.price) || 0,
        location: data.location,
      };

      if (activeCategory === 'PRODUTOS') {
        await apiClient.post('/products', { ...payload, category: 'PRODUTOS' });
        queryClient.invalidateQueries({ queryKey: ['products'] });
      } else if (activeCategory === 'INSUMOS') {
        await apiClient.post('/inputs', payload);
        queryClient.invalidateQueries({ queryKey: ['inputs'] });
      } else if (activeCategory === 'TRANSPORTE') {
        await apiClient.post('/transports', {
          transport_type: data.productType || 'Pick-up',
          name: data.name,
          price_per_km: Number(data.price) || 0,
          location: data.location,
        });
        queryClient.invalidateQueries({ queryKey: ['transports'] });
      }

      reset();
      onClose();
      alert('Anúncio publicado com sucesso!');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao publicar anúncio. Verifica se estás autenticado.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
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
      role="presentation"
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="advertise-modal-title"
        aria-describedby="advertise-modal-desc"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 id="advertise-modal-title" className="text-2xl font-bold">ANUNCIAR</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fechar diálogo de anunciar"
          >
            <X size={24} aria-hidden="true" />
          </button>
        </div>
        <p id="advertise-modal-desc" className="sr-only">Preencha o formulário para criar um novo anúncio no mercado Wamini.</p>

        {/* Category Tabs */}
        <div className="flex gap-2 p-4 border-b border-gray-200 overflow-x-auto" role="group" aria-label="Selecionar categoria do anúncio">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              aria-pressed={activeCategory === cat}
              aria-label={`Categoria: ${cat}${activeCategory === cat ? ' (selecionado)' : ''}`}
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
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4" aria-label="Formulário de criação de anúncio" noValidate>
          <div>
            <label htmlFor="adv-productType" className="sr-only">Tipo de produto</label>
            <select 
              id="adv-productType"
              {...register('productType')} 
              className="w-full"
              defaultValue="Produto Agrícola"
              aria-label="Selecione o tipo de produto"
            >
              <option value="Produto Agrícola">Produto Agrícola</option>
              <option value="Transporte">Transporte</option>
              <option value="Insumos">Insumos</option>
            </select>
          </div>

          <div>
            <label htmlFor="adv-name" className="sr-only">Nome do produto ou serviço</label>
            <input 
              id="adv-name"
              {...register('name', { required: true })} 
              type="text" 
              placeholder="Nome do produto ou serviço"
              className="w-full"
              aria-label="Nome do produto ou serviço"
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="adv-quantity" className="sr-only">Quantidade disponível</label>
            <input 
              id="adv-quantity"
              {...register('quantity', { required: true })} 
              type="text" 
              placeholder="Quantidade (ex: 50 kg)"
              className="w-full"
              aria-label="Quantidade disponível"
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="adv-price" className="sr-only">Preço em meticais</label>
            <input 
              id="adv-price"
              {...register('price', { required: true })} 
              type="number" 
              placeholder="Preço em meticais"
              className="w-full"
              aria-label="Preço em meticais"
              aria-required="true"
            />
            <p className="text-xs text-orange-500 mt-1" aria-live="polite">O Preço de mercado é 50mts/kg</p>
          </div>

          <div>
            <label htmlFor="adv-location" className="sr-only">Localização</label>
            <input 
              id="adv-location"
              {...register('location', { required: true })} 
              type="text" 
              placeholder="Localização (ex: Nametil)"
              className="w-full"
              aria-label="Localização onde o produto está disponível"
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="adv-details" className="sr-only">Detalhes adicionais</label>
            <textarea 
              id="adv-details"
              {...register('details')} 
              placeholder="Detalhes adicionais sobre o produto"
              rows={3}
              className="w-full resize-none"
              aria-label="Detalhes adicionais (opcional)"
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full btn-gradient font-bold py-3 text-lg flex items-center justify-center gap-2"
            aria-label="Submeter o anúncio ao mercado"
          >
            {isSubmitting ? <><Loader2 size={20} className="animate-spin" /> A publicar...</> : 'SUBMETER'}
          </button>
        </form>
      </div>
    </div>
  );
}
