// src/store/authStore.ts
import { create } from 'zustand';

interface User {
  kullanici_id: number;
  ad_soyad: string;
  email: string;
  rol: string;
  access_token: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: (() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  })(),
  isAuthenticated: !!localStorage.getItem('token'),

  login: (userData: User) => {
    localStorage.setItem('token', userData.access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    set({ user: userData, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },
}));