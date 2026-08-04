import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  role: string;
  tenantId?: string;
  nombre?: string;
  name?: string;
  email?: string;
  codigo?: string;
  groups?: string[];
  icon?: string;
  totpSecret?: string;
}

interface JwtPayload {
  sub: string;
  tenantId?: string | number;
  roleId?: string;
  exp?: number;
  iat?: number;
}

export function decodeJwtPayload(token: string): User {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Token JWT inválido');
  }
  const payload = parts[1];
  const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  const data = JSON.parse(decoded) as JwtPayload;

  return {
    id: data.sub,
    role: data.roleId ?? 'INVITADO',
    tenantId: data.tenantId != null ? String(data.tenantId) : undefined,
  };
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
