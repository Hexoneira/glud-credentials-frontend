import { useCallback, useEffect, useMemo, useState } from "react";
import type { Tenant } from "../../services/api";
import {
  deleteTenant,
  fetchTenants,
  reactivateTenant,
  suspendTenant,
} from "../../services/api";

interface WorkgroupsTableProps {
  onEdit?: (tenant: Tenant) => void;
  onManageMembers?: (tenant: Tenant) => void;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function WorkgroupsTable({
  onEdit,
  onManageMembers,
}: Readonly<WorkgroupsTableProps>) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const loadTenants = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchTenants();
      setTenants(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error al cargar los grupos de trabajo"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  useEffect(() => {
    const handleRefresh = () => {
      loadTenants();
    };
    globalThis.addEventListener("tenantsUpdated", handleRefresh);
    return () =>
      globalThis.removeEventListener("tenantsUpdated", handleRefresh);
  }, [loadTenants]);

  const handleToggleStatus = async (tenant: Tenant) => {
    setActionLoading(tenant.id);
    try {
      if (tenant.status === "ACTIVE") {
        await suspendTenant(tenant.id);
      } else {
        await reactivateTenant(tenant.id);
      }
      await loadTenants();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error al cambiar el estado del grupo"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (tenantId: string) => {
    setActionLoading(tenantId);
    try {
      await deleteTenant(tenantId);
      setConfirmDelete(null);
      await loadTenants();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error al eliminar el grupo"));
    } finally {
      setActionLoading(null);
    }
  };

  const totalGroups = tenants.length;
  const activeGroups = tenants.filter(
    (tenant) => tenant.status === "ACTIVE",
  ).length;
  const totalMembers = useMemo(
    () =>
      tenants.reduce(
        (acc, tenant) => acc + (Number(tenant.currentMembers) || 0),
        0,
      ),
    [tenants],
  );

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="bg-[var(--support-lila)]/10 border border-[var(--support-lila)]/40 rounded-xl px-4 py-3 text-sm text-[var(--support-lila)] flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => {
              setError("");
              loadTenants();
            }}
            className="text-[10px] uppercase tracking-widest font-bold hover:text-[var(--white)] transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-black-gunmetal)] p-5 rounded-2xl border border-[var(--support-gunmetal)]">
          <span className="text-[10px] uppercase tracking-widest text-[var(--support-grey)] mb-1 block">
            Total Grupos
          </span>
          <span className="text-3xl font-bold text-[var(--white)]">
            {totalGroups}
          </span>
        </div>
        <div className="bg-[var(--bg-black-gunmetal)] p-5 rounded-2xl border border-[var(--cyan)]/30">
          <span className="text-[10px] uppercase tracking-widest text-[var(--support-grey)] mb-1 block">
            Activos
          </span>
          <span className="text-3xl font-bold text-[var(--cyan)]">
            {activeGroups}
          </span>
        </div>
        <div className="bg-[var(--bg-black-gunmetal)] p-5 rounded-2xl border border-[var(--support-beer)]/30">
          <span className="text-[10px] uppercase tracking-widest text-[var(--support-grey)] mb-1 block">
            Miembros Totales
          </span>
          <span className="text-3xl font-bold text-[var(--support-beer)]">
            {totalMembers}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--support-gunmetal)] bg-[var(--bg-black-gunmetal)]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--bg-black)] border-b border-[var(--support-gunmetal)]">
            <tr>
              <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[var(--support-grey)]">
                Grupo
              </th>
              <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[var(--support-grey)]">
                Tenant Code
              </th>
              <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[var(--support-grey)]">
                Director
              </th>
              <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[var(--support-grey)]">
                Miembros
              </th>
              <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[var(--support-grey)]">
                Estado
              </th>
              <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[var(--support-grey)] text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-6 text-center text-[var(--support-grey)]"
                >
                  Cargando grupos de trabajo...
                </td>
              </tr>
            )}

            {!loading && tenants.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-6 text-center text-[var(--support-grey)]"
                >
                  No hay grupos de trabajo registrados.
                </td>
              </tr>
            )}

            {!loading &&
              tenants.map((tenant) => {
                const isActionLoading = actionLoading === tenant.id;
                const memberLimit = Number(tenant.memberLimit) || 0;
                const currentMembers = Number(tenant.currentMembers) || 0;
                const statusClass =
                  tenant.status === "ACTIVE"
                    ? "bg-[var(--cyan)]/10 text-[var(--cyan)] border-[var(--cyan)]/30"
                    : "bg-[var(--support-lila)]/10 text-[var(--support-lila)] border-[var(--support-lila)]/30";

                let toggleActionLabel =
                  tenant.status === "ACTIVE" ? "Suspender" : "Reactivar";
                if (isActionLoading) {
                  toggleActionLabel = "Procesando...";
                }

                return (
                  <tr
                    key={tenant.id}
                    className="border-b border-[var(--support-gunmetal)]/60 hover:bg-[var(--bg-black)]/20"
                  >
                    <td className="px-5 py-4 font-semibold text-[var(--white)]">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 shrink-0 rounded-full border border-white/20"
                          style={{ backgroundColor: tenant.primaryColor || "#22fefb" }}
                          title={`Color del grupo: ${tenant.primaryColor || "#22fefb"}`}
                        />
                        {tenant.name}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[var(--support-grey)]">
                      {tenant.tenantCode}
                    </td>
                    <td className="px-5 py-4 text-[var(--white)]">
                      {tenant.director || "Sin asignar"}
                    </td>
                    <td className="px-5 py-4 text-[var(--white)]">
                      {currentMembers} / {memberLimit}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest border font-bold ${statusClass}`}
                      >
                        {tenant.status === "ACTIVE" ? "Activo" : "Suspendido"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {onManageMembers && (
                          <button
                            onClick={() => onManageMembers(tenant)}
                            disabled={isActionLoading}
                            className="text-[10px] font-bold uppercase tracking-widest text-[var(--support-beer)] hover:text-[var(--cyan)] transition-colors disabled:opacity-50"
                          >
                            Miembros
                          </button>
                        )}
                        <button
                          onClick={() => onEdit?.(tenant)}
                          disabled={isActionLoading}
                          className="text-[10px] font-bold uppercase tracking-widest text-[var(--support-grey)] hover:text-[var(--cyan)] transition-colors disabled:opacity-50"
                        >
                          Editar
                        </button>

                        {confirmDelete === tenant.id ? (
                          <>
                            <button
                              onClick={() => handleDelete(tenant.id)}
                              disabled={isActionLoading}
                              className="text-[10px] font-bold uppercase tracking-widest text-[var(--support-lila)] hover:text-[var(--white)] transition-colors disabled:opacity-50"
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="text-[10px] font-bold uppercase tracking-widest text-[var(--support-grey)] hover:text-[var(--white)] transition-colors"
                            >
                              No
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(tenant.id)}
                            disabled={isActionLoading}
                            className="text-[10px] font-bold uppercase tracking-widest text-(--support-grey) hover:text-(--support-lila) transition-colors disabled:opacity-50"
                          >
                            Eliminar
                          </button>
                        )}

                        <button
                          onClick={() => handleToggleStatus(tenant)}
                          disabled={isActionLoading}
                          className={`rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 ${
                            tenant.status === "ACTIVE"
                              ? "border border-(--support-gunmetal) text-(--support-grey) hover:border-(--support-lila) hover:text-(--support-lila)"
                              : "bg-(--cyan)/20 border border-(--cyan) text-(--cyan) hover:bg-(--cyan) hover:text-(--bg-black)"
                          }`}
                        >
                          {toggleActionLabel}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
