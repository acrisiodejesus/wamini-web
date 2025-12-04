// User types
export interface User {
  id: number;
  name: string;
  localization?: string;
  mobile_number: string;
  photo?: string;
}

export interface UserProfile extends User {
  // Profile endpoint returns same fields as User
}

export interface RegisterData {
  name: string;
  localization?: string;
  mobile_number: string;
  password: string;
  photo?: string;
}

export interface LoginData {
  mobile_number: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: number;
    name: string;
  };
}

export interface RegisterResponse {
  message: string;
  user_id: number;
}

// Product types
export interface Product {
  id: number;
  name: string;
  quantity: number;
  price: number;
  photo?: string;
  publish_date: string;
  user_id: number;
}

export interface CreateProductData {
  name: string;
  quantity: number;
  price: number;
  photo?: string;
}

// Input types (agricultural inputs)
export interface Input {
  id: number;
  name: string;
  quantity: number;
  price: number;
  photo?: string;
  publish_date: string;
  user_id: number;
}

export interface CreateInputData {
  name: string;
  quantity: number;
  price: number;
  photo?: string;
}

// Transport types
export interface Transport {
  id: number;
  transport_type: string;
  name: string;
  price_per_km: number;
  photo?: string;
  user_id: number;
}

export interface CreateTransportData {
  transport_type: string;
  name: string;
  price_per_km: number;
  photo?: string;
}

// Negotiation/Chat types
export interface Negotiation {
  id: number;
  messages: any[]; // Array of message objects
  created_at: string;
  product_id?: number;
  input_id?: number;
  transport_id?: number;
}

export interface Message {
  id: number;
  sender_id: number;
  body: string;
  timestamp: string;
}

export interface CreateNegotiationData {
  product_id?: number;
  input_id?: number;
  transport_id?: number;
  messages?: any[];
}

export interface SendMessageData {
  body: string;
}

export interface MessageResponse {
  message: string;
  data: Message;
}
