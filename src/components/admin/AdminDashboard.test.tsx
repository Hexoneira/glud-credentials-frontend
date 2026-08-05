import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminDashboard from './AdminDashboard';
import { fetchMemberCurrent, fetchMembers } from '../../services/api';

vi.mock('../../services/api', () => ({
  fetchMemberCurrent: vi.fn(),
  fetchMembers: vi.fn(),
}));

vi.mock('../../utils/theme', () => ({
  applyTenantTheme: vi.fn(),
}));

const member = {
  id: '20210000001',
  name: '20210000001',
  email: 'miembro@udistrital.edu.co',
  role: 'MIEMBRO',
  groups: ['GLUD'],
  icon: null,
  totpSecret: null,
  tenantName: 'GLUD',
  tenantCode: 'GLUD',
  primaryColor: '#22fefb',
  logoUrl: null,
};

const members = [
  { id: '1', codigo: '20210000001', username: '20210000001', email: 'a@mail.com', rol: 'MIEMBRO', status: 'ACTIVE', tenantId: '1', tenantName: 'GLUD' },
  { id: '2', codigo: '20210000002', username: '20210000002', email: 'b@mail.com', rol: 'TENANT_ADMIN', status: 'SUSPENDED', tenantId: '1', tenantName: 'GLUD' },
];

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchMemberCurrent).mockResolvedValue(member as never);
    vi.mocked(fetchMembers).mockResolvedValue(members as never);
  });

  it('muestra el nombre del tenant y la tabla de miembros', async () => {
    render(<AdminDashboard />);

    expect(await screen.findByText('Miembros del Grupo')).toBeInTheDocument();
    expect(screen.getAllByText('20210000001').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('a@mail.com')).toBeInTheDocument();
    expect(screen.getByText('Miembro')).toBeInTheDocument();
    expect(screen.getByText('Suspendido')).toBeInTheDocument();
  });

  it('muestra el contador de miembros', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('2 miembros')).toBeInTheDocument();
    });
  });

  it('muestra error cuando falla la carga', async () => {
    vi.mocked(fetchMembers).mockRejectedValue(new Error('Sin permisos'));

    render(<AdminDashboard />);

    expect(await screen.findByText('Sin permisos')).toBeInTheDocument();
  });
});
