import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore, decodeJwtPayload } from './authStore';

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
      role: 'MIEMBRO',
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
      role: 'MIEMBRO',
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

  it('should return null if updateUser is called without a logged-in user', () => {
    // Asegurarse de que no hay usuario
    useAuthStore.getState().logout();
    
    useAuthStore.getState().updateUser({ nombre: 'Intento' });
    
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
  });

  it('should clear state on logout', () => {
    useAuthStore.getState().setAuth('mock-token', { id: '1', role: 'SUPER_ADMIN' });
    
    useAuthStore.getState().logout();
    
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });
});

describe('decodeJwtPayload', () => {
  function createFakeJwt(payload: Record<string, unknown>): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    return `${header}.${body}.fakesignature`;
  }

  it('decodes userId, role and tenantId from JWT', () => {
    const token = createFakeJwt({ sub: '42', roleId: 'SUPER_ADMIN', tenantId: 10 });
    const user = decodeJwtPayload(token);

    expect(user.id).toBe('42');
    expect(user.role).toBe('SUPER_ADMIN');
    expect(user.tenantId).toBe('10');
  });

  it('defaults role to INVITADO when roleId is missing', () => {
    const token = createFakeJwt({ sub: '1' });
    const user = decodeJwtPayload(token);

    expect(user.id).toBe('1');
    expect(user.role).toBe('INVITADO');
    expect(user.tenantId).toBeUndefined();
  });

  it('converts numeric tenantId to string', () => {
    const token = createFakeJwt({ sub: '5', tenantId: 99 });
    const user = decodeJwtPayload(token);

    expect(user.tenantId).toBe('99');
  });

  it('throws on invalid JWT format', () => {
    expect(() => decodeJwtPayload('not-a-jwt')).toThrow('Token JWT inválido');
  });
});
