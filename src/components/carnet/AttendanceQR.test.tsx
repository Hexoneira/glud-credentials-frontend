import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import AttendanceQR from "./AttendanceQR";
import { useAuthStore } from "../../store/authStore";

vi.mock("./QRGenerator", () => ({
  default: ({ value }: { value: string }) => <div data-testid="qr" data-value={value} />,
}));

describe("AttendanceQR", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it("no renderiza sin sesión", () => {
    render(<AttendanceQR />);
    expect(screen.queryByTestId("qr")).not.toBeInTheDocument();
  });

  it("renderiza el QR con el codigo del miembro", () => {
    useAuthStore.setState({
      user: {
        id: "2",
        codigo: "20210000001",
        nombre: "Miembro Uno",
        email: "m1@glud.org",
        role: "MIEMBRO",
      },
    } as never);

    render(<AttendanceQR />);

    expect(screen.getByText("QR de Asistencia")).toBeInTheDocument();
    expect(screen.getByTestId("qr")).toHaveAttribute("data-value", "20210000001");
  });
});
