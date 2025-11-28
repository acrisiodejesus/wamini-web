import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://wamini-api.onrender.com/api/v1';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - attach JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const newToken = await refreshToken();
        if (newToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear token and redirect to login
        clearToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Token management functions
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

// Refresh token function (placeholder - adjust based on actual API)
async function refreshToken(): Promise<string | null> {
  try {
    const token = getToken();
    if (!token) return null;

    const response = await axios.post(
      `${API_BASE_URL}/users/refresh`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('Refresh Token API Response:', response.data);

    // Handle direct response
    const newToken = response.data?.token || response.data?.access_token;
    if (newToken) {
      setToken(newToken);
      return newToken;
    }

    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

export default apiClient;
