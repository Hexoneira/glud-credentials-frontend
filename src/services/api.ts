import { API_BASE_URL, API_TIMEOUT } from '../config';
import { useAuthStore } from '../store/authStore';

export interface AuthUser {
  id: string | number;
  role: string;
  nombre?: string;
  name?: string;
  email?: string;
  codigo?: string;
  tenantId?: string;
}

export interface AuthLoginPayload {
  id: string;
  password: string;
}

export interface AuthLoginResponse {
  token: string;
  user: AuthUser;
}

export interface Tenant {
  id: string;
  name: string;
  tenantCode: string;
  director?: string;
  memberLimit: number;
  currentMembers: number;
  status: 'ACTIVE' | 'SUSPENDED';
}

export interface CreateTenantPayload {
  name: string;
  tenantCode: string;
  memberLimit: number;
}

export interface UpdateTenantPayload {
  name?: string;
  memberLimit?: number;
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
  } catch (err) {
    // Log the raw (possibly-invalid) body to help debugging (CORS/proxy/backend formatting issues)
    // eslint-disable-next-line no-console
    console.error('[api] Invalid JSON response from', response.url, 'body:', text);
    throw new Error('Respuesta inválida del servidor (JSON parse error)');
  }
}

function normalizeAuthUser(value: unknown): AuthUser {
  if (!isRecord(value)) {
    throw new Error('Formato de usuario inválido en la respuesta del login');
  }

  const role = readString(value.role);
  if (!role) {
    throw new Error('El backend no devolvió el rol del usuario');
  }

  const rawId = value.id;
  if (typeof rawId !== 'string' && typeof rawId !== 'number') {
    throw new TypeError('El backend no devolvió un ID de usuario válido');
  }

  return {
    id: rawId,
    role,
    nombre: readString(value.nombre),
    name: readString(value.name),
    email: readString(value.email),
    codigo: readString(value.codigo),
    tenantId: readString(value.tenantId),
  };
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

  const user = normalizeAuthUser(data.user ?? data);

  return { token, user };
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
