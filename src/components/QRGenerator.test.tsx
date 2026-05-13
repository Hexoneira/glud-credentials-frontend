import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import QRGenerator from './QRGenerator';

const toDataURLMock = vi.hoisted(() => vi.fn());

vi.mock('qrcode', () => ({
  default: {
    toDataURL: toDataURLMock,
  },
}));

describe('QRGenerator', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows an error when the value is empty', () => {
    render(<QRGenerator value="   " />);

    expect(screen.getByText('No se encontro contenido para generar el QR.')).toBeInTheDocument();
  });

  it('generates a QR image and passes normalized colors to qrcode', async () => {
    toDataURLMock.mockResolvedValueOnce('data:image/png;base64,qr');

    render(
      <QRGenerator
        value="hello"
        darkColor="transparent"
        lightColor=""
        borderColor="#123456"
      />
    );

    await waitFor(() => {
      expect(toDataURLMock).toHaveBeenCalledWith(
        'hello',
        expect.objectContaining({
          margin: 0,
          width: 260,
          color: {
            dark: '#00000000',
            light: '#071026',
          },
        })
      );
    });

    expect(await screen.findByAltText('Código QR GLUD')).toHaveAttribute('src', 'data:image/png;base64,qr');
  });

  it('muestra mensaje de error si qrcode falla', async () => {
    toDataURLMock.mockRejectedValueOnce(new Error('boom'));

    render(<QRGenerator value="fail" />);

    expect(await screen.findByText('No se pudo generar el QR.')).toBeInTheDocument();
  });

  it('shows an error if QR generation fails', async () => {
    toDataURLMock.mockRejectedValueOnce(new Error('boom'));

    render(<QRGenerator value="hello" />);

    expect(await screen.findByText('No se pudo generar el QR.')).toBeInTheDocument();
  });
});