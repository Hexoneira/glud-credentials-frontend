import { beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({
  token: null as string | null,
}));

vi.mock('../config', () => ({
  API_BASE_URL: 'http://test.local/api',
  API_TIMEOUT: 5000,
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: {
    getState: () => ({ token: authState.token }),
  },
}));

import { deleteTenant, fetchTenants, login } from './api';

function createJsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('api service', () => {
  beforeEach(() => {
    authState.token = null;
    vi.restoreAllMocks();
  });

  it('login usa /auth/login y normaliza token + usuario', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createJsonResponse({
        token: 'jwt-token',
        user: { id: '00000000000', role: 'super_admin', nombre: 'Root' },
      })
    );

    const result = await login({ id: '00000000000', password: 'secret' });

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://test.local/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ id: '00000000000', password: 'secret' }),
      })
    );
    expect(result.token).toBe('jwt-token');
    expect(result.user.role).toBe('super_admin');
  });

  it('fetchTenants envía Authorization cuando existe token', async () => {
    authState.token = 'my-jwt';
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(createJsonResponse([]));

    await fetchTenants();

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://test.local/api/tenants',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer my-jwt',
        }),
      })
    );
  });

  it('deleteTenant propaga mensaje del backend cuando falla', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createJsonResponse({ message: 'No autorizado' }, 403)
    );

    await expect(deleteTenant('tenant-1')).rejects.toThrow('No autorizado');
  });
});
