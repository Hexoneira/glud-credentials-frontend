import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, screen, act, waitFor, cleanup } from "@testing-library/react";
import SuperAdminDashboard from "./SuperAdminDashboard";

// Mocks
vi.mock("./WorkgroupsTable", () => ({
  default: vi.fn(({ onEdit }) => (
    <div data-testid="workgroups-table">
      <button onClick={() => onEdit({ id: "t1", name: "Tenant 1" })}>
        Simulate Edit
      </button>
    </div>
  )),
}));

vi.mock("./CreateGroupForm", () => ({
  default: vi.fn(({ isOpen, onClose }) =>
    isOpen ? (
      <div data-testid="create-group-form">
        <button onClick={onClose}>Close Create</button>
      </div>
    ) : null,
  ),
}));

vi.mock("./EditGroupForm", () => ({
  default: vi.fn(({ tenant, onClose }) =>
    tenant ? (
      <div data-testid="edit-group-form">
        <span>{tenant.name}</span>
        <button onClick={onClose}>Close Edit</button>
      </div>
    ) : null,
  ),
}));

describe("SuperAdminDashboard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renderiza correctamente el dashboard", () => {
    render(<SuperAdminDashboard />);
    expect(screen.getByText("Grupos de Trabajo")).toBeInTheDocument();
    expect(screen.getByTestId("workgroups-table")).toBeInTheDocument();
    expect(screen.queryByTestId("create-group-form")).not.toBeInTheDocument();
    expect(screen.queryByTestId("edit-group-form")).not.toBeInTheDocument();
  });

  it("abre y cierra el modal de crear grupo via botón", () => {
    render(<SuperAdminDashboard />);

    // Abrir
    fireEvent.click(screen.getAllByText("+ Nuevo Grupo")[0]);
    expect(screen.getByTestId("create-group-form")).toBeInTheDocument();

    // Cerrar
    fireEvent.click(screen.getByText("Close Create"));
    expect(screen.queryByTestId("create-group-form")).not.toBeInTheDocument();
  });

  it("abre el modal de crear grupo via evento global", async () => {
    render(<SuperAdminDashboard />);

    act(() => {
      globalThis.dispatchEvent(new CustomEvent("openCreateGroupModal"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("create-group-form")).toBeInTheDocument();
    });
  });

  it("abre y cierra el modal de editar grupo", () => {
    render(<SuperAdminDashboard />);

    // Abrir edit via el botón simulado en la tabla mockeada
    fireEvent.click(screen.getAllByText("Simulate Edit")[0]);
    expect(screen.getByTestId("edit-group-form")).toBeInTheDocument();
    expect(screen.getByText("Tenant 1")).toBeInTheDocument();

    // Cerrar
    fireEvent.click(screen.getByText("Close Edit"));
    expect(screen.queryByTestId("edit-group-form")).not.toBeInTheDocument();
  });
});
