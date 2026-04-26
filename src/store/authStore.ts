import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string | number;
  codigo?: string;
  nombre?: string;
  role: string;
  tenantId?: string;
  totpSecret?: string; // Nuevo campo para el secreto real del backend
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  updateUser: (userData: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      })),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
