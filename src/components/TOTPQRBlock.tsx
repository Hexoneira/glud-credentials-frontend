import { useEffect, useMemo, useState } from 'react';
import { generateSync } from 'otplib';
import QRGenerator from './QRGenerator';

type TOTPQRBlockProps = {
  studentId: string;
  qrSize?: number;
  primaryColor?: string;
  qrLightColor?: string;
};

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function deriveBase32SecretFromId(studentId: string): string {
  // Deterministic secret generation from the student id.
  let hash = 2166136261;
  for (let i = 0; i < studentId.length; i++) {
    hash ^= studentId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  let seed = hash >>> 0;
  let secret = '';
  for (let i = 0; i < 32; i++) {
    seed = (1664525 * seed + 1013904223) >>> 0;
    secret += BASE32_ALPHABET[seed % BASE32_ALPHABET.length];
  }

  return secret;
}

export default function TOTPQRBlock({
  studentId,
  qrSize = 220,
  primaryColor = '#22fefb',
  qrLightColor = '#071026',
}: TOTPQRBlockProps) {
  const [code, setCode] = useState('000000');
  const [remaining, setRemaining] = useState(30);

  const secret = useMemo(() => deriveBase32SecretFromId(studentId), [studentId]);

  useEffect(() => {
    const refresh = () => {
      try {
        const token = generateSync({
          strategy: 'totp',
          secret,
          digits: 6,
          period: 30,
        });
        setCode(token);
      } catch (error) {
        console.error('[TOTPQRBlock] Error generating TOTP', error);
        setCode('000000');
      }

      const epochSeconds = Math.floor(Date.now() / 1000);
      setRemaining(30 - (epochSeconds % 30));
    };

    refresh();
    const interval = window.setInterval(refresh, 1000);
    return () => window.clearInterval(interval);
  }, [secret]);

  const payload = useMemo(() => `ID:${studentId}|TOTP:${code}`, [studentId, code]);
  const groupedCode = useMemo(() => `${code.slice(0, 3)} ${code.slice(3)}`, [code]);
  const cycleProgress = useMemo(() => Math.max(0, Math.min(100, (remaining / 30) * 100)), [remaining]);

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="border border-white/10 bg-[#0b1220]/90 p-6 rounded-md shadow-sm">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.25em] text-slate-400">Codigo de validacion</p>
          <div className="text-xs font-mono font-bold tracking-wide text-cyan-300">
            00:{remaining.toString().padStart(2, '0')}
          </div>
        </div>

        <p className="mt-2 font-mono text-[2.5rem] leading-none font-black tracking-[0.22em] text-white text-center sm:text-[2.8rem]">
          {groupedCode}
        </p>

        <div className="mt-8 h-1 w-full bg-white/10 rounded-none overflow-hidden">
          <div
            className="h-full bg-cyan-400 transition-[width] duration-700 ease-out rounded-none"
            style={{ width: `${cycleProgress}%` }}
          />
        </div>
      </div>

      <div className="flex justify-center border border-white/10 bg-[#070d18] p-6 rounded-md">
        <QRGenerator
          value={payload}
          size={qrSize}
          className="w-full max-w-60"
          darkColor={primaryColor}
          lightColor={qrLightColor}
          borderColor="transparent"
          shadowColor="rgba(34,254,251,0.2)"
        />
      </div>

      <p className="text-center text-[0.65rem] font-bold uppercase tracking-[0.25em] text-slate-500">
        Escanea para validar
      </p>
    </div>
  );
}
