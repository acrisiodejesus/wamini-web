'use client';

import { useState, useEffect, useCallback } from 'react';
import { authService } from '@/lib/api/services/auth';
import type { User, LoginData, RegisterData } from '@/lib/api/types';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedUser = authService.getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  // Login
  const login = useCallback(async (data: LoginData) => {
    setIsLoading(true);
    setError(null);
    try {
      const authResponse = await authService.login(data);
      // Login response only has partial user data (id, name)
      // Fetch full profile to get mobile_number and other fields
      const fullUser = await authService.getCurrentUser();
      setUser(fullUser);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register
  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.register(data);
      // Register response only has user_id
      // User needs to login after registration
      // So we don't set user here, registration page should redirect to login
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!authService.isAuthenticated()) return;

    setIsLoading(true);
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (err: any) {
      console.error('Failed to refresh user:', err);
      // If refresh fails, logout
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshUser,
  };
}
