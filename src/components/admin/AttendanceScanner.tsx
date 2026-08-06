import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { fetchTodayAttendance, registerAttendance } from "../../services/api";
import type { AttendanceRecord } from "../../services/api";
import { extractCodigoFromScan } from "../../utils/attendance";

type ScanStatus = "idle" | "scanning" | "success" | "error";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function AttendanceScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const cameraActiveRef = useRef(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [lastResult, setLastResult] = useState<AttendanceRecord | null>(null);
  const [resultMessage, setResultMessage] = useState("");
  const [manualCodigo, setManualCodigo] = useState("");
  const [manualBusy, setManualBusy] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [recordsError, setRecordsError] = useState("");

  const loadToday = useCallback(async () => {
    setRecordsError("");
    try {
      const data = await fetchTodayAttendance();
      setRecords(data);
    } catch (error: unknown) {
      setRecordsError(getErrorMessage(error, "Error al cargar los registros de hoy"));
    }
  }, []);

  useEffect(() => {
    void loadToday();
  }, [loadToday]);

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    cameraActiveRef.current = false;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const handleDecoded = useCallback(
    async (raw: string) => {
      if (!scanningRef.current) return;
      scanningRef.current = false;
      stopCamera();

      const codigo = extractCodigoFromScan(raw);
      if (!codigo) {
        setScanStatus("error");
        setResultMessage("El código escaneado no es válido");
        return;
      }
      try {
        const record = await registerAttendance(codigo);
        setLastResult(record);
        setScanStatus("success");
        setResultMessage(`${record.codigo} · ${record.tenantName}`);
        await loadToday();
      } catch (error: unknown) {
        setScanStatus("error");
        setResultMessage(getErrorMessage(error, "No se pudo registrar la asistencia"));
      }
    },
    [loadToday, stopCamera],
  );

  const startCamera = useCallback(async () => {
    setCameraError("");
    setScanStatus("idle");
    setResultMessage("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      cameraActiveRef.current = true;
      scanningRef.current = true;
      requestAnimationFrame(tick);
    } catch {
      setCameraError("No se pudo acceder a la cámara. Usa la entrada manual.");
    }
  }, []);

  const tick = () => {
    if (!cameraActiveRef.current || !scanningRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (width > 0 && height > 0) {
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const code = jsQR(imageData.data, width, height, {
            inversionAttempts: "dontInvert",
          });
          if (code?.data) {
            void handleDecoded(code.data);
            return;
          }
        }
      }
    }
    requestAnimationFrame(tick);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodigo.trim()) return;
    setManualBusy(true);
    setScanStatus("idle");
    setResultMessage("");
    try {
      const record = await registerAttendance(manualCodigo.trim());
      setLastResult(record);
      setScanStatus("success");
      setResultMessage(`${record.codigo} · ${record.tenantName}`);
      setManualCodigo("");
      await loadToday();
    } catch (error: unknown) {
      setScanStatus("error");
      setResultMessage(getErrorMessage(error, "No se pudo registrar la asistencia"));
    } finally {
      setManualBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Escáner */}
        <div className="rounded-2xl border border-(--support-gunmetal) bg-(--bg-black) p-5">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-(--accent)">
            Escanear QR del carnet
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-(--support-grey)">
            Apunta a la cámara al QR del carnet. También acepta el código del miembro.
          </p>

          <div className="relative mt-4 overflow-hidden rounded-xl border border-(--support-gunmetal) bg-[#050916]">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`aspect-video w-full object-cover ${cameraActive ? "" : "hidden"}`}
            />
            <canvas ref={canvasRef} className="hidden" />
            {!cameraActive && !cameraError && (
              <div className="flex aspect-video items-center justify-center">
                <button
                  type="button"
                  onClick={() => void startCamera()}
                  className="rounded-full border border-(--cyan) bg-(--cyan)/10 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-(--cyan) shadow-[0_0_15px_rgba(0,255,255,0.2)] transition-all duration-300 hover:bg-(--cyan) hover:text-(--bg-black)"
                >
                  Activar cámara
                </button>
              </div>
            )}
            {!cameraActive && cameraError && (
              <div className="flex aspect-video items-center justify-center p-6 text-center text-[10px] font-bold uppercase tracking-widest text-(--support-lila)">
                {cameraError}
              </div>
            )}
          </div>

          {scanStatus === "success" && lastResult && (
            <div className="mt-4 rounded-xl border border-(--cyan)/40 bg-(--cyan)/10 px-4 py-3 text-sm font-semibold text-(--cyan)">
              ✓ Asistencia registrada: {resultMessage} · {formatTime(lastResult.checkInAt)}
            </div>
          )}
          {scanStatus === "error" && (
            <div className="mt-4 rounded-xl border border-(--support-lila)/40 bg-(--support-lila)/10 px-4 py-3 text-sm font-semibold text-(--support-lila)">
              ✕ {resultMessage}
            </div>
          )}
          {scanStatus === "idle" && !cameraActive && (
            <div className="mt-4 rounded-xl border border-(--support-gunmetal) px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-(--support-grey)">
              Esperando escaneo...
            </div>
          )}

          {/* Entrada manual */}
          <form onSubmit={handleManualSubmit} className="mt-4 flex gap-2">
            <input
              type="text"
              value={manualCodigo}
              onChange={(e) => setManualCodigo(e.target.value)}
              placeholder="Código del miembro (ej. 20210000002)"
              className="flex-1 rounded-xl border border-(--support-gunmetal) bg-(--bg-black) px-4 py-3 text-sm text-(--white) transition-all duration-300 focus:border-(--cyan) focus:outline-none"
            />
            <button
              type="submit"
              disabled={manualBusy || !manualCodigo.trim()}
              className="rounded-xl border border-(--cyan) bg-(--cyan)/10 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-(--cyan) transition-all duration-300 hover:bg-(--cyan) hover:text-(--bg-black) disabled:cursor-not-allowed disabled:opacity-50"
            >
              {manualBusy ? "..." : "Registrar"}
            </button>
          </form>
        </div>

        {/* Registros de hoy */}
        <div className="rounded-2xl border border-(--support-gunmetal) bg-(--bg-black) p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-(--accent)">
              Asistencia de hoy
            </h3>
            <span className="rounded-full border border-(--cyan)/40 bg-(--cyan)/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-(--cyan)">
              {records.length} registro{records.length === 1 ? "" : "s"}
            </span>
          </div>

          {recordsError && (
            <div className="mt-4 rounded-xl border border-(--support-lila)/40 bg-(--support-lila)/10 px-4 py-3 text-sm text-(--support-lila)">
              {recordsError}
            </div>
          )}

          <div className="mt-4 max-h-96 overflow-y-auto rounded-xl border border-(--support-gunmetal)">
            <table className="w-full min-w-[22rem] text-left text-sm">
              <thead>
                <tr className="border-b border-(--support-gunmetal) text-[10px] uppercase tracking-widest text-(--support-grey)">
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Hora</th>
                  <th className="px-4 py-3">Grupo</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-[10px] uppercase tracking-widest text-(--support-grey)">
                      Sin registros hoy
                    </td>
                  </tr>
                )}
                {records.map((record) => (
                  <tr key={record.attendanceId} className="border-b border-(--support-gunmetal)/60 last:border-b-0">
                    <td className="px-4 py-3 font-mono text-(--accent)">{record.codigo}</td>
                    <td className="px-4 py-3 text-(--white)">{formatTime(record.checkInAt)}</td>
                    <td className="px-4 py-3 text-(--support-grey)">{record.tenantName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
