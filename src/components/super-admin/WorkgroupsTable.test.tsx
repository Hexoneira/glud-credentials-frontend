import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import WorkgroupsTable from "./WorkgroupsTable";
import {
  fetchTenants,
  deleteTenant,
  suspendTenant,
  reactivateTenant,
} from "../../services/api";
import type { Tenant } from "../../services/api";

vi.mock("../../services/api", () => ({
  fetchTenants: vi.fn(),
  deleteTenant: vi.fn(),
  suspendTenant: vi.fn(),
  reactivateTenant: vi.fn(),
}));

const mockTenants: Tenant[] = [
  {
    id: "1",
    name: "Tenant 1",
    tenantCode: "T1",
    director: "Directora 1",
    currentMembers: 5,
    memberLimit: 10,
    status: "ACTIVE",
  },
  {
    id: "2",
    name: "Tenant 2",
    tenantCode: "T2",
    director: "Director 2",
    currentMembers: 2,
    memberLimit: 5,
    status: "SUSPENDED",
  },
];

describe("WorkgroupsTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra el estado de carga y luego los tenants", async () => {
    vi.mocked(fetchTenants).mockResolvedValue(mockTenants);
    render(<WorkgroupsTable />);

    expect(screen.getByText("Cargando grupos de trabajo...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Tenant 1")).toBeInTheDocument();
      expect(screen.getByText("Tenant 2")).toBeInTheDocument();
    });

    // Verifica los contadores de la UI
    expect(screen.getByText("2")).toBeInTheDocument(); // Total Grupos
    expect(screen.getByText("1")).toBeInTheDocument(); // Grupos Activos
    expect(screen.getByText("7")).toBeInTheDocument(); // Miembros Registrados
  });

  it("muestra mensaje cuando no hay tenants", async () => {
    vi.mocked(fetchTenants).mockResolvedValue([]);
    render(<WorkgroupsTable />);

    await waitFor(() => {
      expect(screen.getByText("No hay grupos de trabajo registrados.")).toBeInTheDocument();
    });
  });

  it("maneja error al cargar los tenants", async () => {
    vi.mocked(fetchTenants).mockRejectedValue(new Error("Error de red"));
    render(<WorkgroupsTable />);

    await waitFor(() => {
      expect(screen.getByText("Error de red")).toBeInTheDocument();
    });

    // Probar reintentar
    vi.mocked(fetchTenants).mockResolvedValue(mockTenants);
    fireEvent.click(screen.getByText("Reintentar"));

    await waitFor(() => {
      expect(screen.getByText("Tenant 1")).toBeInTheDocument();
    });
  });

  it("permite cambiar el estado de un tenant", async () => {
    vi.mocked(fetchTenants).mockResolvedValue([mockTenants[0]]);
    vi.mocked(suspendTenant).mockResolvedValue({
      ...mockTenants[0],
      status: "SUSPENDED",
    });

    render(<WorkgroupsTable />);

    await waitFor(() => {
      expect(screen.getByText("Tenant 1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Suspender"));

    await waitFor(() => {
      expect(suspendTenant).toHaveBeenCalledWith("1");
      // Después de la llamada recarga los datos
      expect(fetchTenants).toHaveBeenCalledTimes(2);
    });
  });

  it("permite reactivar un tenant", async () => {
    vi.mocked(fetchTenants).mockResolvedValue([mockTenants[1]]);
    vi.mocked(reactivateTenant).mockResolvedValue({
      ...mockTenants[1],
      status: "ACTIVE",
    });

    render(<WorkgroupsTable />);

    await waitFor(() => {
      expect(screen.getByText("Tenant 2")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Reactivar"));

    await waitFor(() => {
      expect(reactivateTenant).toHaveBeenCalledWith("2");
    });
  });

  it("permite eliminar un tenant (con confirmación)", async () => {
    vi.mocked(fetchTenants).mockResolvedValue([mockTenants[0]]);
    vi.mocked(deleteTenant).mockResolvedValue();

    render(<WorkgroupsTable />);

    await waitFor(() => {
      expect(screen.getByText("Tenant 1")).toBeInTheDocument();
    });

    // Click en eliminar para abrir confirmación
    fireEvent.click(screen.getByText("Eliminar"));
    expect(screen.getByText("Sí")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();

    // Click en "No" cancela
    fireEvent.click(screen.getByText("No"));
    expect(screen.queryByText("Sí")).not.toBeInTheDocument();

    // Click de nuevo y confirma
    fireEvent.click(screen.getByText("Eliminar"));
    fireEvent.click(screen.getByText("Sí"));

    await waitFor(() => {
      expect(deleteTenant).toHaveBeenCalledWith("1");
    });
  });

  it("llama a onEdit cuando se hace clic en Editar", async () => {
    vi.mocked(fetchTenants).mockResolvedValue([mockTenants[0]]);
    const onEditMock = vi.fn();

    render(<WorkgroupsTable onEdit={onEditMock} />);

    await waitFor(() => {
      expect(screen.getByText("Tenant 1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Editar"));
    expect(onEditMock).toHaveBeenCalledWith(mockTenants[0]);
  });

  it("escucha el evento tenantsUpdated y recarga", async () => {
    vi.mocked(fetchTenants).mockResolvedValue([]);
    render(<WorkgroupsTable />);

    await waitFor(() => {
      expect(fetchTenants).toHaveBeenCalledTimes(1);
    });

    globalThis.dispatchEvent(new CustomEvent("tenantsUpdated"));

    await waitFor(() => {
      expect(fetchTenants).toHaveBeenCalledTimes(2);
    });
  });

  it("maneja errores de acciones (toggle status)", async () => {
    vi.mocked(fetchTenants).mockResolvedValue([mockTenants[0]]);
    vi.mocked(suspendTenant).mockRejectedValue(new Error("Fallo al suspender"));

    render(<WorkgroupsTable />);

    await waitFor(() => {
      expect(screen.getByText("Tenant 1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Suspender"));

    await waitFor(() => {
      expect(screen.getByText("Fallo al suspender")).toBeInTheDocument();
    });
  });
});
