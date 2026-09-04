import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User, LoginCredentials, RegisterCredentials } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  isAuthModalOpen: boolean;
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  authModalInitialMode: 'login' | 'register';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'login' | 'register'>('login');
  const queryClient = useQueryClient();

  const restoreSession = useCallback(async () => {
    const token = api.getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await api.getMe();
      setUser(currentUser);
    } catch {
      // Token expired or invalid
      api.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = async (credentials: LoginCredentials) => {
    const response = await api.login(credentials);
    setUser(response.user);
    // Invalidate wardrobe queries so the new user's items and stats are fetched cleanly
    await queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
    await queryClient.invalidateQueries({ queryKey: ['wardrobe-stats'] });
    setIsAuthModalOpen(false);
  };

  const register = async (credentials: RegisterCredentials) => {
    const response = await api.register(credentials);
    setUser(response.user);
    // Invalidate wardrobe queries so fresh empty wardrobe is rendered
    await queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
    await queryClient.invalidateQueries({ queryKey: ['wardrobe-stats'] });
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    api.logout();
    setUser(null);
    // Invalidate wardrobe queries so guest or empty wardrobe is reset
    queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
    queryClient.invalidateQueries({ queryKey: ['wardrobe-stats'] });
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalInitialMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        authModalInitialMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
