import React, { useState, useEffect, useRef } from 'react';
import type { Tenant } from '../../services/api';
import { createTenant, updateTenant } from '../../services/api';

interface GroupFormProps {
  mode: 'create' | 'edit';
  tenant?: Tenant | null;
  onClose: () => void;
}

interface FormErrors {
  name?: string;
  tenantCode?: string;
  director?: string;
  memberLimit?: string;
  primaryColor?: string;
  logoUrl?: string;
}

export default function GroupForm({ mode, tenant, onClose }: Readonly<GroupFormProps>) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    tenantCode: '',
    director: '',
    memberLimit: '50',
    primaryColor: '#22fefb',
    logoUrl: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Llenar datos si es edición
  useEffect(() => {
    if (mode === 'edit' && tenant) {
      setFormData({
        name: tenant.name,
        tenantCode: tenant.tenantCode,
        director: tenant.director,
        memberLimit: String(tenant.memberLimit),
        primaryColor: tenant.primaryColor ?? '#22fefb',
        logoUrl: tenant.logoUrl ?? '',
      });
    } else {
      setFormData({
        name: '',
        tenantCode: '',
        director: '',
        memberLimit: '50',
        primaryColor: '#22fefb',
        logoUrl: '',
      });
    }
    setErrors({});
    setSubmitError('');
    setSubmitSuccess('');
  }, [mode, tenant]);

  // Focus al modal cuando se abre
  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    modalRef.current?.focus();
    return () => {
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus();
      }
    };
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Mínimo 3 caracteres';
    }

    if (!formData.director.trim()) {
      newErrors.director = 'El director es obligatorio';
    } else if (formData.director.trim().length < 3) {
      newErrors.director = 'Mínimo 3 caracteres';
    }

    if (mode === 'create') {
      if (!formData.tenantCode.trim()) {
        newErrors.tenantCode = 'El código de tenant es obligatorio';
      } else if (!/^[A-Za-z0-9_-]{3,30}$/.test(formData.tenantCode.trim())) {
        newErrors.tenantCode = 'Usa 3-30 caracteres alfanuméricos, "_" o "-"';
      }
    }

    const limit = Number.parseInt(formData.memberLimit);
    if (Number.isNaN(limit) || limit < 1) {
      newErrors.memberLimit = 'Debe ser un número mayor a 0';
    } else if (limit > 1000) {
      newErrors.memberLimit = 'Máximo 1000 miembros';
    }

    const color = formData.primaryColor.trim();
    if (color && !/^#?[0-9A-Fa-f]{6}$/.test(color)) {
      newErrors.primaryColor = 'Usa formato hex (#22fefb)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      if (mode === 'create') {
        await createTenant({
          name: formData.name.trim(),
          tenantCode: formData.tenantCode.trim(),
          director: formData.director.trim(),
          memberLimit: Number(formData.memberLimit),
          primaryColor: formData.primaryColor.trim(),
          logoUrl: formData.logoUrl.trim() || undefined,
        });
        setSubmitSuccess('Grupo creado correctamente');
      } else if (tenant) {
        await updateTenant(tenant.id, {
          name: formData.name.trim(),
          director: formData.director.trim(),
          memberLimit: Number(formData.memberLimit),
          primaryColor: formData.primaryColor.trim(),
          logoUrl: formData.logoUrl.trim() || undefined,
        });
        setSubmitSuccess('Grupo actualizado correctamente');
      }

      globalThis.dispatchEvent(new CustomEvent('tenantsUpdated'));
      setTimeout(() => onClose(), 1200);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Error al procesar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  type FormField = keyof typeof formData;

  const handleChange = (field: FormField, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo al escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const isEdit = mode === 'edit';
  const description = isEdit
    ? 'Modifica la información del grupo de trabajo seleccionado.'
    : 'Registra un nuevo grupo de trabajo en el sistema. Define nombre, director, código de tenant y límite de miembros.';
  
  let submitButtonLabel = isEdit ? 'Guardar Cambios' : 'Registrar Grupo';
  if (submitting) {
    submitButtonLabel = 'Procesando...';
  }

  return (
    <div className="fixed inset-0 flex justify-center items-center z-50 p-4">
      <button
        type="button"
        className="absolute inset-0 w-full h-full bg-(--bg-black)/80 backdrop-blur-sm border-none cursor-default"
        onClick={onClose}
        aria-label="Cerrar modal"
        tabIndex={-1}
      />
      <dialog
        ref={modalRef}
        open
        aria-labelledby="group-form-title"
        className="m-0 max-h-[90dvh] w-full max-w-4xl flex flex-col overflow-y-auto rounded-3xl border border-(--cyan)/30 bg-(--bg-black-gunmetal) p-0 shadow-[0_0_40px_rgba(0,255,255,0.15)] focus:outline-none md:flex-row"
      >
        {/* Panel izquierdo */}
        <div className="relative flex w-full flex-col justify-between overflow-hidden border-b border-(--support-gunmetal) bg-(--bg-eerie) p-5 md:w-1/3 md:border-b-0 md:border-r md:p-10">
          <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-(--cyan) opacity-20 blur-[100px]"></div>
          <div className="relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-(--cyan)">
              {isEdit ? 'Edición' : 'Registro'}
            </span>
            <h2 id="group-form-title" className="mt-2 text-2xl font-display font-bold uppercase leading-tight tracking-tighter text-(--white) md:text-4xl">
              {isEdit ? (<>Editar<br/>Grupo</>) : (<>Crear<br/>Grupo</>)}
            </h2>
            <p className="mt-4 text-xs leading-relaxed text-(--support-grey) md:mt-6">{description}</p>
          </div>
        </div>

        {/* Panel derecho - Formulario */}
        <div className="flex w-full flex-col justify-center bg-(--bg-black-gunmetal) p-5 md:w-2/3 md:p-10">
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-5" noValidate>

            {/* Nombre del grupo */}
            <div className="flex flex-col gap-2 group">
              <div className="flex justify-between items-center">
                <label htmlFor="group-name" className="text-[10px] uppercase tracking-widest text-(--cyan) font-bold">
                  Nombre del Grupo
                </label>
                {errors.name && <span className="text-[9px] uppercase text-(--support-lila) font-bold tracking-widest">{errors.name}</span>}
              </div>
              <input
                id="group-name"
                type="text"
                placeholder="Ej. GLUD"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`bg-(--bg-black) border ${errors.name ? 'border-(--support-lila)' : 'border-(--support-gunmetal)'} rounded-xl px-4 py-3 text-sm text-(--white) focus:outline-none focus:border-(--cyan) focus:shadow-[0_0_15px_rgba(0,255,255,0.2)] transition-all duration-300`}
              />
            </div>

            {/* Director/a del grupo */}
            <div className="flex flex-col gap-2 group">
              <div className="flex justify-between items-center">
                <label htmlFor="group-director" className="text-[10px] uppercase tracking-widest text-(--cyan) font-bold">
                  Director/a del Grupo
                </label>
                {errors.director && <span className="text-[9px] uppercase text-(--support-lila) font-bold tracking-widest">{errors.director}</span>}
              </div>
              <input
                id="group-director"
                type="text"
                placeholder="Ej. Nombre Apellido"
                value={formData.director}
                onChange={(e) => handleChange('director', e.target.value)}
                className={`bg-(--bg-black) border ${errors.director ? 'border-(--support-lila)' : 'border-(--support-gunmetal)'} rounded-xl px-4 py-3 text-sm text-(--white) focus:outline-none focus:border-(--cyan) focus:shadow-[0_0_15px_rgba(0,255,255,0.2)] transition-all duration-300`}
              />
            </div>

            {/* Código de Tenant */}
            <div className="flex flex-col gap-2 group">
              <div className="flex justify-between items-center">
                <label htmlFor="tenant-code" className="text-[10px] uppercase tracking-widest text-(--cyan) font-bold">
                  Código Tenant
                </label>
                {errors.tenantCode && <span className="text-[9px] uppercase text-(--support-lila) font-bold tracking-widest">{errors.tenantCode}</span>}
              </div>
              <input
                id="tenant-code"
                type="text"
                placeholder="Ej. GLUD_2024"
                value={formData.tenantCode}
                onChange={(e) => handleChange('tenantCode', e.target.value)}
                disabled={isEdit}
                className={`bg-(--bg-black) border ${errors.tenantCode ? 'border-(--support-lila)' : 'border-(--support-gunmetal)'} rounded-xl px-4 py-3 text-sm text-(--white) focus:outline-none focus:border-(--cyan) focus:shadow-[0_0_15px_rgba(0,255,255,0.2)] transition-all duration-300 ${isEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {isEdit && (
                <span className="text-[9px] uppercase text-(--support-grey) tracking-widest">No editable después de la creación</span>
              )}
            </div>

            {/* Límite de miembros */}
            <div className="flex flex-col gap-2 group">
              <div className="flex justify-between items-center">
                <label htmlFor="member-limit" className="text-[10px] uppercase tracking-widest text-(--cyan) font-bold">
                  Límite de Miembros
                </label>
                {errors.memberLimit && <span className="text-[9px] uppercase text-(--support-lila) font-bold tracking-widest">{errors.memberLimit}</span>}
              </div>
              <input
                id="member-limit"
                type="number"
                min="1"
                max="1000"
                placeholder="50"
                value={formData.memberLimit}
                onChange={(e) => handleChange('memberLimit', e.target.value)}
                className={`bg-(--bg-black) border ${errors.memberLimit ? 'border-(--support-lila)' : 'border-(--support-gunmetal)'} rounded-xl px-4 py-3 text-sm text-(--white) focus:outline-none focus:border-(--cyan) focus:shadow-[0_0_15px_rgba(0,255,255,0.2)] transition-all duration-300`}
              />
            </div>

            {/* Color del tema (carnet y dashboard del grupo) */}
            <div className="flex flex-col gap-2 group">
              <div className="flex justify-between items-center">
                <label htmlFor="primary-color" className="text-[10px] uppercase tracking-widest text-(--cyan) font-bold">
                  Color del Grupo
                </label>
                {errors.primaryColor && <span className="text-[9px] uppercase text-(--support-lila) font-bold tracking-widest">{errors.primaryColor}</span>}
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="primary-color"
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  className="h-11 w-14 shrink-0 cursor-pointer rounded-xl border border-(--support-gunmetal) bg-(--bg-black) p-1"
                />
                <input
                  id="primary-color-hex"
                  type="text"
                  placeholder="#22fefb"
                  value={formData.primaryColor}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  className={`bg-(--bg-black) border ${errors.primaryColor ? 'border-(--support-lila)' : 'border-(--support-gunmetal)'} rounded-xl px-4 py-3 text-sm font-mono text-(--white) focus:outline-none focus:border-(--cyan) transition-all duration-300`}
                />
              </div>
              <span className="text-[9px] uppercase text-(--support-grey) tracking-widest">
                Color que se usa en el carnet y dashboard de este grupo
              </span>
            </div>

            {/* Logo del grupo (opcional) */}
            <div className="flex flex-col gap-2 group">
              <div className="flex justify-between items-center">
                <label htmlFor="logo-url" className="text-[10px] uppercase tracking-widest text-(--cyan) font-bold">
                  URL del Logo <span className="text-(--support-grey)">(opcional)</span>
                </label>
                {errors.logoUrl && <span className="text-[9px] uppercase text-(--support-lila) font-bold tracking-widest">{errors.logoUrl}</span>}
              </div>
              <input
                id="logo-url"
                type="url"
                placeholder="https://grupo.com/logo.png"
                value={formData.logoUrl}
                onChange={(e) => handleChange('logoUrl', e.target.value)}
                className={`bg-(--bg-black) border ${errors.logoUrl ? 'border-(--support-lila)' : 'border-(--support-gunmetal)'} rounded-xl px-4 py-3 text-sm text-(--white) focus:outline-none focus:border-(--cyan) focus:shadow-[0_0_15px_rgba(0,255,255,0.2)] transition-all duration-300`}
              />
            </div>

            {/* Mensajes de estado */}
            {submitError && (
              <div className="bg-(--support-lila)/10 border border-(--support-lila)/40 rounded-xl px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-(--support-lila)">
                {submitError}
              </div>
            )}
            {submitSuccess && (
              <div className="bg-(--cyan)/10 border border-(--cyan)/40 rounded-xl px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-(--cyan) shadow-[0_0_10px_rgba(0,255,255,0.15)]">
                {submitSuccess}
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-(--support-gunmetal)">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="text-[10px] uppercase tracking-widest text-(--support-grey) hover:text-(--support-lila) font-bold transition-all duration-300 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-(--cyan)/10 border border-(--cyan) text-(--cyan) px-6 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold shadow-[0_0_15px_rgba(0,255,255,0.2)] hover:bg-(--cyan) hover:text-(--bg-black) hover:shadow-[0_0_25px_rgba(0,255,255,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitButtonLabel}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
}
