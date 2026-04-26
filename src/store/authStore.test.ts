import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.getState().logout();
  });

  it('should have initial state with null token and user', () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  it('should set authentication data correctly', () => {
    const mockUser = {
      id: '123',
      role: 'miembro',
      nombre: 'Test User'
    };
    const mockToken = 'mock-jwt-token';

    useAuthStore.getState().setAuth(mockToken, mockUser);

    const state = useAuthStore.getState();
    expect(state.token).toBe(mockToken);
    expect(state.user).toEqual(mockUser);
  });

  it('should update user partial data correctly', () => {
    const initialUser = {
      id: '123',
      role: 'miembro',
      nombre: 'Test User'
    };
    
    useAuthStore.getState().setAuth('mock-token', initialUser);

    // Update with extra fields
    const newFields = {
      totpSecret: 'SECRET123',
      tenantId: 'glud-tenant'
    };

    useAuthStore.getState().updateUser(newFields);

    const state = useAuthStore.getState();
    expect(state.user?.nombre).toBe('Test User'); // Preserves old
    expect(state.user?.totpSecret).toBe('SECRET123'); // Adds new
    expect(state.user?.tenantId).toBe('glud-tenant'); // Adds new
  });

  it('should clear state on logout', () => {
    useAuthStore.getState().setAuth('mock-token', { id: '1', role: 'admin' });
    
    useAuthStore.getState().logout();
    
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });
});
