import { useAuthStore } from "../../store/authStore";
import QRGenerator from "./QRGenerator";

type AttendanceQRProps = {
  size?: number;
};

/**
 * QR estático de asistencia con el código del miembro.
 * Siempre visible (no depende del TOTP) para que el administrador
 * pueda escanearlo en la toma de asistencia.
 */
export default function AttendanceQR({
  size = 170,
}: Readonly<AttendanceQRProps>) {
  const authUser = useAuthStore((state) => state.user);
  const codigo = String(authUser?.codigo || authUser?.id || "");

  if (!codigo) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 hidden flex-col items-center gap-3 rounded-2xl border border-white/15 bg-[#0b1120]/90 p-5 shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-xl md:flex">
      <p className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-slate-400">
        QR de Asistencia
      </p>
      <div className="w-36">
        <QRGenerator
          value={codigo}
          size={size}
          className="w-full"
          darkColor="#22fefb"
          lightColor="#071026"
          borderColor="transparent"
          shadowColor="rgba(34,254,251,0.2)"
        />
      </div>
      <p className="text-center text-[0.55rem] font-bold uppercase tracking-[0.18em] text-slate-500">
        Muéstralo al admin para registrar tu asistencia
      </p>
    </div>
  );
}
