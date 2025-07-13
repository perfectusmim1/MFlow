'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<boolean>;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
  updateUserFavorites: (favorites: string[]) => void;
  updateUserAvatar: (avatarUrl: string) => void;
  isAdmin: boolean;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // İlk yükleme - token kontrolü
  useEffect(() => {
    checkAuth();
  }, []); // Dependency array'i boş bırak, sadece mount'ta çalışsın

  // Periyodik token kontrolü için ayrı useEffect
  useEffect(() => {
    // Her 5 dakikada bir token kontrolü yap
    const interval = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token && user) {
        checkAuth();
      }
    }, 5 * 60 * 1000); // 5 dakika

    return () => clearInterval(interval);
  }, [user]); // Sadece user değiştiğinde interval'ı yeniden kur

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        // API response'unda user field'ı direkt olabilir veya data içinde olabilir
        const finalUser = userData.user || userData.data;
        setUser(finalUser);
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        setUser(null);
      }
      // 401 dışındaki hatalarda token'ı silme, network hatası olabilir
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('token', data.data.token);
        setUser(data.data.user);
        return true;
      } else {
        console.error('Login failed:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('token', data.data.token);
        setUser(data.data.user);
        return true;
      } else {
        console.error('Register error:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = async (userData: Partial<User>): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const response = await fetch('/api/auth/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser({ ...user, ...userData } as User);
        return true;
      } else {
        console.error('Update error:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Update error:', error);
      return false;
    }
  };

  // Favoriler güncellemesi için özel fonksiyon
  const updateUserFavorites = (favorites: string[]) => {
    if (user) {
      setUser({ ...user, favorites });
    }
  };

  // Avatar güncellemesi için özel fonksiyon
  const updateUserAvatar = (avatarUrl: string) => {
    if (user) {
      setUser({ ...user, avatar: avatarUrl });
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        register,
        updateUser,
        updateUserFavorites,
        updateUserAvatar,
        isAdmin,
      }}
    >
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