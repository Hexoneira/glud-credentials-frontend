import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GuestTOTPCard from './GuestTOTPCard';
import { generateSync } from 'otplib';

vi.mock('otplib', () => ({
  generateSync: vi.fn().mockReturnValue('123456'),
}));

vi.mock('./QRGenerator', () => ({
  default: ({ value, darkColor }: { value: string; darkColor: string }) => (
    <div data-testid="mock-qr" data-value={value} data-dark={darkColor} />
  ),
}));

describe('GuestTOTPCard', () => {
  it('genera TOTP cuando hay secreto y muestra el código agrupado', async () => {
    render(<GuestTOTPCard secret="seed" studentId="101011000" />);

    await waitFor(() => {
      expect(generateSync).toHaveBeenCalled();
    });
    expect(screen.getByText('123 456')).toBeInTheDocument();
    expect(screen.getByText('Escanea para validar')).toBeInTheDocument();
  });

  it('el QR usa ID y TOTP como payload con el color del tenant', async () => {
    render(<GuestTOTPCard secret="seed" studentId="101011000" primaryColor="#ff0000" />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-qr')).toHaveAttribute('data-value', 'ID:101011000|TOTP:123456');
    });
    expect(screen.getByTestId('mock-qr')).toHaveAttribute('data-dark', '#ff0000');
  });

  it('muestra NO DISPONIBLE cuando no hay secreto', () => {
    render(<GuestTOTPCard secret="" studentId="101011000" />);

    expect(screen.getByText('NO DISPONIBLE')).toBeInTheDocument();
    expect(screen.getByText('--- ---')).toBeInTheDocument();
    expect(screen.getByText('Carnet sin sincronizar')).toBeInTheDocument();
    expect(screen.getByText('QR no disponible')).toBeInTheDocument();
  });

  it('resetea a 000000 si falla la generación del TOTP', async () => {
    vi.mocked(generateSync).mockImplementation(() => {
      throw new Error('bad secret');
    });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(<GuestTOTPCard secret="mala" studentId="101011000" />);

    await waitFor(() => {
      expect(screen.getByText('000 000')).toBeInTheDocument();
    });
    spy.mockRestore();
    vi.mocked(generateSync).mockReturnValue('123456');
  });

  it('actualiza la barra de progreso al pasar el segundo', async () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<GuestTOTPCard secret="seed" studentId="101011000" />);

      vi.advanceTimersByTime(1000);

      const bar = container.querySelector('div[style*="width"]');
      expect(bar).toHaveStyle({ backgroundColor: '#22fefb' });
      expect(bar?.getAttribute('style')).toContain('width:');
    } finally {
      vi.useRealTimers();
    }
  });
});
