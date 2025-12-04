'use client';

import { useState, useEffect, useCallback } from 'react';
import { productsService } from '@/lib/api/services/products';
import type { Product } from '@/lib/api/types';

interface UseProductsReturn {
  products: Product[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProducts(
  filters?: { category?: string; search?: string },
  pagination?: { page?: number; per_page?: number }
): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await productsService.getProducts();
      setProducts(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch products';
      setError(errorMessage);
      console.error('Failed to fetch products:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    total: products.length,
    isLoading,
    error,
    refetch: fetchProducts,
  };
}

// Note: Backend doesn't support fetching single product by ID
// If needed, filter from the products array instead

