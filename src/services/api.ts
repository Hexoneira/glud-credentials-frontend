import { API_BASE_URL, API_TIMEOUT } from '../config';
import { useAuthStore, decodeJwtPayload } from '../store/authStore';
import type { User } from '../store/authStore';

export interface AuthLoginPayload {
  username: string;
  password: string;
}

export interface AuthLoginResponse {
  token: string;
  user: User;
}

export interface Tenant {
  id: string;
  name: string;
  tenantCode: string;
  director: string;
  memberLimit: number;
  currentMembers: number;
  status: 'ACTIVE' | 'SUSPENDED';
  primaryColor?: string;
  logoUrl?: string | null;
}

export interface CreateTenantPayload {
  name: string;
  tenantCode: string;
  director: string;
  memberLimit: number;
  primaryColor?: string;
  logoUrl?: string;
}

export interface UpdateTenantPayload {
  name?: string;
  director?: string;
  memberLimit?: number;
  primaryColor?: string;
  logoUrl?: string;
}

export interface MemberCurrent {
  id: string;
  name: string;
  email: string | null;
  role: string;
  groups: string[];
  icon: string | null;
  totpSecret: string | null;
  tenantName?: string;
  tenantCode?: string;
  primaryColor?: string;
  logoUrl?: string | null;
}

export type GuestStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface Guest {
  id: string;
  codigo: string;
  name: string;
  email: string | null;
  status: GuestStatus;
  tenantId: string;
  tenantName: string;
  tenantCode: string;
  primaryColor?: string;
  logoUrl?: string | null;
  createdById: string;
  createdByCodigo: string;
  createdAt: string;
  expiresAt: string | null;
  accessToken: string | null;
  totpSecret: string | null;
}

export interface CreateGuestPayload {
  codigo: string;
  name: string;
  email?: string;
}

export interface Member {
  id: string;
  codigo: string;
  username: string;
  email: string | null;
  rol: string;
  status: string;
  tenantId: string;
  tenantName: string;
}

function getAuthHeaders(): HeadersInit {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function createSignal(): AbortSignal {
  return AbortSignal.timeout(API_TIMEOUT);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

async function handleResponse<T>(response: Response): Promise<T> {
  // Read raw text first so we can diagnose invalid JSON responses
  const text = await response.text();

  if (!response.ok) {
    const errorData = ((): Record<string, unknown> => {
      try {
        return JSON.parse(text) as Record<string, unknown>;
      } catch {
        return {};
      }
    })();

    const message = readString((errorData as any).message) || `Error ${response.status}`;
    throw new Error(message);
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    console.error('[api] Invalid JSON response from', response.url, 'body:', text);
    throw new Error('Respuesta inválida del servidor (JSON parse error)', {
      cause: error instanceof Error ? error : undefined,
    });
  }
}

// Login para cualquier rol (incluyendo super_admin)
export async function login(payload: AuthLoginPayload): Promise<AuthLoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    signal: createSignal(),
    body: JSON.stringify(payload),
  });

  const data = await handleResponse<unknown>(response);
  if (!isRecord(data)) {
    throw new Error('Respuesta inválida del servidor');
  }

  const token = readString(data.token) || readString(data.accessToken);
  if (!token) {
    throw new Error('El backend no devolvió un token válido');
  }

  const user = decodeJwtPayload(token);

  return { token, user };
}

// Carnet del miembro autenticado
export async function fetchMemberCurrent(): Promise<MemberCurrent> {
  const response = await fetch(`${API_BASE_URL}/member/current`, {
    method: 'GET',
    headers: getAuthHeaders(),
    signal: createSignal(),
  });
  return handleResponse<MemberCurrent>(response);
}

// Invitados
export async function createGuest(payload: CreateGuestPayload): Promise<Guest> {
  const response = await fetch(`${API_BASE_URL}/guests`, {
    method: 'POST',
    headers: getAuthHeaders(),
    signal: createSignal(),
    body: JSON.stringify(payload),
  });
  return handleResponse<Guest>(response);
}

export async function fetchMyGuests(): Promise<Guest[]> {
  const response = await fetch(`${API_BASE_URL}/guests`, {
    method: 'GET',
    headers: getAuthHeaders(),
    signal: createSignal(),
  });
  return handleResponse<Guest[]>(response);
}

// Carnet público del invitado vía enlace temporal (sin token de sesión)
export async function fetchGuestAccess(token: string): Promise<Guest> {
  const response = await fetch(`${API_BASE_URL}/guests/access/${encodeURIComponent(token)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal: createSignal(),
  });
  return handleResponse<Guest>(response);
}

// Miembros del tenant (dashboard de admin)
export async function fetchMembers(tenantId?: string): Promise<Member[]> {
  const query = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : "";
  const response = await fetch(`${API_BASE_URL}/members${query}`, {
    method: "GET",
    headers: getAuthHeaders(),
    signal: createSignal(),
  });
  return handleResponse<Member[]>(response);
}

export interface CreateMemberPayload {
  codigo: string;
  password: string;
  email?: string | null;
  rol: string;
  tenantId?: string | null;
}

export async function createMember(payload: CreateMemberPayload): Promise<Member> {
  const response = await fetch(`${API_BASE_URL}/members`, {
    method: "POST",
    headers: getAuthHeaders(),
    signal: createSignal(),
    body: JSON.stringify(payload),
  });
  return handleResponse<Member>(response);
}

export interface UpdateMemberPayload {
  email?: string | null;
  rol?: string | null;
}

export async function updateMember(id: string, payload: UpdateMemberPayload): Promise<Member> {
  const response = await fetch(`${API_BASE_URL}/members/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    signal: createSignal(),
    body: JSON.stringify(payload),
  });
  return handleResponse<Member>(response);
}

export async function updateMemberStatus(id: string, status: string): Promise<Member> {
  const response = await fetch(`${API_BASE_URL}/members/${id}/status`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    signal: createSignal(),
    body: JSON.stringify({ status }),
  });
  return handleResponse<Member>(response);
}

export async function deleteMember(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/members/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    signal: createSignal(),
  });
  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    throw new Error(readString(errorData.message) || `Error ${response.status}`);
  }
}

// Tenants CRUD
export async function fetchTenants(): Promise<Tenant[]> {
  const response = await fetch(`${API_BASE_URL}/tenants`, {
    method: 'GET',
    headers: getAuthHeaders(),
    signal: createSignal(),
  });
  return handleResponse<Tenant[]>(response);
}

export async function createTenant(payload: CreateTenantPayload): Promise<Tenant> {
  const response = await fetch(`${API_BASE_URL}/tenants`, {
    method: 'POST',
    headers: getAuthHeaders(),
    signal: createSignal(),
    body: JSON.stringify(payload),
  });
  return handleResponse<Tenant>(response);
}

export async function updateTenant(id: string, payload: UpdateTenantPayload): Promise<Tenant> {
  const response = await fetch(`${API_BASE_URL}/tenants/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    signal: createSignal(),
    body: JSON.stringify(payload),
  });
  return handleResponse<Tenant>(response);
}

export async function suspendTenant(id: string): Promise<Tenant> {
  const response = await fetch(`${API_BASE_URL}/tenants/${id}/suspend`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    signal: createSignal(),
  });
  return handleResponse<Tenant>(response);
}

export async function reactivateTenant(id: string): Promise<Tenant> {
  const response = await fetch(`${API_BASE_URL}/tenants/${id}/reactivate`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    signal: createSignal(),
  });
  return handleResponse<Tenant>(response);
}

export async function deleteTenant(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/tenants/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    signal: createSignal(),
  });
  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    throw new Error(readString(errorData.message) || `Error ${response.status}`);
  }
}
