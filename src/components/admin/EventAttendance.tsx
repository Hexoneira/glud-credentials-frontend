import { useCallback, useEffect, useState } from "react";
import {
  createEvent,
  deleteEvent,
  downloadAttendanceCsv,
  fetchEventAttendance,
  fetchEvents,
  registerAttendance,
} from "../../services/api";
import type { EventAttendance, EventStatus, EventSummary } from "../../services/api";
import { extractCodigoFromScan } from "../../utils/attendance";
import EmptyState from "../ui/EmptyState";
import QrScannerPanel from "./QrScannerPanel";

type ScanStatus = "idle" | "success" | "error";

const STATUS_LABELS: Record<EventStatus, string> = {
  SCHEDULED: "Programado",
  IN_PROGRESS: "En curso",
  FINISHED: "Finalizado",
};

const STATUS_STYLES: Record<EventStatus, string> = {
  SCHEDULED: "border-(--support-beer)/40 bg-(--support-beer)/10 text-(--support-beer)",
  IN_PROGRESS: "border-(--accent)/40 bg-(--accent)/10 text-(--accent)",
  FINISHED: "border-(--support-gunmetal) bg-(--support-gunmetal)/10 text-(--support-grey)",
};

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function deleteLabel(eventId: string, confirmDeleteId: string | null, deletingId: string | null): string {
  if (confirmDeleteId !== eventId) return "Eliminar";
  return deletingId === eventId ? "..." : "¿Eliminar? Sí";
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-CO", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
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

export default function EventAttendance() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [eventsError, setEventsError] = useState("");
  const [selected, setSelected] = useState<EventSummary | null>(null);
  const [attendees, setAttendees] = useState<EventAttendance[]>([]);
  const [attendeesError, setAttendeesError] = useState("");
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newStartsAt, setNewStartsAt] = useState("");
  const [createError, setCreateError] = useState("");
  const [createBusy, setCreateBusy] = useState(false);

  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [resultMessage, setResultMessage] = useState("");
  const [manualCodigo, setManualCodigo] = useState("");
  const [manualBusy, setManualBusy] = useState(false);

  const loadEvents = useCallback(async () => {
    setEventsError("");
    try {
      const data = await fetchEvents();
      setEvents(data);
      setSelected((current) => {
        if (current) {
          const updated = data.find((e) => e.eventId === current.eventId);
          return updated ?? null;
        }
        return data[0] ?? null;
      });
    } catch (error: unknown) {
      setEventsError(getErrorMessage(error, "Error al cargar los eventos"));
    }
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const loadAttendees = useCallback(async (eventId: string) => {
    setLoadingAttendees(true);
    setAttendeesError("");
    try {
      const data = await fetchEventAttendance(eventId);
      setAttendees(data);
    } catch (error: unknown) {
      setAttendeesError(getErrorMessage(error, "Error al cargar los asistentes"));
    } finally {
      setLoadingAttendees(false);
    }
  }, []);

  useEffect(() => {
    if (selected) {
      void loadAttendees(selected.eventId);
    }
  }, [selected, loadAttendees]);

  const selectEvent = (event: EventSummary) => {
    setSelected(event);
    setScanStatus("idle");
    setResultMessage("");
    setManualCodigo("");
  };

  const handleScanned = useCallback(
    async (raw: string): Promise<boolean> => {
      if (!selected) return false;
      const codigo = extractCodigoFromScan(raw);
      if (!codigo) {
        setScanStatus("error");
        setResultMessage("El código escaneado no es válido");
        return true;
      }
      try {
        const record = await registerAttendance(raw, selected.eventId);
        setScanStatus("success");
        setResultMessage(`${record.codigo} · ${record.name ?? record.codigo}`);
        vibrate();
        await Promise.all([loadAttendees(selected.eventId), loadEvents()]);
      } catch (error: unknown) {
        setScanStatus("error");
        setResultMessage(getErrorMessage(error, "No se pudo registrar la asistencia"));
      }
      return true;
    },
    [selected, loadAttendees, loadEvents],
  );

  const handleManualSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!selected || !manualCodigo.trim()) return;
    setManualBusy(true);
    setScanStatus("idle");
    setResultMessage("");
    try {
      const record = await registerAttendance(manualCodigo.trim(), selected.eventId);
      setScanStatus("success");
      setResultMessage(`${record.codigo} · ${record.name ?? record.codigo}`);
      setManualCodigo("");
      vibrate();
      await Promise.all([loadAttendees(selected.eventId), loadEvents()]);
    } catch (error: unknown) {
      setScanStatus("error");
      setResultMessage(getErrorMessage(error, "No se pudo registrar la asistencia"));
    } finally {
      setManualBusy(false);
    }
  };

  const handleCreate = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setCreateError("");
    if (!newTitle.trim()) {
      setCreateError("Escribe el título del evento");
      return;
    }
    if (!newStartsAt) {
      setCreateError("Elige la fecha y hora de inicio");
      return;
    }
    setCreateBusy(true);
    try {
      const event = await createEvent({ title: newTitle.trim(), startsAt: newStartsAt });
      setNewTitle("");
      setNewStartsAt("");
      setCreating(false);
      await loadEvents();
      setSelected(event);
    } catch (error: unknown) {
      setCreateError(getErrorMessage(error, "No se pudo crear el evento"));
    } finally {
      setCreateBusy(false);
    }
  };

  const handleDelete = async (event: EventSummary) => {
    setDeletingId(event.eventId);
    try {
      await deleteEvent(event.eventId);
      setConfirmDeleteId(null);
      await loadEvents();
    } catch (error: unknown) {
      setEventsError(getErrorMessage(error, "No se pudo eliminar el evento"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = async () => {
    if (!selected) return;
    setExporting(true);
    try {
      await downloadAttendanceCsv(
        `/events/${selected.eventId}/attendance/export`,
        `asistentes-evento-${selected.eventId}.csv`,
      );
    } catch (error: unknown) {
      setAttendeesError(getErrorMessage(error, "Error al exportar la asistencia"));
    } finally {
      setExporting(false);
    }
  };

  const selectedClass = (event: EventSummary): string =>
    selected?.eventId === event.eventId
      ? "border-(--accent) bg-(--accent)/10 shadow-[0_0_20px_rgba(34,254,251,0.15)]"
      : "border-(--support-gunmetal) hover:border-(--accent)/50";

  return (
    <div className="flex flex-col gap-6">
      {/* Eventos */}
      <div className="rounded-2xl border border-(--support-gunmetal) bg-(--bg-black) p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-(--accent)">
            Eventos y reuniones
          </h3>
          <button
            type="button"
            onClick={() => setCreating((c) => !c)}
            className="rounded-full border border-(--cyan) bg-(--cyan)/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-(--cyan) transition-all duration-300 hover:bg-(--cyan) hover:text-(--bg-black)"
          >
            {creating ? "Cancelar" : "+ Crear evento"}
          </button>
        </div>

        {creating && (
          <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3 rounded-xl border border-(--support-gunmetal) bg-(--bg-black-gunmetal) p-4 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1.5">
              <label htmlFor="event-title" className="text-[10px] font-bold uppercase tracking-widest text-(--cyan)">
                Título
              </label>
              <input
                id="event-title"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ej. Asamblea general"
                className="rounded-xl border border-(--support-gunmetal) bg-(--bg-black) px-4 py-3 text-sm text-(--white) focus:border-(--cyan) focus:outline-none"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <label htmlFor="event-starts" className="text-[10px] font-bold uppercase tracking-widest text-(--cyan)">
                Inicio
              </label>
              <input
                id="event-starts"
                type="datetime-local"
                value={newStartsAt}
                onChange={(e) => setNewStartsAt(e.target.value)}
                className="rounded-xl border border-(--support-gunmetal) bg-(--bg-black) px-4 py-3 text-sm text-(--white) focus:border-(--cyan) focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={createBusy}
              className="rounded-full border border-(--cyan) bg-(--cyan)/10 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-(--cyan) transition-all duration-300 hover:bg-(--cyan) hover:text-(--bg-black) disabled:opacity-50"
            >
              {createBusy ? "..." : "Crear"}
            </button>
            {createError && (
              <p className="w-full text-[11px] font-semibold text-(--support-lila)">{createError}</p>
            )}
          </form>
        )}

        {eventsError && (
          <div className="mt-4 rounded-xl border border-(--support-lila)/40 bg-(--support-lila)/10 px-4 py-3 text-sm text-(--support-lila)">
            {eventsError}
          </div>
        )}

        {!eventsError && events.length === 0 && (
          <div className="mt-4">
            <EmptyState
              icon="clock"
              title="No hay eventos"
              description="Crea un evento para tomar asistencia escaneando el carnet de cada miembro."
            />
          </div>
        )}

        {events.length > 0 && (
          <>
            {/* Desktop: tabla */}
            <div className="mt-4 hidden overflow-x-auto rounded-xl border border-(--support-gunmetal) md:block">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-(--support-gunmetal) text-[10px] uppercase tracking-widest text-(--support-grey)">
                    <th className="px-4 py-3">Evento</th>
                    <th className="px-4 py-3">Inicio</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Asistentes</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr
                      key={event.eventId}
                      onClick={() => selectEvent(event)}
                      className={`cursor-pointer border-b border-(--support-gunmetal)/60 transition-colors last:border-b-0 ${selectedClass(event)}`}
                    >
                      <td className="px-4 py-3.5 font-semibold text-(--white)">{event.title}</td>
                      <td className="px-4 py-3.5 text-(--support-grey)">{formatDateTime(event.startsAt)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${STATUS_STYLES[event.status]}`}>
                          {STATUS_LABELS[event.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-(--accent)">{event.attendeesCount}</td>
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        {confirmDeleteId === event.eventId ? (
                          <span className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => void handleDelete(event)}
                              disabled={deletingId === event.eventId}
                              className="text-[10px] font-bold uppercase tracking-widest text-(--support-lila) hover:text-(--white)"
                            >
                              {deletingId === event.eventId ? "..." : "Sí"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-[10px] font-bold uppercase tracking-widest text-(--support-grey) hover:text-(--white)"
                            >
                              No
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(event.eventId)}
                            className="text-[10px] font-bold uppercase tracking-widest text-(--support-grey) transition-colors hover:text-(--support-lila)"
                          >
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Móvil: tarjetas */}
            <div className="mt-4 grid gap-3 md:hidden">
              {events.map((event) => (
                <div
                  key={event.eventId}
                  role="button"
                  tabIndex={0}
                  aria-label={`Seleccionar evento ${event.title}`}
                  className={`cursor-pointer rounded-xl border p-4 transition-all focus-visible:outline-2 focus-visible:outline-(--accent) ${selectedClass(event)}`}
                  onClick={() => selectEvent(event)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectEvent(event);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-(--white)">{event.title}</p>
                      <p className="mt-1 text-xs text-(--support-grey)">{formatDateTime(event.startsAt)}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-widest ${STATUS_STYLES[event.status]}`}>
                      {STATUS_LABELS[event.status]}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-(--support-gunmetal)/60 pt-3">
                    <span className="font-mono text-xs text-(--accent)">
                      {event.attendeesCount} asistente{event.attendeesCount === 1 ? "" : "s"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirmDeleteId === event.eventId) {
                          void handleDelete(event);
                        } else {
                          setConfirmDeleteId(event.eventId);
                        }
                      }}
                      className="text-[9px] font-bold uppercase tracking-widest text-(--support-grey) transition-colors hover:text-(--support-lila)"
                    >
                      {deleteLabel(event.eventId, confirmDeleteId, deletingId)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Asistencia del evento seleccionado */}
      {selected && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Escáner */}
          <div className="rounded-2xl border border-(--support-gunmetal) bg-(--bg-black) p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-(--accent)">
                Registrar asistencia
              </h3>
              <span className="max-w-full truncate text-xs font-semibold text-(--white)">
                {selected.title}
              </span>
            </div>

            <QrScannerPanel
              onDecoded={handleScanned}
              hint="El carnet digital valida su código TOTP automáticamente al escanearlo."
            />

            {scanStatus === "success" && (
              <div className="mt-4 rounded-xl border border-(--cyan)/40 bg-(--cyan)/10 px-4 py-3 text-sm font-semibold text-(--cyan)">
                ✓ Asistencia registrada: {resultMessage}
              </div>
            )}
            {scanStatus === "error" && (
              <div className="mt-4 rounded-xl border border-(--support-lila)/40 bg-(--support-lila)/10 px-4 py-3 text-sm font-semibold text-(--support-lila)">
                ✕ {resultMessage}
              </div>
            )}

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

          {/* Asistentes */}
          <div className="rounded-2xl border border-(--support-gunmetal) bg-(--bg-black) p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-(--accent)">
                Asistentes
              </h3>
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-(--cyan)/40 bg-(--cyan)/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-(--cyan)">
                  {attendees.length} asistente{attendees.length === 1 ? "" : "s"}
                </span>
                <button
                  type="button"
                  onClick={() => void handleExport()}
                  disabled={exporting || attendees.length === 0}
                  className="rounded-full border border-(--support-beer)/50 bg-(--support-beer)/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-(--support-beer) transition-all duration-300 hover:bg-(--support-beer) hover:text-(--bg-black) disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {exporting ? "..." : "Exportar CSV"}
                </button>
              </div>
            </div>

            {attendeesError && (
              <div className="mt-4 rounded-xl border border-(--support-lila)/40 bg-(--support-lila)/10 px-4 py-3 text-sm text-(--support-lila)">
                {attendeesError}
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
                  {loadingAttendees && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-[10px] uppercase tracking-widest text-(--support-grey)">
                        Cargando asistentes...
                      </td>
                    </tr>
                  )}
                  {!loadingAttendees && attendees.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-[10px] uppercase tracking-widest text-(--support-grey)">
                        Sin asistentes aún
                      </td>
                    </tr>
                  )}
                  {!loadingAttendees &&
                    attendees.map((attendee) => (
                      <tr key={attendee.attendanceId} className="border-b border-(--support-gunmetal)/60 last:border-b-0">
                        <td className="px-4 py-3 font-mono text-(--accent)">{attendee.codigo}</td>
                        <td className="px-4 py-3 text-(--white)">{attendee.name}</td>
                        <td className="px-4 py-3 text-(--support-grey)">{formatTime(attendee.checkInAt)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
