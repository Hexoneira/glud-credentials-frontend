
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

  it('should render correctly with a fallback student ID', () => {
    render(<TOTPQRBlock studentId="123456789" />);
    
    // Verifica que el componente carga visualmente
    expect(screen.getByText('Codigo de validacion')).toBeInTheDocument();
    expect(screen.getByText('Escanea para validar')).toBeInTheDocument();
    
    // El mock de otplib devuelve 123456, agrupado debe ser "123 456"
    expect(screen.getByText('123 456')).toBeInTheDocument();
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
    
    // Como mockeamos generateSync, sabemos que no fallará por largo del secreto
    // Y verificamos que renderiza
    expect(screen.getByText('123 456')).toBeInTheDocument();
  });

  it('should safely render 000000 when crypto fails (or before sync)', () => {
    // Hacemos que el mock de otplib tire un error simulando el SecretTooShortError
    vi.mocked(otplib.generateSync).mockImplementationOnce(() => {
      throw new Error('Secret must be at least 16 bytes');
    });

    render(<TOTPQRBlock studentId="short" />);
    
    // Si falla el crypto, muestra 000 000 como fallback
    expect(screen.getByText('000 000')).toBeInTheDocument();
  });
});
