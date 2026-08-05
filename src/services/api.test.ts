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
  createGuest,
  createTenant,
  deleteTenant,
  fetchGuestAccess,
  fetchMemberCurrent,
  fetchMembers,
  fetchMyGuests,
  fetchTenants,
  login,
  reactivateTenant,
  suspendTenant,
  updateTenant,
} from './api';
import { API_BASE_URL } from '../config';

vi.mock('../store/authStore', () => {
  const toBase64Url = (obj: unknown) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

  return {
    useAuthStore: {
      getState: () => ({ token: authState.token }),
    },
    decodeJwtPayload: (token: string) => {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Token JWT inválido');
      let payload = parts[1];
      payload = payload.replace(/-/g, '+').replace(/_/g, '/');
      while (payload.length % 4 !== 0) payload += '=';
      const decoded = atob(payload);
      const data = JSON.parse(decoded);
      if (!data.sub || typeof data.sub !== 'string') {
        throw new Error('Token JWT inválido');
      }
      return {
        id: data.sub,
        role: data.roleId ?? 'INVITADO',
        tenantId: data.tenantId != null ? String(data.tenantId) : undefined,
      };
    },
  };
});

function createJsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function createFakeJwt(payload: Record<string, unknown>): string {
  const toBase64Url = (obj: unknown) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  const header = toBase64Url({ alg: 'HS256', typ: 'JWT' });
  const body = toBase64Url(payload);
  return `${header}.${body}.fakesignature`;
}

describe('api service', () => {
  beforeEach(() => {
    authState.token = null;
    vi.restoreAllMocks();
  });

  it('login usa /auth/login con username y decodifica JWT', async () => {
    const fakeToken = createFakeJwt({ sub: '00000000000', roleId: 'SUPER_ADMIN', tenantId: '1' });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createJsonResponse({ token: fakeToken })
    );

    const result = await login({ username: '00000000000', password: 'secret' });

    expect(fetchSpy).toHaveBeenCalledWith(
      `${API_BASE_URL}/auth/login`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ username: '00000000000', password: 'secret' }),
      })
    );
    expect(result.token).toBe(fakeToken);
    expect(result.user.role).toBe('SUPER_ADMIN');
    expect(result.user.id).toBe('00000000000');
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

  it('fetchMemberCurrent consume /member/current y devuelve la credencial con totpSecret', async () => {
    authState.token = 'my-jwt';
    const member = {
      id: '20210000000',
      name: '20210000000',
      email: 'miembro@udistrital.edu.co',
      role: 'MIEMBRO',
      groups: ['GLUD'],
      icon: null,
      totpSecret: '4ljjwnrzlorsnlhdmitrl4rubdftyhc64bt3qqsnhjbdbq2uqyhq',
    };
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(createJsonResponse(member));

    const result = await fetchMemberCurrent();

    expect(fetchSpy).toHaveBeenCalledWith(
      `${API_BASE_URL}/member/current`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer my-jwt',
        }),
      })
    );
    expect(result).toEqual(member);
    expect(result.totpSecret).toBe(member.totpSecret);
  });

  it('login acepta accessToken y decodifica del JWT', async () => {
    const fakeToken = createFakeJwt({ sub: '20232020172', roleId: 'SUPER_ADMIN', tenantId: '1' });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createJsonResponse({ accessToken: fakeToken })
    );

    const result = await login({ username: '20232020172', password: 'secret' });

    expect(result.token).toBe(fakeToken);
    expect(result.user.id).toBe('20232020172');
    expect(result.user.role).toBe('SUPER_ADMIN');
  });

  it('login rechaza respuestas sin token', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createJsonResponse({ success: true })
    );

    await expect(login({ username: '1', password: 'secret' })).rejects.toThrow(
      'El backend no devolvió un token válido'
    );
  });

  it('login asigna INVITADO cuando JWT no tiene roleId', async () => {
    const fakeToken = createFakeJwt({ sub: '1' });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createJsonResponse({ token: fakeToken })
    );

    const result = await login({ username: '1', password: 'secret' });
    expect(result.user.role).toBe('INVITADO');
  });

  it('createTenant, updateTenant, suspendTenant y reactivateTenant usan Authorization', async () => {
    authState.token = 'jwt-auth';

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(createJsonResponse({ id: 't-1' })) as Promise<Response>);

    await createTenant({ name: 'A', tenantCode: 'AA', director: 'Directora', memberLimit: 10 });
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

    await expect(login({ username: '00000000000', password: 'secret' })).rejects.toThrow(
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

  it('createGuest hace POST a /guests con Authorization y body', async () => {
    authState.token = 'jwt-auth';
    const guest = {
      id: '2',
      codigo: '101011000',
      name: 'Invitada Uno',
      status: 'ACTIVE',
      accessToken: 'tok',
      expiresAt: '2026-08-05T20:35:27',
      totpSecret: null,
    };
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(createJsonResponse(guest, 201));

    const result = await createGuest({ codigo: '101011000', name: 'Invitada Uno', email: 'inv@mail.com' });

    expect(fetchSpy).toHaveBeenCalledWith(
      `${API_BASE_URL}/guests`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-auth' }),
        body: JSON.stringify({ codigo: '101011000', name: 'Invitada Uno', email: 'inv@mail.com' }),
      })
    );
    expect(result.accessToken).toBe('tok');
  });

  it('fetchMyGuests consume GET /guests con Authorization', async () => {
    authState.token = 'jwt-auth';
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(createJsonResponse([]));

    await fetchMyGuests();

    expect(fetchSpy).toHaveBeenCalledWith(
      `${API_BASE_URL}/guests`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-auth' }),
      })
    );
  });

  it('fetchGuestAccess NO envía Authorization (enlace público)', async () => {
    authState.token = 'jwt-auth';
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createJsonResponse({ id: '2', codigo: '101011000', status: 'ACTIVE' })
    );

    await fetchGuestAccess('tok-123');

    expect(fetchSpy).toHaveBeenCalledWith(
      `${API_BASE_URL}/guests/access/tok-123`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.not.objectContaining({ Authorization: expect.any(String) }),
      })
    );
  });

  it('fetchGuestAccess propaga mensaje de enlace expirado', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createJsonResponse({ message: 'El enlace de acceso del invitado ha expirado' }, 410)
    );

    await expect(fetchGuestAccess('vencido')).rejects.toThrow('El enlace de acceso del invitado ha expirado');
  });

  it('fetchMembers consume GET /members con Authorization', async () => {
    authState.token = 'jwt-auth';
    const members = [{ id: '1', codigo: '20210000001', username: '20210000001', rol: 'MIEMBRO', status: 'ACTIVE' }];
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(createJsonResponse(members));

    const result = await fetchMembers();

    expect(fetchSpy).toHaveBeenCalledWith(
      `${API_BASE_URL}/members`,
      expect.objectContaining({ method: 'GET' })
    );
    expect(result).toEqual(members);
  });
});
