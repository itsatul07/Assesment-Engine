'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUser, logout as logoutAuth, isAuthenticated as checkAuth } from '@/lib/auth';

interface User {
  id: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (name: string, password: string) => Promise<void>;
  register: (name: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  const refreshAuth = () => {
    const storedUser = getUser();
    const storedAuth = checkAuth();
    setUser(storedUser);
    setIsAuth(storedAuth);
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const login = async (name: string, password: string) => {
    const { login: authLogin } = await import('@/lib/auth');
    await authLogin(name, password);
    refreshAuth();
  };

  const register = async (name: string, password: string) => {
    const { register: authRegister } = await import('@/lib/auth');
    await authRegister(name, password);
    refreshAuth();
  };

  const logout = () => {
    logoutAuth();
    setUser(null);
    setIsAuth(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: isAuth ?? false,
      isLoading: isAuth === null,
      login,
      register,
      logout,
      refreshAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}