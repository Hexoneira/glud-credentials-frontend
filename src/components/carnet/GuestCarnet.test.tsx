import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GuestCarnet from './GuestCarnet';
import { fetchGuestAccess } from '../../services/api';

vi.mock('../../services/api', () => ({
  fetchGuestAccess: vi.fn(),
}));

vi.mock('../../utils/theme', () => ({
  applyTenantTheme: vi.fn(),
}));

vi.mock('../carnet/GuestTOTPCard', () => ({
  default: ({ secret, studentId }: { secret: string; studentId: string }) => (
    <div data-testid="mock-totp-card" data-secret={secret} data-student={studentId} />
  ),
}));

const activeGuest = {
  id: '2',
  codigo: '101011000',
  name: 'Invitada Uno',
  email: 'inv1@mail.com',
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
  accessToken: 'tok',
  totpSecret: 'realseed',
};

describe('GuestCarnet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el carnet completo del invitado cuando el enlace es válido', async () => {
    vi.mocked(fetchGuestAccess).mockResolvedValue(activeGuest as never);

    render(<GuestCarnet token="tok" />);

    expect(await screen.findByText('Invitada Uno')).toBeInTheDocument();
    expect(screen.getByText('101011000')).toBeInTheDocument();
    expect(screen.getByText('Invitado Temporal')).toBeInTheDocument();
    expect(screen.getByTestId('mock-totp-card')).toHaveAttribute('data-secret', 'realseed');
  });

  it('muestra enlace expirado cuando el backend responde 410', async () => {
    const error = new Error('El enlace de acceso del invitado ha expirado') as Error & { status?: number };
    error.status = 410;
    vi.mocked(fetchGuestAccess).mockRejectedValue(error);

    render(<GuestCarnet token="vencido" />);

    await waitFor(() => {
      expect(screen.getByText('Enlace expirado')).toBeInTheDocument();
    });
  });

  it('muestra enlace inválido cuando el backend responde 404', async () => {
    const error = new Error('Invitado no encontrado') as Error & { status?: number };
    error.status = 404;
    vi.mocked(fetchGuestAccess).mockRejectedValue(error);

    render(<GuestCarnet token="nope" />);

    await waitFor(() => {
      expect(screen.getByText('Enlace inválido')).toBeInTheDocument();
    });
  });

  it('muestra error de conexión cuando falla la red', async () => {
    vi.mocked(fetchGuestAccess).mockRejectedValue(new Error('Network Error'));

    render(<GuestCarnet token="tok" />);

    await waitFor(() => {
      expect(screen.getByText('No se pudo conectar')).toBeInTheDocument();
    });
  });

  it('muestra enlace inválido cuando no hay token', async () => {
    render(<GuestCarnet token="" />);

    await waitFor(() => {
      expect(screen.getByText('Enlace inválido')).toBeInTheDocument();
    });
  });
});
