import { useCallback, useEffect, useState } from "react";
import { downloadAttendanceCsv, fetchTodayAttendance, registerAttendance } from "../../services/api";
import type { AttendanceRecord } from "../../services/api";
import { extractCodigoFromScan } from "../../utils/attendance";
import QrScannerPanel from "./QrScannerPanel";

type ScanStatus = "idle" | "success" | "error";

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

function vibrate() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate?.(60);
    } catch {
      // sin soporte de vibración: se ignora
    }
  }
}

export default function AttendanceScanner() {
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [lastResult, setLastResult] = useState<AttendanceRecord | null>(null);
  const [resultMessage, setResultMessage] = useState("");
  const [manualCodigo, setManualCodigo] = useState("");
  const [manualBusy, setManualBusy] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [recordsError, setRecordsError] = useState("");
  const [exporting, setExporting] = useState(false);

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

  // Devuelve true si el escaneo se consumió (cámara se detiene)
  const handleScanned = useCallback(
    async (raw: string): Promise<boolean> => {
      const codigo = extractCodigoFromScan(raw);
      if (!codigo) {
        setScanStatus("error");
        setResultMessage("El código escaneado no es válido");
        return true;
      }
      try {
        // Se envía el payload crudo: si el carnet trae TOTP, el backend lo valida
        const record = await registerAttendance(raw);
        setLastResult(record);
        setScanStatus("success");
        setResultMessage(`${record.codigo} · ${record.tenantName}`);
        vibrate();
        await loadToday();
      } catch (error: unknown) {
        setScanStatus("error");
        setResultMessage(getErrorMessage(error, "No se pudo registrar la asistencia"));
      }
      return true;
    },
    [loadToday],
  );

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
      vibrate();
      await loadToday();
    } catch (error: unknown) {
      setScanStatus("error");
      setResultMessage(getErrorMessage(error, "No se pudo registrar la asistencia"));
    } finally {
      setManualBusy(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      await downloadAttendanceCsv("/attendance/today/export", `asistencia-${today}.csv`);
    } catch (error: unknown) {
      setRecordsError(getErrorMessage(error, "Error al exportar la asistencia"));
    } finally {
      setExporting(false);
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

          <QrScannerPanel onDecoded={handleScanned} />

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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-(--accent)">
              Asistencia de hoy
            </h3>
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-(--cyan)/40 bg-(--cyan)/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-(--cyan)">
                {records.length} registro{records.length === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                onClick={() => void handleExport()}
                disabled={exporting || records.length === 0}
                className="rounded-full border border-(--support-beer)/50 bg-(--support-beer)/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-(--support-beer) transition-all duration-300 hover:bg-(--support-beer) hover:text-(--bg-black) disabled:cursor-not-allowed disabled:opacity-40"
              >
                {exporting ? "..." : "Exportar CSV"}
              </button>
            </div>
          </div>

          {recordsError && (
            <div className="mt-4 rounded-xl border border-(--support-lila)/40 bg-(--support-lila)/10 px-4 py-3 text-sm text-(--support-lila)">
              {recordsError}
            </div>
          )}

          <div className="mt-4 max-h-96 overflow-y-auto rounded-xl border border-(--support-gunmetal)">
            <table className="w-full min-w-[22rem] text-left text-sm">
              <thead className="sticky top-0 bg-(--bg-black)">
                <tr className="border-b border-(--support-gunmetal) text-[10px] uppercase tracking-widest text-(--support-grey)">
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Hora</th>
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
                    <td className="px-4 py-3 text-(--white)">{record.name}</td>
                    <td className="px-4 py-3 text-(--support-grey)">{formatTime(record.checkInAt)}</td>
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
