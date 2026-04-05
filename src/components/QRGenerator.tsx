import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

type QRGeneratorProps = {
  value: string;
  size?: number;
  className?: string;
  darkColor?: string;
  lightColor?: string;
  borderColor?: string;
  shadowColor?: string;
};

function normalizeColor(color: string, fallback: string): string {
  if (!color || !color.trim()) return fallback;
  if (color.trim().toLowerCase() === 'transparent') return '#00000000';
  return color;
}

/**
 * QRGenerator
 * React component generador de QR dinamico.
 *
 * Este componente produce un DataURL usando la librería qrcode
 * en el cliente (necesita `client:load` en Astro).
 */
export default function QRGenerator({
  value,
  size = 260,
  className = '',
  darkColor = '#22fefb',
  lightColor = '#071026',
  borderColor = '#22fefb',
  shadowColor = 'rgba(34,254,251,0.5)',
}: QRGeneratorProps) {
  const [src, setSrc] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!value.trim()) {
      setSrc('');
      setError('No se encontro contenido para generar el QR.');
      return;
    }

    const dark = normalizeColor(darkColor, '#22fefb');
    const light = normalizeColor(lightColor, '#071026');

    setSrc('');
    setError('');

    QRCode.toDataURL(value, {
      margin: 0,
      width: size,
      color: {
        dark,
        light,
      },
    })
      .then((dataUrl: string) => setSrc(dataUrl))
      .catch((err: unknown) => {
        console.error('[QRGenerator] Error generando QR:', err);
        setError('No se pudo generar el QR.');
      });
  }, [value, size, darkColor, lightColor]);

  if (error) {
    return <div className={`text-red-300 text-center ${className}`}>{error}</div>;
  }

  return (
    <div className={`inline-block ${className}`} aria-label="QR code">
      {src ? (
        <img
          src={src}
          alt="Código QR GLUD"
          className="h-auto w-full rounded-sm border-2"
          style={{
            borderColor,
            boxShadow: `0 0 40px ${shadowColor}`,
          }}
          draggable={false}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-sm border border-cyan-200/30 bg-[#081426] p-6 text-sm text-cyan-100/80">Generando QR...</div>
      )}
    </div>
  );
}
