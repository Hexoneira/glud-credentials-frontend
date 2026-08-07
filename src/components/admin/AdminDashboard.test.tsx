import { render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminDashboard from './AdminDashboard';
import { fetchMemberCurrent, fetchMembers, fetchMyGuests, fetchTodayAttendance } from '../../services/api';

vi.mock('../../services/api', () => ({
  fetchMemberCurrent: vi.fn(),
  fetchMembers: vi.fn(),
  fetchMyGuests: vi.fn(),
  fetchTodayAttendance: vi.fn(),
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
    vi.mocked(fetchMyGuests).mockResolvedValue([] as never);
    vi.mocked(fetchTodayAttendance).mockResolvedValue([] as never);
  });

  it('muestra KPIs: miembros, activos, invitados activos y asistencia de hoy', async () => {
    vi.mocked(fetchMyGuests).mockResolvedValue([
      { id: '1', codigo: '10101', name: 'Guest', email: null, status: 'ACTIVE', tenantId: '1', tenantName: 'GLUD', tenantCode: 'GLUD', createdById: '10', createdByCodigo: '20210000001', createdAt: '2026-08-07T10:00:00', expiresAt: null, accessToken: 't', totpSecret: 's' },
      { id: '2', codigo: '10102', name: 'Guest 2', email: null, status: 'REVOKED', tenantId: '1', tenantName: 'GLUD', tenantCode: 'GLUD', createdById: '10', createdByCodigo: '20210000001', createdAt: '2026-08-07T10:00:00', expiresAt: null, accessToken: 't', totpSecret: 's' },
    ] as never);
    vi.mocked(fetchTodayAttendance).mockResolvedValue([
      { attendanceId: 'a1', codigo: '20210000001', email: null, rol: 'MIEMBRO', tenantId: '1', tenantName: 'GLUD', checkInAt: '2026-08-07T09:00:00', markedByCodigo: '20210000002' },
    ] as never);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(within(screen.getByTestId('kpi-miembros')).getByText('2')).toBeInTheDocument();
      expect(within(screen.getByTestId('kpi-activos')).getByText('1')).toBeInTheDocument();
      expect(within(screen.getByTestId('kpi-invitados')).getByText('1')).toBeInTheDocument();
      expect(within(screen.getByTestId('kpi-asistencia')).getByText('1')).toBeInTheDocument();
    });
  });

  it('muestra el nombre del tenant y la tabla de miembros', async () => {
    render(<AdminDashboard />);

    expect(await screen.findByText('GLUD')).toBeInTheDocument();
    expect(screen.getAllByText('20210000001').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('a@mail.com').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Miembro').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Suspendido').length).toBeGreaterThanOrEqual(1);
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

  it('muestra estados de carga y lista vacía', async () => {
    vi.mocked(fetchMembers).mockResolvedValue([] as never);

    render(<AdminDashboard />);

    expect(screen.getByText('Cargando miembros...')).toBeInTheDocument();
    expect(await screen.findByText('No hay miembros registrados')).toBeInTheDocument();
  });

  it('etiqueta roles: Super Admin, Miembro y valor por defecto', async () => {
    vi.mocked(fetchMembers).mockResolvedValue([
      { id: '3', codigo: '20210000003', username: 'sadmin', email: null, rol: 'SUPER_ADMIN', status: 'ACTIVE', tenantId: '1', tenantName: 'GLUD' },
      { id: '4', codigo: '20210000004', username: 'miembro', email: null, rol: 'MIEMBRO', status: 'ACTIVE', tenantId: '1', tenantName: 'GLUD' },
      { id: '5', codigo: '20210000005', username: 'inv', email: null, rol: 'INVITADO', status: 'ACTIVE', tenantId: '1', tenantName: 'GLUD' },
    ] as never);

    render(<AdminDashboard />);

    expect((await screen.findAllByText('Super Admin')).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Miembro').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Invitado').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3);
  });
});
