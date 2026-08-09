import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import AttendanceScanner from "./AttendanceScanner";
import { registerAttendance, fetchTodayAttendance, downloadAttendanceCsv } from "../../services/api";
import type { AttendanceRecord } from "../../services/api";

vi.mock("jsqr", () => ({
  default: vi.fn(),
}));

vi.mock("../../services/api", () => ({
  registerAttendance: vi.fn(),
  fetchTodayAttendance: vi.fn(),
  downloadAttendanceCsv: vi.fn(),
}));

import jsQR from "jsqr";

const record = (overrides: Partial<AttendanceRecord> = {}): AttendanceRecord => ({
  attendanceId: "1",
  codigo: "20210000002",
  name: "María Gómez",
  email: "m2@glud.org",
  rol: "MIEMBRO",
  tenantId: "1",
  tenantName: "GLUD",
  checkInAt: "2026-08-05T09:30:00",
  markedByCodigo: "20210001001",
  ...overrides,
});

describe("AttendanceScanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchTodayAttendance).mockResolvedValue([]);
  });

  it("muestra la lista de asistencia de hoy", async () => {
    vi.mocked(fetchTodayAttendance).mockResolvedValue([
      record(),
      record({ attendanceId: "2", codigo: "20210000003", tenantName: "GLUD 2", checkInAt: "2026-08-05T10:15:00" }),
    ]);

    render(<AttendanceScanner />);

    await waitFor(() => {
      expect(screen.getByText("2 registros")).toBeInTheDocument();
    });
    expect(screen.getByText("20210000002")).toBeInTheDocument();
    expect(screen.getByText("20210000003")).toBeInTheDocument();
    expect(screen.getAllByText("María Gómez").length).toBeGreaterThanOrEqual(1);
  });

  it("muestra estado vacío cuando no hay registros", async () => {
    render(<AttendanceScanner />);

    await waitFor(() => {
      expect(screen.getByText("0 registros")).toBeInTheDocument();
    });
    expect(screen.getByText("Sin registros hoy")).toBeInTheDocument();
  });

  it("muestra error al cargar los registros", async () => {
    vi.mocked(fetchTodayAttendance).mockRejectedValue(new Error("Error de red"));

    render(<AttendanceScanner />);

    await waitFor(() => {
      expect(screen.getByText("Error de red")).toBeInTheDocument();
    });
  });

  it("muestra error si la cámara no está disponible", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn().mockRejectedValue(new Error("denied")) },
    });

    render(<AttendanceScanner />);

    fireEvent.click(await screen.findByText("Activar cámara"));

    await waitFor(() => {
      expect(screen.getByText(/No se pudo acceder a la cámara/)).toBeInTheDocument();
    });
  });

  it("registra asistencia manualmente con éxito", async () => {
    vi.mocked(registerAttendance).mockResolvedValue(record());
    render(<AttendanceScanner />);

    fireEvent.change(screen.getByPlaceholderText("Código del miembro (ej. 20210000002)"), {
      target: { value: "20210000002" },
    });
    fireEvent.click(screen.getByText("Registrar"));

    await waitFor(() => {
      expect(registerAttendance).toHaveBeenCalledWith("20210000002");
    });
    expect(await screen.findByText(/Asistencia registrada: 20210000002 · GLUD/)).toBeInTheDocument();
  });

  it("muestra el error del servidor al registrar manualmente", async () => {
    vi.mocked(registerAttendance).mockRejectedValue(
      new Error("El miembro 20210000002 ya registró su asistencia hoy"),
    );
    render(<AttendanceScanner />);

    fireEvent.change(screen.getByPlaceholderText("Código del miembro (ej. 20210000002)"), {
      target: { value: "20210000002" },
    });
    fireEvent.click(screen.getByText("Registrar"));

    expect(
      await screen.findByText(/El miembro 20210000002 ya registró su asistencia hoy/),
    ).toBeInTheDocument();
  });

  it("no envía nada si la entrada manual está vacía", () => {
    render(<AttendanceScanner />);

    fireEvent.click(screen.getByText("Registrar"));

    expect(registerAttendance).not.toHaveBeenCalled();
  });

  it("exporta el CSV de la asistencia de hoy", async () => {
    vi.mocked(fetchTodayAttendance).mockResolvedValue([record()]);
    vi.mocked(downloadAttendanceCsv).mockResolvedValue(undefined);

    render(<AttendanceScanner />);

    const exportButton = await screen.findByText("Exportar CSV");
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(downloadAttendanceCsv).toHaveBeenCalledWith(
        "/attendance/today/export",
        expect.stringMatching(/^asistencia-\d{4}-\d{2}-\d{2}\.csv$/),
      );
    });
  });

  it("muestra error al exportar", async () => {
    vi.mocked(fetchTodayAttendance).mockResolvedValue([record()]);
    vi.mocked(downloadAttendanceCsv).mockRejectedValue(new Error("Error al exportar"));

    render(<AttendanceScanner />);

    fireEvent.click(await screen.findByText("Exportar CSV"));

    expect(await screen.findByText("Error al exportar")).toBeInTheDocument();
  });

  it("registra asistencia al escanear un QR con la cámara", async () => {
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
    vi.mocked(registerAttendance).mockResolvedValue(record());

    render(<AttendanceScanner />);

    fireEvent.click(await screen.findByText("Activar cámara"));

    await waitFor(() => {
      expect(registerAttendance).toHaveBeenCalledWith("ID:20210000002|TOTP:123456");
    });
    expect(await screen.findByText(/Asistencia registrada: 20210000002 · GLUD/)).toBeInTheDocument();
  });

  it("rechaza el contenido escaneado desconocido", async () => {
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
      data: "https://example.com",
      binaryData: [],
      location: null,
      chunks: [],
      version: 1,
    } as never);

    render(<AttendanceScanner />);

    fireEvent.click(await screen.findByText("Activar cámara"));

    await waitFor(() => {
      expect(screen.getByText(/El código escaneado no es válido/)).toBeInTheDocument();
    });
    expect(registerAttendance).not.toHaveBeenCalled();
  });
});
