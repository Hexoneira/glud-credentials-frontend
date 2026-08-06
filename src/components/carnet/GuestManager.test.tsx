import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GuestManager from './GuestManager';
import { createGuest, fetchMyGuests } from '../../services/api';

vi.mock('../../services/api', () => ({
  createGuest: vi.fn(),
  fetchMyGuests: vi.fn(),
}));

vi.mock('../../utils/theme', () => ({
  applyTenantTheme: vi.fn(),
}));

const activeGuest = {
  id: '2',
  codigo: '101011000',
  name: 'Invitada Uno',
  email: null,
  status: 'ACTIVE',
  tenantId: '1',
  tenantName: 'GLUD',
  tenantCode: 'GLUD',
  primaryColor: '#22fefb',
  logoUrl: null,
  createdById: '10',
  createdByCodigo: '20210000001',
  createdAt: '2026-08-05T18:00:00',
  expiresAt: '2026-08-05T20:00:00',
  accessToken: 'tok-123',
  totpSecret: null,
};

describe('GuestManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchMyGuests).mockResolvedValue([] as never);
  });

  it('muestra el registro de invitados cargado desde la API', async () => {
    vi.mocked(fetchMyGuests).mockResolvedValue([activeGuest] as never);

    render(<GuestManager />);

    expect(await screen.findByText('Invitada Uno')).toBeInTheDocument();
    expect(screen.getByText('101011000')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  it('muestra estado vacío cuando no hay invitados', async () => {
    render(<GuestManager />);

    expect(await screen.findByText('Aún no has creado invitados')).toBeInTheDocument();
  });

  it('crea un invitado, muestra el enlace y lo agrega al registro', async () => {
    vi.mocked(createGuest).mockResolvedValue(activeGuest as never);
    vi.mocked(fetchMyGuests).mockResolvedValue([] as never);

    render(<GuestManager />);

    fireEvent.click(screen.getByText('+ Invitar'));

    fireEvent.change(screen.getByLabelText(/Código/i), { target: { value: '101011000' } });
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Invitada Uno' } });

    fireEvent.click(screen.getByText('Crear invitado'));

    await waitFor(() => {
      expect(createGuest).toHaveBeenCalledWith({ codigo: '101011000', name: 'Invitada Uno', email: undefined });
    });

    expect(await screen.findByText(/invitado\?token=tok-123/i)).toBeInTheDocument();
    expect(screen.getByText(/Invitado creado/)).toBeInTheDocument();
  });

  it('muestra error cuando ya existe un invitado activo (409)', async () => {
    const error = new Error('El miembro ya tiene un invitado activo') as Error & { status?: number };
    error.status = 409;
    vi.mocked(createGuest).mockRejectedValue(error);

    render(<GuestManager />);

    fireEvent.click(screen.getByText('+ Invitar'));
    fireEvent.change(screen.getByLabelText(/Código/i), { target: { value: '101011000' } });
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Invitada Uno' } });
    fireEvent.click(screen.getByText('Crear invitado'));

    expect(await screen.findByText('El miembro ya tiene un invitado activo')).toBeInTheDocument();
  });

  it('valida campos obligatorios antes de crear', async () => {
    render(<GuestManager />);

    fireEvent.click(screen.getByText('+ Invitar'));
    fireEvent.click(screen.getByText('Crear invitado'));

    expect(await screen.findByText('Código y nombre son obligatorios')).toBeInTheDocument();
    expect(createGuest).not.toHaveBeenCalled();
  });

  it('muestra error de límite (403) y permite cancelar el formulario', async () => {
    const error = new Error('Se alcanzó el máximo de invitados activos') as Error & { status?: number };
    error.status = 403;
    vi.mocked(createGuest).mockRejectedValue(error);

    render(<GuestManager />);

    fireEvent.click(screen.getByText('+ Invitar'));
    fireEvent.change(screen.getByLabelText(/Código/i), { target: { value: '101011000' } });
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Invitada Uno' } });
    fireEvent.click(screen.getByText('Crear invitado'));

    expect(await screen.findByText('Se alcanzó el máximo de invitados activos')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancelar'));
    expect(screen.queryByText('Código y nombre son obligatorios')).not.toBeInTheDocument();
    expect(screen.getByText('+ Invitar')).toBeInTheDocument();
  });

  it('copia el enlace del último invitado creado', async () => {
    vi.mocked(createGuest).mockResolvedValue(activeGuest as never);
    vi.mocked(fetchMyGuests).mockResolvedValue([] as never);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<GuestManager />);

    fireEvent.click(screen.getByText('+ Invitar'));
    fireEvent.change(screen.getByLabelText(/Código/i), { target: { value: '101011000' } });
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Invitada Uno' } });
    fireEvent.click(screen.getByText('Crear invitado'));

    await screen.findByText(/invitado\?token=tok-123/i);
    fireEvent.click(screen.getByText('Copiar enlace'));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/invitado?token=tok-123'));
    });
    expect(await screen.findByText('¡Copiado!')).toBeInTheDocument();
  });

  it('muestra botón de dashboard de admin para rol TENANT_ADMIN', async () => {
    vi.mocked(fetchMyGuests).mockResolvedValue([] as never);
    const { useAuthStore } = await import('../../store/authStore');
    useAuthStore.getState().setAuth('tok', { id: '10', role: 'TENANT_ADMIN', name: 'Admin' });

    render(<GuestManager />);

    expect(await screen.findByText('Dashboard de admin')).toBeInTheDocument();
    useAuthStore.getState().logout();
  });
});
