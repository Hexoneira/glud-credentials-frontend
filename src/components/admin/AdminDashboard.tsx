import { useCallback, useEffect, useState } from "react";
import { fetchMemberCurrent, fetchMembers, fetchMyGuests, fetchTodayAttendance } from "../../services/api";
import type { Member, MemberCurrent } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { applyTenantTheme } from "../../utils/theme";
import { roleLabel } from "../layout/AppNav";
import MemberManager from "./MemberManager";
import AttendanceScanner from "./AttendanceScanner";
import EmptyState from "../ui/EmptyState";

type Status = "loading" | "error" | "ready";
type View = "members" | "attendance";

function StatusBadge({ status }: Readonly<{ status: string }>) {
  const active = status === "ACTIVE";
  return (
    <span
      className={`inline-block shrink-0 rounded-full px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.15em] ${
        active
          ? "bg-(--accent)/10 text-(--accent)"
          : "bg-red-500/10 text-red-400"
      }`}
    >
      {active ? "Activo" : "Suspendido"}
    </span>
  );
}

function KpiCard({
  testId,
  label,
  value,
  valueClass = "text-(--white)",
}: Readonly<{
  testId: string;
  label: string;
  value: number;
  valueClass?: string;
}>) {
  return (
    <div
      data-testid={testId}
      className="rounded-xl border border-(--support-gunmetal) bg-(--bg-black-gunmetal) px-4 py-3.5"
    >
      <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-(--support-grey)">
        {label}
      </p>
      <p className={`mt-1.5 text-2xl font-bold leading-none ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

export default function AdminDashboard() {
  const [status, setStatus] = useState<Status>("loading");
  const [members, setMembers] = useState<Member[]>([]);
  const [member, setMember] = useState<MemberCurrent | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [memberManagerOpen, setMemberManagerOpen] = useState(false);
  const [view, setView] = useState<View>("members");
  const [activeGuests, setActiveGuests] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState(0);

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

    // Métricas complementarias: si fallan, el dashboard principal no se cae
    try {
      const guests = await fetchMyGuests();
      setActiveGuests(guests.filter((g) => g.status === "ACTIVE").length);
    } catch {
      setActiveGuests(0);
    }
    try {
      const records = await fetchTodayAttendance();
      setTodayAttendance(records.length);
    } catch {
      setTodayAttendance(0);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const handleMembersUpdated = () => {
      void load();
    };
    globalThis.addEventListener("membersUpdated", handleMembersUpdated);
    return () => globalThis.removeEventListener("membersUpdated", handleMembersUpdated);
  }, [load]);

  const memberCountLabel = `${members.length} miembro${members.length === 1 ? "" : "s"}`;
  const activeMembers = members.filter((m) => m.status === "ACTIVE").length;

  const tabClass = (active: boolean): string =>
    `border-b-2 pb-2.5 text-sm transition-colors ${
      active
        ? "border-(--accent) font-semibold text-(--white)"
        : "border-transparent font-medium text-(--support-grey) hover:text-(--white)"
    }`;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-14 pt-6 sm:px-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-(--accent)">
            Mi grupo de trabajo
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-(--white) md:text-3xl">
            {member?.tenantName ?? "Cargando..."}
          </h1>
          <p className="mt-1.5 max-w-md text-xs leading-relaxed text-(--support-grey)">
            Miembros, invitados y asistencia de tu grupo al día.
          </p>
        </div>
        {status === "ready" && (
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-full border border-(--accent)/40 bg-(--accent)/10 px-3.5 py-1.5 text-[0.6rem] font-bold uppercase tracking-widest text-(--accent)">
              {memberCountLabel}
            </span>
            <button
              type="button"
              onClick={() => setMemberManagerOpen(true)}
              className="rounded-full border border-(--accent) bg-(--accent)/10 px-4 py-1.5 text-[0.6rem] font-bold uppercase tracking-widest text-(--accent) transition-all hover:bg-(--accent) hover:text-[#050916]"
            >
              + Gestionar Miembros
            </button>
          </div>
        )}
      </div>

      {/* KPIs: estado del grupo de un vistazo */}
      {status === "ready" && (
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard testId="kpi-miembros" label="Miembros" value={members.length} />
          <KpiCard testId="kpi-activos" label="Miembros activos" value={activeMembers} valueClass="text-(--accent)" />
          <KpiCard testId="kpi-invitados" label="Invitados activos" value={activeGuests} valueClass="text-(--accent)" />
          <KpiCard testId="kpi-asistencia" label="Asistencia hoy" value={todayAttendance} valueClass="text-(--support-beer)" />
        </div>
      )}

      {/* Tabs */}
      <div
        className="mt-6 flex max-w-full gap-6 overflow-x-auto border-b border-(--support-gunmetal)"
        role="tablist"
        aria-label="Secciones del panel"
      >
        <button
          type="button"
          role="tab"
          aria-selected={view === "members"}
          onClick={() => setView("members")}
          className={tabClass(view === "members")}
        >
          Miembros
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "attendance"}
          onClick={() => setView("attendance")}
          className={tabClass(view === "attendance")}
        >
          Asistencia
        </button>
      </div>

      <div className="mt-5">
        {view === "attendance" && <AttendanceScanner />}

        {view === "members" && status === "loading" && (
          <div className="rounded-xl border border-(--support-gunmetal) p-10 text-center text-[0.6rem] uppercase tracking-widest text-(--support-grey)">
            Cargando miembros...
          </div>
        )}

        {view === "members" && status === "error" && (
          <div className="rounded-xl border border-(--support-lila)/40 bg-(--support-lila)/10 p-10 text-center">
            <p className="text-[0.7rem] font-bold uppercase tracking-widest text-(--support-lila)">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-4 rounded-full border border-(--support-lila)/40 px-5 py-2 text-[0.65rem] font-bold uppercase tracking-widest text-(--support-lila) transition-colors hover:bg-(--support-lila)/10"
            >
              Reintentar
            </button>
          </div>
        )}

        {view === "members" && status === "ready" && members.length === 0 && (
          <EmptyState
            icon="users"
            title="No hay miembros registrados"
            description="Agrega miembros a tu grupo para que puedan acceder al coworking con su carnet digital."
            actionLabel="Gestionar Miembros"
            onAction={() => setMemberManagerOpen(true)}
          />
        )}

        {view === "members" && status === "ready" && members.length > 0 && (
          <>
            {/* Desktop: tabla */}
            <div className="hidden overflow-x-auto rounded-xl border border-(--support-gunmetal) bg-(--bg-black-gunmetal) md:block">
              <table className="w-full min-w-[36rem] text-left">
                <thead>
                  <tr className="border-b border-(--support-gunmetal) text-[0.6rem] uppercase tracking-widest text-(--support-grey)">
                    <th className="px-4 py-3.5">Código</th>
                    <th className="px-4 py-3.5">Usuario</th>
                    <th className="px-4 py-3.5">Email</th>
                    <th className="px-4 py-3.5">Rol</th>
                    <th className="px-4 py-3.5">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-b border-(--support-gunmetal)/60 transition-colors last:border-b-0 hover:bg-(--bg-black)/40">
                      <td className="px-4 py-3.5 font-mono text-sm text-(--accent)">{m.codigo}</td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-(--white)">{m.username}</td>
                      <td className="px-4 py-3.5 text-sm text-(--support-grey)">{m.email ?? "—"}</td>
                      <td className="px-4 py-3.5 text-sm text-(--white)">{roleLabel(m.rol)}</td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={m.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Móvil: tarjetas */}
            <div className="grid gap-3 md:hidden">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border border-(--support-gunmetal) bg-(--bg-black-gunmetal) p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold text-(--accent)">{m.codigo}</p>
                      <p className="mt-1 truncate text-sm font-semibold text-(--white)">{m.username}</p>
                      <p className="mt-0.5 truncate text-xs text-(--support-grey)">{m.email ?? "—"}</p>
                    </div>
                    <StatusBadge status={m.status} />
                  </div>
                  <p className="mt-3 border-t border-(--support-gunmetal)/60 pt-3 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-(--support-grey)">
                    Rol: <span className="text-(--white)">{roleLabel(m.rol)}</span>
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <MemberManager
        open={memberManagerOpen}
        onClose={() => setMemberManagerOpen(false)}
        tenantId={null}
        tenantName={member?.tenantName}
        isSuperAdmin={false}
        currentUserId={member?.id}
      />
    </div>
  );
}
