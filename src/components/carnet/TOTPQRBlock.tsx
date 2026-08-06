import { useEffect, useMemo, useRef, useState } from "react";
import { generateSync } from "otplib";
import QRGenerator from "./QRGenerator";
import { useAuthStore } from "../../store/authStore";

type TOTPQRBlockProps = {
  studentId: string;
  qrSize?: number;
  primaryColor?: string;
  qrLightColor?: string;
  secret?: string;
};

export default function TOTPQRBlock({
  studentId: initialStudentId,
  qrSize = 220,
  primaryColor = "#22fefb",
  qrLightColor = "#071026",
  secret: secretOverride,
}: Readonly<TOTPQRBlockProps>) {
  const [code, setCode] = useState("000000");
  const [remaining, setRemaining] = useState(30);

  const authUser = useAuthStore((state) => state.user);
  const studentId = authUser
    ? String(authUser.codigo || authUser.id)
    : initialStudentId;

  // El color del tenant (si el servidor lo devuelve) gana sobre la prop estática
  const themeColor = authUser?.primaryColor || primaryColor;

  // Carnet público de invitado (sin sesión): la semilla llega por prop.
  // Con sesión, la semilla SIEMPRE viene del servidor: el carnet se sincroniza
  // con /member/current y guarda totpSecret en el store. Nunca se deriva en el
  // cliente porque el escáner de la puerta valida contra la semilla del servidor.
  const secret = useMemo(
    () => secretOverride ?? authUser?.totpSecret ?? "",
    [secretOverride, authUser?.totpSecret],
  );
  const hasSecret = secret.length > 0;

  // Track which 30s window the last code was generated for so we skip redundant crypto work
  const lastPeriodRef = useRef<number>(-1);

  useEffect(() => {
    if (!hasSecret) return;

    const generateCode = () => {
      try {
        const token = generateSync({
          strategy: "totp",
          secret,
          digits: 6,
          period: 30,
        });
        setCode(token);
      } catch (error) {
        console.error("[TOTPQRBlock] Error generating TOTP", error);
        setCode("000000");
      }
    };

    const tick = () => {
      const epochSeconds = Math.floor(Date.now() / 1000);
      const currentPeriod = Math.floor(epochSeconds / 30);

      // Only redo TOTP crypto when the 30s window rolls over
      if (currentPeriod !== lastPeriodRef.current) {
        lastPeriodRef.current = currentPeriod;
        generateCode();
      }

      setRemaining(30 - (epochSeconds % 30));
    };

    // Run immediately, then every second for the countdown
    tick();
    const interval = globalThis.setInterval(tick, 1000);
    return () => globalThis.clearInterval(interval);
  }, [secret, hasSecret]);

  const payload = useMemo(
    () => `ID:${studentId}|TOTP:${code}`,
    [studentId, code],
  );
  const groupedCode = useMemo(
    () => (hasSecret ? `${code.slice(0, 3)} ${code.slice(3)}` : "--- ---"),
    [code, hasSecret],
  );
  const cycleProgress = useMemo(
    () => (hasSecret ? Math.max(0, Math.min(100, (remaining / 30) * 100)) : 0),
    [remaining, hasSecret],
  );

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="border border-white/10 bg-[#0b1220]/90 p-6 rounded-md shadow-sm">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.25em] text-slate-400">
            Codigo de validacion
          </p>
          {hasSecret ? (
            <div className="text-xs font-mono font-bold tracking-wide text-(--accent)">
              00:{remaining.toString().padStart(2, "0")}
            </div>
          ) : (
            <div className="text-xs font-mono font-bold tracking-wide text-amber-400">
              NO DISPONIBLE
            </div>
          )}
        </div>

        <p className="mt-2 font-mono text-[2.5rem] leading-none font-black tracking-[0.22em] text-white text-center sm:text-[2.8rem]">
          {groupedCode}
        </p>

        <div className="mt-8 h-1 w-full bg-white/10 rounded-none overflow-hidden">
          <div
            className="h-full bg-(--accent) transition-[width] duration-700 ease-out rounded-none"
            style={{ width: `${cycleProgress}%` }}
          />
        </div>

        {!hasSecret && (
          <p className="mt-6 text-center text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-amber-400/90">
            Sincroniza tu carnet para generar el codigo
          </p>
        )}
      </div>

      {hasSecret ? (
        <div className="flex justify-center border border-white/10 bg-[#070d18] p-6 rounded-md">
          <QRGenerator
            value={payload}
            size={qrSize}
            className="w-full max-w-60"
            darkColor={themeColor}
            lightColor={qrLightColor}
            borderColor="transparent"
            shadowColor="rgba(34,254,251,0.2)"
          />
        </div>
      ) : (
        <div className="flex h-60 items-center justify-center border border-dashed border-white/10 bg-[#070d18] p-6 rounded-md">
          <p className="text-center text-[0.7rem] font-bold uppercase tracking-[0.2em] text-slate-500">
            QR no disponible
            <br />
            <span className="mt-2 block font-normal normal-case tracking-normal text-slate-600">
              Conectate al servidor para obtener tu codigo dinamico
            </span>
          </p>
        </div>
      )}

      <p className="text-center text-[0.65rem] font-bold uppercase tracking-[0.25em] text-slate-500">
        {hasSecret ? "Escanea para validar" : "Carnet sin sincronizar"}
      </p>
    </div>
  );
}
