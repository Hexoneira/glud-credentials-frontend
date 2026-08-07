import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AppNav, { roleLabel } from './AppNav';
import { useAuthStore } from '../../store/authStore';

function mockLocation(pathname = '/carnet') {
  Object.defineProperty(globalThis, 'location', {
    value: { pathname, href: pathname, assign: vi.fn() },
    writable: true,
  });
}

describe('roleLabel', () => {
  it('traduce roles conocidos y el valor por defecto', () => {
    expect(roleLabel('TENANT_ADMIN')).toBe('Admin');
    expect(roleLabel('SUPER_ADMIN')).toBe('Super Admin');
    expect(roleLabel('MIEMBRO')).toBe('Miembro');
    expect(roleLabel('OTRO')).toBe('Invitado');
  });
});

describe('AppNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().logout();
    mockLocation('/carnet');
  });

  it('muestra enlaces base para un MIEMBRO', () => {
    useAuthStore.getState().setAuth('tok', { id: '10', role: 'MIEMBRO', name: 'Miembro' });
    render(<AppNav />);

    expect(screen.getByText('Carnet')).toBeInTheDocument();
    expect(screen.getByText('Invitados')).toBeInTheDocument();
    expect(screen.queryByText('Mi grupo')).not.toBeInTheDocument();
    expect(screen.queryByText('Grupos')).not.toBeInTheDocument();
  });

  it('agrega Mi grupo para TENANT_ADMIN y Grupos para SUPER_ADMIN', () => {
    useAuthStore.getState().setAuth('tok', { id: '11', role: 'TENANT_ADMIN', name: 'Admin' });
    const { rerender } = render(<AppNav />);

    expect(screen.getByText('Mi grupo')).toBeInTheDocument();
    expect(screen.queryByText('Grupos')).not.toBeInTheDocument();

    useAuthStore.getState().setAuth('tok2', { id: '12', role: 'SUPER_ADMIN', name: 'Super' });
    rerender(<AppNav />);

    expect(screen.getByText('Grupos')).toBeInTheDocument();
  });

  it('marca la ruta activa con aria-current', () => {
    useAuthStore.getState().setAuth('tok', { id: '10', role: 'MIEMBRO', name: 'Miembro' });
    mockLocation('/invitados');
    render(<AppNav />);

    const invitados = screen.getByText('Invitados');
    expect(invitados.getAttribute('aria-current')).toBe('page');
    expect(screen.getByText('Carnet').getAttribute('aria-current')).toBeNull();
  });

  it('cierra sesión: limpia el store y redirige a /', () => {
    useAuthStore.getState().setAuth('tok', { id: '10', role: 'MIEMBRO', name: 'Miembro' });
    mockLocation('/carnet');
    render(<AppNav />);

    screen.getByText('Cerrar sesión').click();

    expect(useAuthStore.getState().token).toBeNull();
    expect(globalThis.location.href).toBe('/');
    useAuthStore.getState().logout();
  });
});
