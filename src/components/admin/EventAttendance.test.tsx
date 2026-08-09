import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import EventAttendance from "./EventAttendance";
import {
  fetchEvents,
  createEvent,
  deleteEvent,
  fetchEventAttendance,
  registerAttendance,
  downloadAttendanceCsv,
} from "../../services/api";

vi.mock("jsqr", () => ({
  default: vi.fn(),
}));

vi.mock("../../services/api", () => ({
  fetchEvents: vi.fn(),
  createEvent: vi.fn(),
  deleteEvent: vi.fn(),
  fetchEventAttendance: vi.fn(),
  registerAttendance: vi.fn(),
  downloadAttendanceCsv: vi.fn(),
}));

import jsQR from "jsqr";

const event = (overrides: Record<string, unknown> = {}) => ({
  eventId: "50",
  title: "Asamblea GLUD",
  startsAt: "2026-08-08T18:00:00",
  status: "SCHEDULED",
  attendeesCount: 0,
  tenantId: "1",
  tenantName: "GLUD",
  createdByCodigo: "20219999999",
  ...overrides,
});

const attendee = (overrides: Record<string, unknown> = {}) => ({
  attendanceId: "1",
  userId: "2",
  codigo: "20210000002",
  name: "María Gómez",
  checkInAt: "2026-08-08T18:05:00",
  markedByCodigo: "20219999999",
  ...overrides,
});

describe("EventAttendance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchEvents).mockResolvedValue([event()] as never);
    vi.mocked(fetchEventAttendance).mockResolvedValue([attendee()] as never);
  });

  it("carga eventos, selecciona el primero y lista asistentes", async () => {
    render(<EventAttendance />);

    expect((await screen.findAllByText("Asamblea GLUD")).length).toBeGreaterThanOrEqual(2);
    expect((await screen.findAllByText("Programado")).length).toBeGreaterThanOrEqual(1);

    await waitFor(() => {
      expect(fetchEventAttendance).toHaveBeenCalledWith("50");
    });
    expect(await screen.findByText("María Gómez")).toBeInTheDocument();
    expect(screen.getByText("1 asistente")).toBeInTheDocument();
  });

  it("muestra estado vacío cuando no hay eventos", async () => {
    vi.mocked(fetchEvents).mockResolvedValue([] as never);

    render(<EventAttendance />);

    expect(await screen.findByText("No hay eventos")).toBeInTheDocument();
  });

  it("crea un evento y lo selecciona", async () => {
    vi.mocked(createEvent).mockResolvedValue(event() as never);
    render(<EventAttendance />);

    fireEvent.click(await screen.findByText("+ Crear evento"));
    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Asamblea GLUD" },
    });
    fireEvent.change(screen.getByLabelText("Inicio"), {
      target: { value: "2026-08-08T18:00" },
    });
    fireEvent.click(screen.getByText("Crear"));

    await waitFor(() => {
      expect(createEvent).toHaveBeenCalledWith({
        title: "Asamblea GLUD",
        startsAt: "2026-08-08T18:00",
      });
    });
  });

  it("registra asistencia manual con eventId", async () => {
    vi.mocked(registerAttendance).mockResolvedValue(
      attendee() as never,
    );
    render(<EventAttendance />);

    await screen.findAllByText("Asamblea GLUD");
    fireEvent.change(screen.getByPlaceholderText("Código del miembro (ej. 20210000002)"), {
      target: { value: "20210000002" },
    });
    fireEvent.click(screen.getByText("Registrar"));

    await waitFor(() => {
      expect(registerAttendance).toHaveBeenCalledWith("20210000002", "50");
    });
    expect(await screen.findByText(/Asistencia registrada: 20210000002 · María Gómez/)).toBeInTheDocument();
  });

  it("registra asistencia al escanear QR con TOTP", async () => {
    Object.defineProperty(HTMLVideoElement.prototype, "readyState", {
      configurable: true,
      get: () => 4,
    });
    Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", {
      configurable: true,
      get: () => 640,
    });
    Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", {
      configurable: true,
      get: () => 480,
    });
    Object.defineProperty(HTMLVideoElement.prototype, "play", {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
    const mockContext = {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(640 * 480 * 4) })),
    };
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: vi.fn(() => mockContext),
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
    });
    vi.mocked(jsQR).mockReturnValue({
      data: "ID:20210000002|TOTP:123456",
      binaryData: [],
      location: null,
      chunks: [],
      version: 1,
    } as never);
    vi.mocked(registerAttendance).mockResolvedValue(attendee() as never);

    render(<EventAttendance />);
    await screen.findAllByText("Asamblea GLUD");

    fireEvent.click(await screen.findByText("Activar cámara"));

    await waitFor(() => {
      expect(registerAttendance).toHaveBeenCalledWith("ID:20210000002|TOTP:123456", "50");
    });
  });

  it("elimina un evento con confirmación", async () => {
    vi.mocked(deleteEvent).mockResolvedValue(undefined);
    render(<EventAttendance />);

    await screen.findAllByText("Asamblea GLUD");
    const deleteButtons = screen.getAllByText("Eliminar");
    fireEvent.click(deleteButtons[0]);

    fireEvent.click(await screen.findByText("Sí"));

    await waitFor(() => {
      expect(deleteEvent).toHaveBeenCalledWith("50");
    });
  });

  it("exporta el CSV de asistentes del evento", async () => {
    vi.mocked(downloadAttendanceCsv).mockResolvedValue(undefined);
    render(<EventAttendance />);

    await screen.findAllByText("Asamblea GLUD");
    fireEvent.click(await screen.findByText("Exportar CSV"));

    await waitFor(() => {
      expect(downloadAttendanceCsv).toHaveBeenCalledWith(
        "/events/50/attendance/export",
        "asistentes-evento-50.csv",
      );
    });
  });

  it("muestra error al cargar los eventos", async () => {
    vi.mocked(fetchEvents).mockRejectedValue(new Error("Error de red"));

    render(<EventAttendance />);

    expect(await screen.findByText("Error de red")).toBeInTheDocument();
  });
});
