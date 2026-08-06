import { useCallback, useEffect, useState } from "react";
import { createGuest, fetchMyGuests } from "../../services/api";
import type { Guest } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { applyTenantTheme } from "../../utils/theme";
import { formatDate } from "../../utils/format";
import GuestStatusBadge from "../carnet/GuestStatusBadge";

type FormState = {
  codigo: string;
  name: string;
  email: string;
};

type InviteError =
  | { kind: "already_active"; message: string }
  | { kind: "limit"; message: string }
  | { kind: "other"; message: string }
  | null;

function guestLink(token: string | null): string {
  return `${globalThis.location.origin}/invitado?token=${encodeURIComponent(token ?? "")}`;
}

export default function GuestManager() {
  const user = useAuthStore((state) => state.user);
  const role = user?.role ?? "";

  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({ codigo: "", name: "", email: "" });
  const [error, setError] = useState<InviteError>(null);
  const [lastCreated, setLastCreated] = useState<Guest | null>(null);
  const [copied, setCopied] = useState(false);

  const loadGuests = useCallback(async () => {
    try {
      const list = await fetchMyGuests();
      setGuests(list);
      const active = list.find((g) => g.status === "ACTIVE");
      if (active?.primaryColor) applyTenantTheme(active.primaryColor);
    } catch {
      /* sin conexión: dejar el estado vacío */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGuests();
  }, [loadGuests]);

  const submitInvite = async (): Promise<void> => {
    setError(null);
    setCopied(false);

    if (!form.codigo.trim() || !form.name.trim()) {
      setError({ kind: "other", message: "Código y nombre son obligatorios" });
      return;
    }

    setSubmitting(true);
    try {
      const guest = await createGuest({
        codigo: form.codigo.trim(),
        name: form.name.trim(),
        email: form.email.trim() || undefined,
      });
      setLastCreated(guest);
      setGuests((prev) => [guest, ...prev]);
      setForm({ codigo: "", name: "", email: "" });
      setFormOpen(false);
      if (guest.primaryColor) applyTenantTheme(guest.primaryColor);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al crear el invitado";
      if (/409|ya tiene|invitado activo/i.test(message)) {
        setError({ kind: "already_active", message });
      } else if (/403|límite|límite|maximo/i.test(message)) {
        setError({ kind: "limit", message });
      } else {
        setError({ kind: "other", message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void submitInvite();
  };

  const copyLink = useCallback(async () => {
    if (!lastCreated) return;
    try {
      await navigator.clipboard.writeText(guestLink(lastCreated.accessToken));
      setCopied(true);
      globalThis.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* portapapeles no disponible */
    }
  }, [lastCreated]);

  const isAdmin = role === "TENANT_ADMIN";
  const isSuperAdmin = role === "SUPER_ADMIN";

  return (
    <section className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 font-sans sm:px-6">
      {/* Navegación por rol */}
      {(isAdmin || isSuperAdmin) && (
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <span className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-slate-500">
            Panel:
          </span>
          {isAdmin && (
            <a
              href="/admin"
              className="rounded-full border border-(--accent)/40 bg-(--accent)/10 px-5 py-2 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-(--accent) transition-all hover:bg-(--accent) hover:text-[#050916]"
            >
              Dashboard de admin
            </a>
          )}
          {isSuperAdmin && (
            <a
              href="/super-admin"
              className="rounded-full border border-(--accent)/40 bg-(--accent)/10 px-5 py-2 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-(--accent) transition-all hover:bg-(--accent) hover:text-[#050916]"
            >
              Dashboard de super admin
            </a>
          )}
        </div>
      )}

      {/* Cabecera de invitados */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-[0.1em] text-white">Mis Invitados</h2>
          <p className="mt-1 text-[0.7rem] uppercase tracking-[0.2em] text-slate-500">
            Registro de accesos temporales generados
          </p>
        </div>
        {!formOpen && (
          <button
            type="button"
            onClick={() => {
              setFormOpen(true);
              setError(null);
            }}
            className="rounded-full border border-(--accent)/40 bg-(--accent)/10 px-6 py-2.5 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-(--accent) shadow-[0_0_15px_rgba(var(--accent-rgb),0.15)] transition-all hover:bg-(--accent) hover:text-[#050916]"
          >
            + Invitar
          </button>
        )}
      </div>

      {/* Formulario de invitación */}
      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-3xl border border-white/15 bg-[#0b1120]/95 p-6 sm:p-8"
          noValidate
        >
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label htmlFor="guest-codigo" className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-(--accent)">
                Código
              </label>
              <input
                id="guest-codigo"
                type="text"
                placeholder="Ej. 101011000"
                value={form.codigo}
                onChange={(e) => setForm((prev) => ({ ...prev, codigo: e.target.value }))}
                className="rounded-xl border border-(--support-gunmetal) bg-[#070b14] px-4 py-3 text-sm text-white focus:border-(--accent) focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="guest-name" className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-(--accent)">
                Nombre
              </label>
              <input
                id="guest-name"
                type="text"
                placeholder="Ej. Invitada Uno"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="rounded-xl border border-(--support-gunmetal) bg-[#070b14] px-4 py-3 text-sm text-white focus:border-(--accent) focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="guest-email" className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-(--accent)">
                Email <span className="text-slate-600">(opcional)</span>
              </label>
              <input
                id="guest-email"
                type="email"
                placeholder="invitado@mail.com"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                className="rounded-xl border border-(--support-gunmetal) bg-[#070b14] px-4 py-3 text-sm text-white focus:border-(--accent) focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-(--support-lila)/40 bg-(--support-lila)/10 px-4 py-3 text-[0.7rem] font-bold uppercase tracking-widest text-(--support-lila)">
              {error.message}
            </p>
          )}

          <div className="mt-6 flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-(--accent) px-6 py-2.5 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#050916] transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {submitting ? "Creando..." : "Crear invitado"}
            </button>
          </div>
        </form>
      )}

      {/* Enlace generado */}
      {lastCreated && (
        <div className="mt-6 rounded-3xl border border-(--accent)/40 bg-(--accent)/5 p-6 sm:p-8">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.25em] text-(--accent)">
            Invitado creado · {lastCreated.name} ({lastCreated.codigo})
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Comparte este enlace. Vence en un máximo de 2 horas y solo funciona hasta esa hora:
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <code className="min-w-0 flex-1 break-all rounded-xl border border-white/15 bg-[#070b14] px-4 py-3 font-mono text-xs text-(--accent)">
              {guestLink(lastCreated.accessToken)}
            </code>
            <button
              type="button"
              onClick={copyLink}
              className="rounded-full border border-(--accent)/40 px-5 py-2.5 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-(--accent) transition-all hover:bg-(--accent) hover:text-[#050916]"
            >
              {copied ? "¡Copiado!" : "Copiar enlace"}
            </button>
          </div>
          <p className="mt-3 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Válido hasta {formatDate(lastCreated.expiresAt)}
          </p>
        </div>
      )}

      {/* Registro de invitados */}
      <div className="mt-8 overflow-x-auto rounded-3xl border border-white/15 bg-[#0b1120]/95">
        <table className="w-full min-w-[42rem] text-left">
          <thead>
            <tr className="border-b border-white/15 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-slate-500">
              <th className="px-6 py-4">Nombre</th>
              <th className="px-6 py-4">Código</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">Creado</th>
              <th className="px-6 py-4">Enlace válido hasta</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-[0.7rem] uppercase tracking-[0.2em] text-slate-500">
                  Cargando registro...
                </td>
              </tr>
            )}
            {!loading && guests.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-[0.7rem] uppercase tracking-[0.2em] text-slate-500">
                  Aún no has creado invitados
                </td>
              </tr>
            )}
            {guests.map((guest) => (
              <tr key={guest.id} className="border-b border-white/5 last:border-b-0">
                <td className="px-6 py-4 text-sm font-semibold text-white">{guest.name}</td>
                <td className="px-6 py-4 font-mono text-sm text-slate-300">{guest.codigo}</td>
                <td className="px-6 py-4">
                  <GuestStatusBadge status={guest.status} />
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">{formatDate(guest.createdAt)}</td>
                <td className="px-6 py-4 text-sm text-slate-400">{formatDate(guest.expiresAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
