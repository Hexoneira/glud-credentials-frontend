import { render, screen, act, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import TOTPQRBlock from './TOTPQRBlock';
import { useAuthStore } from '../../store/authStore';
import * as otplib from 'otplib';

// Mock otplib to prevent actual crypto errors during simple rendering tests
vi.mock('otplib', () => ({
  generateSync: vi.fn(() => '123456')
}));

// Mock QRGenerator to avoid canvas rendering issues in jsdom
vi.mock('./QRGenerator', () => ({
  default: () => <div data-testid="mock-qr-generator" />
}));

describe('TOTPQRBlock Component', () => {
  beforeEach(() => {
    // Limpiar el estado global antes de cada test
    useAuthStore.getState().logout();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should show unavailable state when there is no server seed', () => {
    render(<TOTPQRBlock studentId="123456789" />);

    expect(screen.getByText('Codigo de validacion')).toBeInTheDocument();
    expect(screen.getByText('NO DISPONIBLE')).toBeInTheDocument();
    expect(screen.getByText('--- ---')).toBeInTheDocument();
    expect(screen.getByText(/Sincroniza tu carnet para generar el codigo/)).toBeInTheDocument();
    expect(screen.getByText('QR no disponible')).toBeInTheDocument();
    expect(screen.getByText('Carnet sin sincronizar')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-qr-generator')).not.toBeInTheDocument();
    // Sin seed del servidor nunca debe llamarse otplib ni mostrarse un código inventado
    expect(otplib.generateSync).not.toHaveBeenCalled();
  });

  it('should use totpSecret from Zustand store if available', () => {
    // Pre-poblar el store con un usuario que tiene totpSecret
    act(() => {
      useAuthStore.getState().setAuth('token', {
        id: '20232020172',
        role: 'TENANT_ADMIN',
        totpSecret: 'REALBACKENDSECRET32CHARSMAXIMO'
      });
    });

    render(<TOTPQRBlock studentId="fallback-id" />);

    // El mock de otplib devuelve 123456, agrupado debe ser "123 456"
    expect(screen.getByText('123 456')).toBeInTheDocument();
    expect(screen.getByText('Escanea para validar')).toBeInTheDocument();
    expect(screen.getByTestId('mock-qr-generator')).toBeInTheDocument();
    expect(otplib.generateSync).toHaveBeenCalled();
  });

  it('should safely render 000000 when crypto fails', () => {
    // Hacemos que el mock de otplib tire un error simulando el SecretTooShortError
    vi.mocked(otplib.generateSync).mockImplementationOnce(() => {
      throw new Error('Secret must be at least 16 bytes');
    });

    act(() => {
      useAuthStore.getState().setAuth('token', {
        id: '20232020172',
        role: 'TENANT_ADMIN',
        totpSecret: 'REALBACKENDSECRET32CHARSMAXIMO'
      });
    });

    render(<TOTPQRBlock studentId="short" />);

    // Si falla el crypto, muestra 000 000 como fallback
    expect(screen.getByText('000 000')).toBeInTheDocument();
  });
});
