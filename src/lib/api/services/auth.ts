import apiClient, { setToken, clearToken, setStoredUser, getStoredUser } from '../client';
import type { LoginData, RegisterData, AuthResponse, User, ApiResponse } from '../types';

export const authService = {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/users/register', data);
      console.log('Register API Response:', response.data);

      const authData = response.data;

      if (authData.token) {
        setToken(authData.token);
        setStoredUser(authData.user);
      }

      return authData;
    } catch (error: any) {
      console.error('Error during registration:', error);
      throw error;
    }
  },

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/users/login', data);
      console.log('Login API Response:', response.data);

      const authData = response.data;

      if (authData.token) {
        setToken(authData.token);
        setStoredUser(authData.user);
      }

      return authData;
    } catch (error: any) {
      console.error('Error during login:', error);
      throw error;
    }
  },

  /**
   * Logout user
   */
  logout(): void {
    clearToken();
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<User>('/users/me');
      console.log('Get Current User API Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put<User>('/users/profile', data);
      console.log('Update Profile API Response:', response.data);
      setStoredUser(response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  /**
   * Get stored user from localStorage
   */
  getStoredUser(): User | null {
    return getStoredUser();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!getStoredUser();
  },
};
