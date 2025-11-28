'use client';

import { useState, useEffect, useCallback } from 'react';
import { productsService } from '@/lib/api/services/products';
import type { Product, ProductFilters, PaginatedResponse, PaginationParams } from '@/lib/api/types';

interface UseProductsReturn {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProducts(
  filters?: ProductFilters,
  pagination?: PaginationParams
): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(pagination?.page || 1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await productsService.getProducts(filters, pagination);
      setProducts(response.data);
      setTotal(response.total);
      setPage(response.page);
      setTotalPages(response.total_pages);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch products';
      setError(errorMessage);
      console.error('Failed to fetch products:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    total,
    page,
    totalPages,
    isLoading,
    error,
    refetch: fetchProducts,
  };
}

interface UseProductReturn {
  product: Product | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProduct(id: number | null): UseProductReturn {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await productsService.getProduct(id);
      setProduct(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch product';
      setError(errorMessage);
      console.error('Failed to fetch product:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return {
    product,
    isLoading,
    error,
    refetch: fetchProduct,
  };
}
