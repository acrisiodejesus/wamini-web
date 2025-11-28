import apiClient from '../client';
import type {
  Product,
  CreateProductData,
  ProductFilters,
  ApiResponse,
  PaginatedResponse,
  PaginationParams
} from '../types';

export const productsService = {
  /**
   * Get all products with optional filters
   */
  async getProducts(
    filters?: ProductFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Product>> {
    try {
      const params = { ...filters, ...pagination };
      const response = await apiClient.get<Product[]>('/products', { params });

      console.log('Products API Response:', response.data);

      // The API returns an array directly, not wrapped in ApiResponse
      const products = Array.isArray(response.data) ? response.data : [];

      // Create a paginated response structure
      return {
        data: products,
        total: products.length,
        page: pagination?.page || 1,
        per_page: pagination?.per_page || 20,
        total_pages: Math.ceil(products.length / (pagination?.per_page || 20))
      };
    } catch (error: any) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  /**
   * Get single product by ID
   */
  async getProduct(id: number): Promise<Product> {
    try {
      const response = await apiClient.get<Product>(`/products/${id}`);
      console.log('Product API Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },

  /**
   * Create new product
   */
  async createProduct(data: CreateProductData): Promise<Product> {
    try {
      const response = await apiClient.post<Product>('/products', data);
      console.log('Create Product API Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  /**
   * Update existing product
   */
  async updateProduct(id: number, data: Partial<CreateProductData>): Promise<Product> {
    try {
      const response = await apiClient.put<Product>(`/products/${id}`, data);
      console.log('Update Product API Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  /**
   * Delete product
   */
  async deleteProduct(id: number): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },

  /**
   * Search products
   */
  async searchProducts(query: string, pagination?: PaginationParams): Promise<PaginatedResponse<Product>> {
    try {
      const params = { search: query, ...pagination };
      const response = await apiClient.get<Product[]>('/products/search', { params });

      console.log('Search Products API Response:', response.data);

      const products = Array.isArray(response.data) ? response.data : [];

      return {
        data: products,
        total: products.length,
        page: pagination?.page || 1,
        per_page: pagination?.per_page || 20,
        total_pages: Math.ceil(products.length / (pagination?.per_page || 20))
      };
    } catch (error: any) {
      console.error('Error searching products:', error);
      throw error;
    }
  },

  /**
   * Get products by category
   */
  async getProductsByCategory(category: string, pagination?: PaginationParams): Promise<PaginatedResponse<Product>> {
    try {
      const params = { category, ...pagination };
      const response = await apiClient.get<Product[]>('/products', { params });

      console.log('Products by Category API Response:', response.data);

      const products = Array.isArray(response.data) ? response.data : [];

      return {
        data: products,
        total: products.length,
        page: pagination?.page || 1,
        per_page: pagination?.per_page || 20,
        total_pages: Math.ceil(products.length / (pagination?.per_page || 20))
      };
    } catch (error: any) {
      console.error('Error fetching products by category:', error);
      throw error;
    }
  },

  /**
   * Get user's own products
   */
  async getMyProducts(pagination?: PaginationParams): Promise<PaginatedResponse<Product>> {
    try {
      const params = pagination;
      const response = await apiClient.get<Product[]>('/products/mine', { params });

      console.log('My Products API Response:', response.data);

      const products = Array.isArray(response.data) ? response.data : [];

      return {
        data: products,
        total: products.length,
        page: pagination?.page || 1,
        per_page: pagination?.per_page || 20,
        total_pages: Math.ceil(products.length / (pagination?.per_page || 20))
      };
    } catch (error: any) {
      console.error('Error fetching my products:', error);
      throw error;
    }
  },
};
