import React, { useState } from "react";
import type { Tenant } from "../../services/api";
import WorkgroupsTable from "./WorkgroupsTable";
import CreateGroupForm from "./CreateGroupForm";
import EditGroupForm from "./EditGroupForm";
import MemberManager from "../admin/MemberManager";

export default function SuperAdminDashboard() {
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [membersTenant, setMembersTenant] = useState<Tenant | null>(null);

  const handleCreate = () => {
    setCreateFormOpen(true);
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
  };

  const handleManageMembers = (tenant: Tenant) => {
    setMembersTenant(tenant);
  };

  const handleCloseCreateForm = () => {
    setCreateFormOpen(false);
  };

  const handleCloseEditForm = () => {
    setEditingTenant(null);
  };

  const handleCloseMembers = () => {
    setMembersTenant(null);
  };

  // Escuchar evento del sidebar para abrir el modal de crear
  React.useEffect(() => {
    const handleOpenCreate = () => handleCreate();
    globalThis.addEventListener("openCreateGroupModal", handleOpenCreate);
    return () =>
      globalThis.removeEventListener("openCreateGroupModal", handleOpenCreate);
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-14 pt-6 sm:px-6">
      {/* Encabezado de la sección */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-(--accent)">
            Panel general
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-(--white) md:text-3xl">
            Grupos de Trabajo
          </h1>
          <p className="mt-1.5 max-w-md text-xs leading-relaxed text-(--support-grey)">
            Crea, edita, suspende y reactiva los grupos y sus miembros.
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="hidden md:flex items-center gap-2 bg-(--cyan)/10 border border-(--cyan) text-(--cyan) px-5 py-2.5 rounded-full text-[10px] uppercase tracking-widest font-bold shadow-[0_0_15px_rgba(0,255,255,0.2)] hover:bg-(--cyan) hover:text-(--bg-black) hover:shadow-[0_0_25px_rgba(0,255,255,0.5)] transition-all duration-300"
        >
          + Nuevo Grupo
        </button>
      </div>

      {/* Tabla de grupos */}
      <WorkgroupsTable onEdit={handleEdit} onManageMembers={handleManageMembers} />

      {/* Modal de formulario */}
      <CreateGroupForm
        isOpen={createFormOpen}
        onClose={handleCloseCreateForm}
      />
      <EditGroupForm tenant={editingTenant} onClose={handleCloseEditForm} />
      <MemberManager
        open={membersTenant !== null}
        onClose={handleCloseMembers}
        tenantId={membersTenant?.id ?? null}
        tenantName={membersTenant?.name}
        isSuperAdmin
      />
    </div>
  );
}
