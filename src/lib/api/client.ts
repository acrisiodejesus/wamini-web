import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Em server-side (SSR) o axios precisa de URL absoluta.
// Em client-side, /api/v1 é suficiente (relativo ao origin).
function getBaseURL(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';

  // 1. Em client-side (browser), ignora domínios hardcoded (ex: localhost que tenha vindo no .env)
  // e força SEMPRE a usar o mesmo origin (wamini.co.mz)
  if (typeof window !== 'undefined') {
    let path = envUrl;
    if (envUrl.startsWith('http')) {
      try {
        path = new URL(envUrl).pathname;
      } catch (e) {
        path = '/api/v1';
      }
    }
    return `${window.location.origin}${path}`;
  }

  // 2. Em SSR (Node.js), precisa de URL absoluta para comunicar no container
  if (envUrl.startsWith('http')) return envUrl;

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    `http://localhost:${process.env.PORT || 3000}`;
  return `${appUrl}${envUrl}`;
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - attach JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Recalcular baseURL em cada request (o window.location pode mudar)
    if (typeof window !== 'undefined' && config.baseURL?.startsWith('/')) {
      config.baseURL = `${window.location.origin}${config.baseURL}`;
    }
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      clearToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }

    return Promise.reject(error);
  }
);

// ─── Token management ─────────────────────────────────────────────────────────
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('wamini_token');
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('wamini_token', token);
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('wamini_token');
  localStorage.removeItem('wamini_user');
}

export function getStoredUser(): any | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('wamini_user');
  return userStr ? JSON.parse(userStr) : null;
}

export function setStoredUser(user: any): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('wamini_user', JSON.stringify(user));
}

export default apiClient;
