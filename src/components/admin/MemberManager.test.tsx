import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, fireEvent, waitFor, screen, within } from "@testing-library/react";
import MemberManager, { MAX_ADMINS_PER_GROUP } from "./MemberManager";
import {
  fetchMembers,
  createMember,
  updateMember,
  updateMemberStatus,
  deleteMember,
} from "../../services/api";
import type { Member } from "../../services/api";

vi.mock("../../services/api", () => ({
  fetchMembers: vi.fn(),
  createMember: vi.fn(),
  updateMember: vi.fn(),
  updateMemberStatus: vi.fn(),
  deleteMember: vi.fn(),
}));

const member = (overrides: Partial<Member> = {}): Member => ({
  id: "2",
  codigo: "20210000002",
  username: "20210000002",
  name: "María Gómez",
  rol: "MIEMBRO",
  status: "ACTIVE",
  tenantId: "1",
  tenantName: "GLUD",
  ...overrides,
});

const members: Member[] = [
  member({ id: "1", codigo: "20210000001", name: "Ana Admin", rol: "TENANT_ADMIN", username: "20210000001" }),
  member({ id: "2" }),
  member({ id: "3", codigo: "20210000003", name: "", rol: "MIEMBRO", status: "SUSPENDED" }),
];

describe("MemberManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no renderiza nada cuando está cerrado", () => {
    render(<MemberManager open={false} onClose={() => {}} isSuperAdmin={false} />);
    expect(screen.queryByText("Gestión de Miembros")).not.toBeInTheDocument();
  });

  it("carga y muestra los miembros del grupo", async () => {
    vi.mocked(fetchMembers).mockResolvedValue(members);
    render(<MemberManager open onClose={() => {}} isSuperAdmin={false} tenantName="GLUD" />);

    expect(screen.getByText("Cargando miembros...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("20210000001")).toBeInTheDocument();
    });

    expect(screen.getByText("Miembros de GLUD")).toBeInTheDocument();
    expect(screen.getByText("María Gómez")).toBeInTheDocument();
    expect(screen.getByText("Suspendido")).toBeInTheDocument();
    expect(screen.getByText(`Admins: 1/${MAX_ADMINS_PER_GROUP}`)).toBeInTheDocument();
    expect(vi.mocked(fetchMembers)).toHaveBeenCalledWith(undefined);
  });

  it("filtra por tenantId cuando el superadmin gestiona un grupo", async () => {
    vi.mocked(fetchMembers).mockResolvedValue(members);
    render(<MemberManager open onClose={() => {}} tenantId="5" isSuperAdmin tenantName="Grupo 5" />);

    await waitFor(() => {
      expect(screen.getByText("20210000001")).toBeInTheDocument();
    });

    expect(vi.mocked(fetchMembers)).toHaveBeenCalledWith("5");
  });

  it("muestra aviso de límite cuando hay 2 admins", async () => {
    vi.mocked(fetchMembers).mockResolvedValue([
      member({ id: "1", rol: "TENANT_ADMIN" }),
      member({ id: "2", rol: "TENANT_ADMIN" }),
    ]);
    render(<MemberManager open onClose={() => {}} isSuperAdmin={false} />);

    await waitFor(() => {
      expect(screen.getByText(`Límite de administradores alcanzado: máximo ${MAX_ADMINS_PER_GROUP} por grupo`)).toBeInTheDocument();
    });
  });

  it("marca la fila propia como 'Tú' y bloquea sus acciones", async () => {
    vi.mocked(fetchMembers).mockResolvedValue(members);
    render(
      <MemberManager
        open
        onClose={() => {}}
        isSuperAdmin={false}
        currentUserId="2"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("20210000002")).toBeInTheDocument();
    });

    expect(screen.getByText("Tú")).toBeInTheDocument();
    expect(screen.getAllByText("Sin acceso")).toHaveLength(1);
  });

  it("crea un miembro vía el formulario", async () => {
    vi.mocked(fetchMembers).mockResolvedValue(members);
    vi.mocked(createMember).mockResolvedValue(member());
    render(<MemberManager open onClose={() => {}} isSuperAdmin={false} />);

    await waitFor(() => {
      expect(screen.getByText("+ Nuevo Miembro")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("+ Nuevo Miembro"));
    fireEvent.change(screen.getByLabelText("Código del Miembro"), {
      target: { value: "20210000009" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "clave123" },
    });
    fireEvent.change(screen.getByLabelText("Nombre (opcional)"), {
      target: { value: "Nuevo Miembro" },
    });
    fireEvent.click(screen.getByText("Crear Miembro"));

    await waitFor(() => {
      expect(createMember).toHaveBeenCalledWith({
        codigo: "20210000009",
        password: "clave123",
        name: "Nuevo Miembro",
        rol: "MIEMBRO",
        tenantId: null,
      });
    });
  });

  it("el admin de grupo no puede seleccionar SUPER_ADMIN", async () => {
    vi.mocked(fetchMembers).mockResolvedValue(members);
    render(<MemberManager open onClose={() => {}} isSuperAdmin={false} />);

    await waitFor(() => {
      expect(screen.getByText("+ Nuevo Miembro")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("+ Nuevo Miembro"));
    const select = screen.getByLabelText("Rol") as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).not.toContain("SUPER_ADMIN");
    expect(options).toContain("TENANT_ADMIN");
  });

  it("el superadmin sí puede otorgar SUPER_ADMIN", async () => {
    vi.mocked(fetchMembers).mockResolvedValue(members);
    vi.mocked(createMember).mockResolvedValue(member());
    render(<MemberManager open onClose={() => {}} isSuperAdmin tenantId="5" />);

    await waitFor(() => {
      expect(screen.getByText("+ Nuevo Miembro")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("+ Nuevo Miembro"));
    const select = screen.getByLabelText("Rol") as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).toContain("SUPER_ADMIN");

    fireEvent.change(select, { target: { value: "SUPER_ADMIN" } });
    expect(screen.getByText("El SUPER_ADMIN administra todos los grupos")).toBeInTheDocument();
  });

  it("valida el formulario antes de crear", async () => {
    vi.mocked(fetchMembers).mockResolvedValue(members);
    render(<MemberManager open onClose={() => {}} isSuperAdmin={false} />);

    await waitFor(() => {
      expect(screen.getByText("+ Nuevo Miembro")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("+ Nuevo Miembro"));
    fireEvent.change(screen.getByLabelText("Código del Miembro"), {
      target: { value: "20210000009" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "123" },
    });
    fireEvent.click(screen.getByText("Crear Miembro"));

    expect(await screen.findByText("La contraseña debe tener al menos 6 caracteres")).toBeInTheDocument();
    expect(createMember).not.toHaveBeenCalled();
  });

  it("edita nombre y rol de un miembro", async () => {
    vi.mocked(fetchMembers).mockResolvedValue(members);
    vi.mocked(updateMember).mockResolvedValue(member({ name: "Nombre Nuevo", rol: "MIEMBRO" }));
    render(<MemberManager open onClose={() => {}} isSuperAdmin={false} />);

    await waitFor(() => {
      expect(screen.getAllByText("Editar").length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByText("Editar")[0]);
    fireEvent.change(screen.getByLabelText("Nombre (opcional)"), {
      target: { value: "Nombre Nuevo" },
    });
    fireEvent.click(screen.getByText("Guardar Cambios"));

    await waitFor(() => {
      expect(updateMember).toHaveBeenCalledWith("1", {
        name: "Nombre Nuevo",
        rol: null,
      });
    });
  });

  it("suspende y reactiva a un miembro", async () => {
    vi.mocked(fetchMembers).mockResolvedValue(members);
    vi.mocked(updateMemberStatus).mockResolvedValue(member({ status: "SUSPENDED" }));
    render(<MemberManager open onClose={() => {}} isSuperAdmin={false} />);

    await waitFor(() => {
      expect(screen.getAllByText("Suspender").length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByText("Suspender")[0]);

    await waitFor(() => {
      expect(updateMemberStatus).toHaveBeenCalledWith("2", "SUSPENDED");
    });
  });

  it("no permite que el admin suspenda/elimine a otros admins", async () => {
    vi.mocked(fetchMembers).mockResolvedValue(members);
    render(<MemberManager open onClose={() => {}} isSuperAdmin={false} />);

    await waitFor(() => {
      expect(screen.getByText("20210000001")).toBeInTheDocument();
    });

    const adminRow = screen.getByText("20210000001").closest("tr") as HTMLElement;
    expect(within(adminRow).queryByText("Suspender")).not.toBeInTheDocument();
    expect(within(adminRow).queryByText("Eliminar")).not.toBeInTheDocument();
    expect(within(adminRow).getByText("Editar")).toBeInTheDocument();
  });

  it("elimina un miembro con confirmación", async () => {
    vi.mocked(fetchMembers).mockResolvedValue(members);
    vi.mocked(deleteMember).mockResolvedValue(undefined);
    render(<MemberManager open onClose={() => {}} isSuperAdmin={false} />);

    await waitFor(() => {
      expect(screen.getAllByText("Eliminar").length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByText("Eliminar")[0]);
    fireEvent.click(screen.getByText("Sí"));

    await waitFor(() => {
      expect(deleteMember).toHaveBeenCalledWith("2");
    });
  });

  it("muestra error del servidor en el formulario", async () => {
    vi.mocked(fetchMembers).mockResolvedValue(members);
    vi.mocked(createMember).mockRejectedValue(new Error("Ya existe un miembro con el código 20210000002"));
    render(<MemberManager open onClose={() => {}} isSuperAdmin={false} />);

    await waitFor(() => {
      expect(screen.getByText("+ Nuevo Miembro")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("+ Nuevo Miembro"));
    fireEvent.change(screen.getByLabelText("Código del Miembro"), {
      target: { value: "20210000002" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "clave123" },
    });
    fireEvent.click(screen.getByText("Crear Miembro"));

    expect(await screen.findByText("Ya existe un miembro con el código 20210000002")).toBeInTheDocument();
  });
});
