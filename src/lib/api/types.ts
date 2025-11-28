// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// User types
export interface User {
  id: number;
  name: string;
  email: string;
  mobile_number?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  mobile_number?: string;
  address?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Product types
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  quantity?: number;
  location?: string;
  images?: string[];
  user_id: number;
  user?: User;
  created_at: string;
  updated_at: string;
}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  quantity?: number;
  location?: string;
  images?: string[];
}

export interface ProductFilters {
  category?: string;
  min_price?: number;
  max_price?: number;
  location?: string;
  search?: string;
}

// Input types (agricultural inputs)
export interface Input {
  id: number;
  name: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  quantity?: number;
  location?: string;
  images?: string[];
  user_id: number;
  user?: User;
  created_at: string;
  updated_at: string;
}

export interface CreateInputData {
  name: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  quantity?: number;
  location?: string;
  images?: string[];
}

// Transport types
export interface Transport {
  id: number;
  title: string;
  description: string;
  vehicle_type: string;
  capacity: string;
  price_per_km?: number;
  available_from: string;
  available_to: string;
  location?: string;
  user_id: number;
  user?: User;
  created_at: string;
  updated_at: string;
}

export interface CreateTransportData {
  title: string;
  description: string;
  vehicle_type: string;
  capacity: string;
  price_per_km?: number;
  available_from: string;
  available_to: string;
  location?: string;
}

// Negotiation/Chat types
export interface Negotiation {
  id: number;
  product_id?: number;
  product?: Product;
  buyer_id: number;
  buyer?: User;
  seller_id: number;
  seller?: User;
  status: 'active' | 'closed' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  negotiation_id: number;
  sender_id: number;
  sender?: User;
  message: string;
  created_at: string;
}

export interface CreateNegotiationData {
  product_id: number;
  message: string;
}

export interface SendMessageData {
  message: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  per_page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
