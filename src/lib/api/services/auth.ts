import apiClient, { setToken, clearToken, setStoredUser, getStoredUser } from '../client';
import type { LoginData, RegisterData, AuthResponse, UserProfile, RegisterResponse } from '../types';

export const authService = {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<RegisterResponse> {
    try {
      const response = await apiClient.post<RegisterResponse>('/users/register', data);
      console.log('Register API Response:', response.data);

      // Backend returns { message, user_id } - no token yet
      return response.data;
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

      // Backend returns access_token, not token
      if (authData.access_token) {
        setToken(authData.access_token);
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
  async getCurrentUser(): Promise<UserProfile> {
    try {
      const response = await apiClient.get<UserProfile>('/users/profile');
      console.log('Get Current User API Response:', response.data);

      // Update stored user with profile data
      setStoredUser(response.data);

      return response.data;
    } catch (error: any) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },

  /**
   * Get stored user from localStorage
   */
  getStoredUser(): UserProfile | null {
    return getStoredUser();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!getStoredUser();
  },
};

