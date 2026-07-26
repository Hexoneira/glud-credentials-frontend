import { beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => {
  const state: { token: string | null } = { token: null };
  return state;
});

vi.mock('../config', () => ({
  API_BASE_URL: 'http://test.local/api',
  API_TIMEOUT: 5000,
}));

import {
  createTenant,
  deleteTenant,
  fetchTenants,
  login,
  reactivateTenant,
  suspendTenant,
  updateTenant,
} from './api';
import { API_BASE_URL } from '../config';

vi.mock('../store/authStore', () => ({
  useAuthStore: {
    getState: () => ({ token: authState.token }),
  },
}));

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
      `${API_BASE_URL}/auth/login`,
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
      `${API_BASE_URL}/tenants`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer my-jwt',
        }),
      })
    );
  });

  it('login acepta accessToken y usuario en nivel superior', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createJsonResponse({
        accessToken: 'alt-token',
        id: '20232020172',
        role: 'super_admin',
        nombre: 'Root',
      })
    );

    const result = await login({ id: '20232020172', password: 'secret' });

    expect(result.token).toBe('alt-token');
    expect(result.user.id).toBe('20232020172');
    expect(result.user.role).toBe('super_admin');
  });

  it('login rechaza respuestas sin token', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createJsonResponse({ user: { id: '1', role: 'member' } })
    );

    await expect(login({ id: '1', password: 'secret' })).rejects.toThrow(
      'El backend no devolvió un token válido'
    );
  });

  it('login rechaza usuarios sin rol', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createJsonResponse({
        token: 'jwt-token',
        user: { id: '1' },
      })
    );

    await expect(login({ id: '1', password: 'secret' })).rejects.toThrow(
      'El backend no devolvió el rol del usuario'
    );
  });

  it('createTenant, updateTenant, suspendTenant y reactivateTenant usan Authorization', async () => {
    authState.token = 'jwt-auth';

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(createJsonResponse({ id: 't-1' })) as Promise<Response>);

    await createTenant({ name: 'A', tenantCode: 'AA', memberLimit: 10 });
    await updateTenant('t-1', { name: 'B' });
    await suspendTenant('t-1');
    await reactivateTenant('t-1');

    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      `${API_BASE_URL}/tenants`,
      expect.objectContaining({ method: 'POST', headers: expect.objectContaining({ Authorization: 'Bearer jwt-auth' }) })
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      `${API_BASE_URL}/tenants/t-1`,
      expect.objectContaining({ method: 'PUT', headers: expect.objectContaining({ Authorization: 'Bearer jwt-auth' }) })
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      3,
      `${API_BASE_URL}/tenants/t-1/suspend`,
      expect.objectContaining({ method: 'PATCH', headers: expect.objectContaining({ Authorization: 'Bearer jwt-auth' }) })
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      4,
      `${API_BASE_URL}/tenants/t-1/reactivate`,
      expect.objectContaining({ method: 'PATCH', headers: expect.objectContaining({ Authorization: 'Bearer jwt-auth' }) })
    );
  });

  it('deleteTenant resuelve sin error cuando el backend responde bien', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 204, json: async () => ({}) } as unknown as Response);

    await expect(deleteTenant('tenant-1')).resolves.toBeUndefined();
  });

  it('deleteTenant propaga mensaje del backend cuando falla', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createJsonResponse({ message: 'No autorizado' }, 403)
    );

    await expect(deleteTenant('tenant-1')).rejects.toThrow('No autorizado');
  });

  it('login falla con un mensaje claro cuando el backend devuelve JSON inválido', async () => {
    const invalidJson = '{"success":true,"token":"jwt","user":{"id":1,"role":"super_admin"},"codigo":00000000000}';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(invalidJson, {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await expect(login({ id: '00000000000', password: 'secret' })).rejects.toThrow(
      'Respuesta inválida del servidor (JSON parse error)'
    );
  });

  it('handleResponse lanza mensaje por status cuando el body no es JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('<html>error</html>', { status: 500, headers: { 'Content-Type': 'text/html' } })
    );

    await expect(fetchTenants()).rejects.toThrow('Error 500');
  });

  it('handleResponse usa el mensaje en JSON cuando existe', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createJsonResponse({ message: 'Servicio caído' }, 503)
    );

    await expect(fetchTenants()).rejects.toThrow('Servicio caído');
  });
});
