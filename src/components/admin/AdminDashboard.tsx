import { useCallback, useEffect, useState } from "react";
import { fetchMemberCurrent, fetchMembers } from "../../services/api";
import type { Member, MemberCurrent } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { applyTenantTheme } from "../../utils/theme";

type Status = "loading" | "error" | "ready";

export default function AdminDashboard() {
  const [status, setStatus] = useState<Status>("loading");
  const [members, setMembers] = useState<Member[]>([]);
  const [member, setMember] = useState<MemberCurrent | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const [current, list] = await Promise.all([fetchMemberCurrent(), fetchMembers()]);
      setMember(current);
      setMembers(list);
      if (current.primaryColor) applyTenantTheme(current.primaryColor);
      setStatus("ready");
    } catch (error: unknown) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "No se pudieron cargar los miembros");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleLogout = () => {
    useAuthStore.getState().logout();
    globalThis.location.href = "/";
  };

  const roleLabel = (rol: string): string => {
    switch (rol) {
      case "TENANT_ADMIN":
        return "Admin";
      case "SUPER_ADMIN":
        return "Super Admin";
      case "MIEMBRO":
        return "Miembro";
      default:
        return "Invitado";
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-(--bg-black-gunmetal) font-sans text-(--white)">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col justify-between border-r border-(--support-gunmetal) bg-(--bg-black-gunmetal) p-6">
        <div>
          <div className="mb-12 flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded"
              style={{ backgroundColor: "color-mix(in srgb, var(--accent) 18%, transparent)", color: "var(--accent)" }}
            >
              <span className="font-bold">{member?.tenantName?.charAt(0) ?? "H"}</span>
            </div>
            <div>
              <h1 className="text-lg font-bold uppercase tracking-widest">{member?.tenantName ?? "Grupo"}</h1>
              <p className="text-[10px] uppercase tracking-widest text-(--accent)">Admin</p>
            </div>
          </div>

          <nav className="flex flex-col gap-4 text-sm font-semibold">
            <a
              href="/admin"
              className="flex items-center gap-3 border-l-2 border-(--accent) pl-3 text-(--accent)"
            >
              <span>Miembros</span>
            </a>
            <a href="/carnet" className="flex items-center gap-3 border-l-2 border-transparent pl-3 text-(--support-grey) hover:text-(--accent)">
              <span>Mi carnet</span>
            </a>
          </nav>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="text-left text-xs text-(--support-grey) transition-colors hover:text-(--support-lila)"
        >
          Cerrar sesión
        </button>
      </aside>

      {/* Contenido */}
      <main className="flex flex-1 flex-col overflow-y-auto bg-(--bg-eerie)">
        <header className="flex items-center justify-between border-b border-(--support-gunmetal) px-10 py-6">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-(--accent) shadow-[0_0_6px_var(--accent)]"></div>
            <span className="text-[10px] uppercase tracking-widest text-(--support-grey)">
              Panel de Administración
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-(--support-grey)">
            {member?.name || member?.codigo || "Admin"} · {member?.tenantName ?? ""}
          </span>
        </header>

        <div className="p-10">
          <div className="mb-10 flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Miembros del Grupo</h1>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-(--support-grey)">
                Miembros registrados en {member?.tenantName ?? "tu grupo de trabajo"}.
              </p>
            </div>
            {status === "ready" && (
              <span className="rounded-full border border-(--accent)/40 bg-(--accent)/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-(--accent)">
                {members.length} miembro{members.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {status === "loading" && (
            <div className="rounded-3xl border border-(--support-gunmetal) p-10 text-center text-[10px] uppercase tracking-widest text-(--support-grey)">
              Cargando miembros...
            </div>
          )}

          {status === "error" && (
            <div className="rounded-3xl border border-(--support-lila)/40 bg-(--support-lila)/10 p-10 text-center text-[10px] font-bold uppercase tracking-widest text-(--support-lila)">
              {errorMessage}
            </div>
          )}

          {status === "ready" && (
            <div className="overflow-x-auto rounded-3xl border border-(--support-gunmetal)">
              <table className="w-full min-w-[42rem] text-left">
                <thead>
                  <tr className="border-b border-(--support-gunmetal) text-[10px] uppercase tracking-widest text-(--support-grey)">
                    <th className="px-6 py-4">Código</th>
                    <th className="px-6 py-4">Usuario</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Rol</th>
                    <th className="px-6 py-4">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-[10px] uppercase tracking-widest text-(--support-grey)">
                        No hay miembros registrados
                      </td>
                    </tr>
                  )}
                  {members.map((m) => (
                    <tr key={m.id} className="border-b border-(--support-gunmetal)/60 last:border-b-0">
                      <td className="px-6 py-4 font-mono text-sm text-(--accent)">{m.codigo}</td>
                      <td className="px-6 py-4 text-sm font-semibold">{m.username}</td>
                      <td className="px-6 py-4 text-sm text-(--support-grey)">{m.email ?? "—"}</td>
                      <td className="px-6 py-4 text-sm">{roleLabel(m.rol)}</td>
                      <td className="px-6 py-4">
                        <span
                          className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
                          style={
                            m.status === "ACTIVE"
                              ? { color: "var(--accent)", backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)" }
                              : { color: "#f87171", backgroundColor: "rgba(248,113,113,0.12)" }
                          }
                        >
                          {m.status === "ACTIVE" ? "Activo" : "Suspendido"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
