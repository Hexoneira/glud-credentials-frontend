import React, { useState } from "react";
import type { Tenant } from "../../services/api";
import WorkgroupsTable from "./WorkgroupsTable";
import CreateGroupForm from "./CreateGroupForm";
import EditGroupForm from "./EditGroupForm";

export default function SuperAdminDashboard() {
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  const handleCreate = () => {
    setCreateFormOpen(true);
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
  };

  const handleCloseCreateForm = () => {
    setCreateFormOpen(false);
  };

  const handleCloseEditForm = () => {
    setEditingTenant(null);
  };

  // Escuchar evento del sidebar para abrir el modal de crear
  React.useEffect(() => {
    const handleOpenCreate = () => handleCreate();
    globalThis.addEventListener("openCreateGroupModal", handleOpenCreate);
    return () =>
      globalThis.removeEventListener("openCreateGroupModal", handleOpenCreate);
  }, []);

  return (
    <>
      {/* Encabezado de la sección */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Grupos de Trabajo
          </h1>
          <p className="text-(--support-grey) max-w-md text-sm leading-relaxed">
            Administra la creación, edición, suspensión y reactivación de
            tenants.
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
      <div className="mb-10">
        <WorkgroupsTable onEdit={handleEdit} />
      </div>

      {/* Modal de formulario */}
      <CreateGroupForm
        isOpen={createFormOpen}
        onClose={handleCloseCreateForm}
      />
      <EditGroupForm tenant={editingTenant} onClose={handleCloseEditForm} />
    </>
  );
}
