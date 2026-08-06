import { useCallback, useEffect, useRef, useState } from "react";
import {
  createMember,
  deleteMember,
  fetchMembers,
  updateMember,
  updateMemberStatus,
} from "../../services/api";
import type { Member } from "../../services/api";

export const MAX_ADMINS_PER_GROUP = 2;

interface MemberManagerProps {
  open: boolean;
  onClose: () => void;
  tenantId?: string | null;
  tenantName?: string;
  isSuperAdmin: boolean;
  currentUserId?: string;
}

interface MemberForm {
  codigo: string;
  password: string;
  email: string;
  rol: string;
}

const EMPTY_FORM: MemberForm = { codigo: "", password: "", email: "", rol: "MIEMBRO" };

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  TENANT_ADMIN: "Admin",
  MIEMBRO: "Miembro",
  INVITADO: "Invitado",
};

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function MemberManager({
  open,
  onClose,
  tenantId = null,
  tenantName = "",
  isSuperAdmin,
  currentUserId,
}: Readonly<MemberManagerProps>) {
  const modalRef = useRef<HTMLDialogElement>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState<MemberForm>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await fetchMembers(tenantId ?? undefined);
      setMembers(data);
    } catch (error: unknown) {
      setLoadError(getErrorMessage(error, "Error al cargar los miembros"));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (open) {
      void loadMembers();
      setView("list");
      setEditing(null);
      setForm(EMPTY_FORM);
      setFormError("");
      setFormSuccess("");
      setConfirmDelete(null);
      modalRef.current?.focus();
    }
  }, [open, loadMembers]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const adminsInGroup = members.filter((m) => m.rol === "TENANT_ADMIN").length;
  const adminSlotsLeft = Math.max(0, MAX_ADMINS_PER_GROUP - adminsInGroup);
  const isAdminAtLimit = adminSlotsLeft === 0;

  const canUseSuperAdminRole = isSuperAdmin;
  const canManageRow = (member: Member): boolean => {
    if (member.id === currentUserId) return false;
    if (!isSuperAdmin && member.rol === "SUPER_ADMIN") return false;
    return true;
  };
  const canToggleStatus = (member: Member): boolean => {
    if (!canManageRow(member)) return false;
    if (!isSuperAdmin && member.rol === "TENANT_ADMIN") return false;
    return true;
  };
  const canDelete = (member: Member): boolean => canToggleStatus(member);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setFormSuccess("");
    setView("create");
  };

  const openEdit = (member: Member) => {
    setEditing(member);
    setForm({
      codigo: member.codigo,
      password: "",
      email: member.email ?? "",
      rol: member.rol,
    });
    setFormError("");
    setFormSuccess("");
    setView("edit");
  };

  const adminLimitReachedFor = (rol: string): boolean =>
    rol === "TENANT_ADMIN" && isAdminAtLimit && !(editing?.rol === "TENANT_ADMIN");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (adminLimitReachedFor(form.rol)) {
      setFormError(`Cada grupo admite máximo ${MAX_ADMINS_PER_GROUP} administradores`);
      return;
    }
    if (view === "create" && !/^[A-Za-z0-9_-]{3,30}$/.test(form.codigo.trim())) {
      setFormError("El código debe tener 3-30 caracteres alfanuméricos, \"_\" o \"-\"");
      return;
    }
    if (view === "create" && form.password.length < 6) {
      setFormError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setFormError("El email no es válido");
      return;
    }

    setSubmitting(true);
    try {
      if (view === "create") {
        await createMember({
          codigo: form.codigo.trim(),
          password: form.password,
          email: form.email.trim() || null,
          rol: form.rol,
          tenantId: isSuperAdmin ? tenantId : null,
        });
      } else if (editing) {
        const payload: { email?: string | null; rol?: string | null } = {
          email: form.email.trim() || null,
          rol: form.rol !== editing.rol ? form.rol : null,
        };
        await updateMember(editing.id, payload);
      }
      globalThis.dispatchEvent(new CustomEvent("membersUpdated"));
      setFormSuccess(view === "create" ? "Miembro creado correctamente" : "Miembro actualizado correctamente");
      setTimeout(() => {
        void loadMembers();
        setView("list");
      }, 900);
    } catch (error: unknown) {
      setFormError(getErrorMessage(error, "Error al guardar el miembro"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (member: Member) => {
    setActionLoading(member.id);
    try {
      await updateMemberStatus(member.id, member.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE");
      globalThis.dispatchEvent(new CustomEvent("membersUpdated"));
      await loadMembers();
    } catch (error: unknown) {
      setLoadError(getErrorMessage(error, "Error al cambiar el estado del miembro"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (member: Member) => {
    setActionLoading(member.id);
    try {
      await deleteMember(member.id);
      setConfirmDelete(null);
      globalThis.dispatchEvent(new CustomEvent("membersUpdated"));
      await loadMembers();
    } catch (error: unknown) {
      setLoadError(getErrorMessage(error, "Error al eliminar el miembro"));
    } finally {
      setActionLoading(null);
    }
  };

  if (!open) return null;

  const roleOptions = isSuperAdmin
    ? ["MIEMBRO", "TENANT_ADMIN", "SUPER_ADMIN", "INVITADO"]
    : ["MIEMBRO", "TENANT_ADMIN", "INVITADO"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default border-none bg-(--bg-black)/80 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar modal"
        tabIndex={-1}
      />
      <dialog
        ref={modalRef}
        open
        aria-label="Gestión de miembros"
        className="m-0 flex max-h-[90dvh] w-full max-w-5xl flex-col overflow-y-auto rounded-3xl border border-(--cyan)/30 bg-(--bg-black-gunmetal) p-0 shadow-[0_0_40px_rgba(0,255,255,0.15)] focus:outline-none"
      >
        <div className="flex items-center justify-between border-b border-(--support-gunmetal) px-6 py-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-(--cyan)">
              Gestión de Miembros
            </span>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-(--white)">
              {view === "list" && (tenantName ? `Miembros de ${tenantName}` : "Miembros del Grupo")}
              {view === "create" && "Nuevo Miembro"}
              {view === "edit" && `Editar ${editing?.codigo ?? "Miembro"}`}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] font-bold uppercase tracking-widest text-(--support-grey) transition-colors hover:text-(--support-lila)"
          >
            Cerrar
          </button>
        </div>

        <div className="p-6">
          {loadError && (
            <div className="mb-4 flex items-center justify-between rounded-xl border border-(--support-lila)/40 bg-(--support-lila)/10 px-4 py-3 text-sm text-(--support-lila)">
              <span>{loadError}</span>
              <button
                onClick={() => {
                  setLoadError("");
                  void loadMembers();
                }}
                className="text-[10px] font-bold uppercase tracking-widest transition-colors hover:text-(--white)"
              >
                Reintentar
              </button>
            </div>
          )}

          {view === "list" && (
            <>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full border border-(--cyan)/40 bg-(--cyan)/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-(--cyan)">
                  {members.length} miembro{members.length === 1 ? "" : "s"}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-widest text-(--support-grey)">
                    Admins: {adminsInGroup}/{MAX_ADMINS_PER_GROUP}
                  </span>
                  <button
                    type="button"
                    onClick={openCreate}
                    className="flex items-center gap-2 rounded-full border border-(--cyan) bg-(--cyan)/10 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-(--cyan) shadow-[0_0_15px_rgba(0,255,255,0.2)] transition-all duration-300 hover:bg-(--cyan) hover:text-(--bg-black) hover:shadow-[0_0_25px_rgba(0,255,255,0.5)]"
                  >
                    + Nuevo Miembro
                  </button>
                </div>
              </div>

              {isAdminAtLimit && (
                <div className="mb-4 rounded-xl border border-(--support-beer)/40 bg-(--support-beer)/10 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-(--support-beer)">
                  Límite de administradores alcanzado: máximo {MAX_ADMINS_PER_GROUP} por grupo
                </div>
              )}

              <div className="overflow-x-auto rounded-2xl border border-(--support-gunmetal) bg-(--bg-black)">
                <table className="w-full min-w-[38rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-(--support-gunmetal) text-[10px] uppercase tracking-widest text-(--support-grey)">
                      <th className="px-5 py-4">Código</th>
                      <th className="px-5 py-4">Email</th>
                      <th className="px-5 py-4">Rol</th>
                      <th className="px-5 py-4">Estado</th>
                      <th className="px-5 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-[10px] uppercase tracking-widest text-(--support-grey)">
                          Cargando miembros...
                        </td>
                      </tr>
                    )}
                    {!loading && members.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-[10px] uppercase tracking-widest text-(--support-grey)">
                          No hay miembros registrados
                        </td>
                      </tr>
                    )}
                    {!loading &&
                      members.map((member) => {
                        const isSelf = member.id === currentUserId;
                        const busy = actionLoading === member.id;
                        return (
                          <tr key={member.id} className="border-b border-(--support-gunmetal)/60 last:border-b-0">
                            <td className="px-5 py-4 font-mono text-sm text-(--cyan)">
                              {member.codigo}
                              {isSelf && (
                                <span className="ml-2 rounded-full border border-(--support-gunmetal) px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-(--support-grey)">
                                  Tú
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-(--support-grey)">{member.email ?? "—"}</td>
                            <td className="px-5 py-4 font-semibold text-(--white)">{ROLE_LABELS[member.rol] ?? member.rol}</td>
                            <td className="px-5 py-4">
                              <span
                                className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
                                style={
                                  member.status === "ACTIVE"
                                    ? { color: "var(--accent)", backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)" }
                                    : { color: "#f87171", backgroundColor: "rgba(248,113,113,0.12)" }
                                }
                              >
                                {member.status === "ACTIVE" ? "Activo" : "Suspendido"}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-3">
                                {canManageRow(member) ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => openEdit(member)}
                                      disabled={busy}
                                      className="text-[10px] font-bold uppercase tracking-widest text-(--support-grey) transition-colors hover:text-(--cyan) disabled:opacity-50"
                                    >
                                      Editar
                                    </button>
                                    {canToggleStatus(member) && (
                                      <button
                                        type="button"
                                        onClick={() => void handleToggleStatus(member)}
                                        disabled={busy}
                                        className="text-[10px] font-bold uppercase tracking-widest text-(--support-grey) transition-colors hover:text-(--support-beer) disabled:opacity-50"
                                      >
                                        {busy ? "Procesando..." : member.status === "ACTIVE" ? "Suspender" : "Reactivar"}
                                      </button>
                                    )}
                                    {canDelete(member) &&
                                      (confirmDelete === member.id ? (
                                        <span className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => void handleDelete(member)}
                                            disabled={busy}
                                            className="text-[10px] font-bold uppercase tracking-widest text-(--support-lila) transition-colors hover:text-(--white)"
                                          >
                                            Sí
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setConfirmDelete(null)}
                                            className="text-[10px] font-bold uppercase tracking-widest text-(--support-grey) transition-colors hover:text-(--white)"
                                          >
                                            No
                                          </button>
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => setConfirmDelete(member.id)}
                                          disabled={busy}
                                          className="text-[10px] font-bold uppercase tracking-widest text-(--support-grey) transition-colors hover:text-(--support-lila) disabled:opacity-50"
                                        >
                                          Eliminar
                                        </button>
                                      ))}
                                  </>
                                ) : (
                                  <span className="text-[9px] uppercase tracking-widest text-(--support-grey)">
                                    Sin acceso
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {view !== "list" && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              {view === "create" && (
                <div className="flex flex-col gap-2">
                  <label htmlFor="member-codigo" className="text-[10px] font-bold uppercase tracking-widest text-(--cyan)">
                    Código del Miembro
                  </label>
                  <input
                    id="member-codigo"
                    type="text"
                    placeholder="Ej. 20210000002"
                    value={form.codigo}
                    onChange={(e) => setForm((prev) => ({ ...prev, codigo: e.target.value }))}
                    className="rounded-xl border border-(--support-gunmetal) bg-(--bg-black) px-4 py-3 text-sm text-(--white) transition-all duration-300 focus:border-(--cyan) focus:shadow-[0_0_15px_rgba(0,255,255,0.2)] focus:outline-none"
                  />
                </div>
              )}

              {view === "create" && (
                <div className="flex flex-col gap-2">
                  <label htmlFor="member-password" className="text-[10px] font-bold uppercase tracking-widest text-(--cyan)">
                    Contraseña
                  </label>
                  <input
                    id="member-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    className="rounded-xl border border-(--support-gunmetal) bg-(--bg-black) px-4 py-3 text-sm text-(--white) transition-all duration-300 focus:border-(--cyan) focus:shadow-[0_0_15px_rgba(0,255,255,0.2)] focus:outline-none"
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label htmlFor="member-email" className="text-[10px] font-bold uppercase tracking-widest text-(--cyan)">
                  Email <span className="text-(--support-grey)">(opcional)</span>
                </label>
                <input
                  id="member-email"
                  type="email"
                  placeholder="ejemplo@glud.org"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="rounded-xl border border-(--support-gunmetal) bg-(--bg-black) px-4 py-3 text-sm text-(--white) transition-all duration-300 focus:border-(--cyan) focus:shadow-[0_0_15px_rgba(0,255,255,0.2)] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="member-rol" className="text-[10px] font-bold uppercase tracking-widest text-(--cyan)">
                  Rol
                </label>
                <select
                  id="member-rol"
                  value={form.rol}
                  onChange={(e) => setForm((prev) => ({ ...prev, rol: e.target.value }))}
                  disabled={adminLimitReachedFor(form.rol)}
                  className="rounded-xl border border-(--support-gunmetal) bg-(--bg-black) px-4 py-3 text-sm text-(--white) transition-all duration-300 focus:border-(--cyan) focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {roleOptions.map((rol) => (
                    <option key={rol} value={rol} disabled={adminLimitReachedFor(rol)}>
                      {ROLE_LABELS[rol] ?? rol}
                    </option>
                  ))}
                </select>
                {form.rol === "TENANT_ADMIN" && !canUseSuperAdminRole && (
                  <span className="text-[9px] uppercase tracking-widest text-(--support-grey)">
                    Cada grupo admite máximo {MAX_ADMINS_PER_GROUP} administradores
                  </span>
                )}
                {form.rol === "SUPER_ADMIN" && canUseSuperAdminRole && (
                  <span className="text-[9px] uppercase tracking-widest text-(--support-beer)">
                    El SUPER_ADMIN administra todos los grupos
                  </span>
                )}
              </div>

              {formError && (
                <div className="rounded-xl border border-(--support-lila)/40 bg-(--support-lila)/10 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-(--support-lila)">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="rounded-xl border border-(--cyan)/40 bg-(--cyan)/10 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-(--cyan) shadow-[0_0_10px_rgba(0,255,255,0.15)]">
                  {formSuccess}
                </div>
              )}

              <div className="mt-2 flex items-center justify-between border-t border-(--support-gunmetal) pt-4">
                <button
                  type="button"
                  onClick={() => setView("list")}
                  disabled={submitting}
                  className="text-[10px] font-bold uppercase tracking-widest text-(--support-grey) transition-all duration-300 hover:text-(--support-lila) disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-full border border-(--cyan) bg-(--cyan)/10 px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-(--cyan) shadow-[0_0_15px_rgba(0,255,255,0.2)] transition-all duration-300 hover:bg-(--cyan) hover:text-(--bg-black) hover:shadow-[0_0_25px_rgba(0,255,255,0.5)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Procesando..." : view === "create" ? "Crear Miembro" : "Guardar Cambios"}
                </button>
              </div>
            </form>
          )}
        </div>
      </dialog>
    </div>
  );
}
