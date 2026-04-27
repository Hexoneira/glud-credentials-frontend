import React, { useState, useEffect } from 'react';

type CreateGroupFormProps = {
  onClose?: () => void;
};

export default function CreateGroupForm({ onClose = () => {} }: CreateGroupFormProps) {
  // Estado para controlar la visibilidad del modal
  const [isOpen, setIsOpen] = useState(false);

  // Escuchar el evento personalizado para abrir el modal
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('openCreateGroupModal', handleOpen);
    return () => window.removeEventListener('openCreateGroupModal', handleOpen);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  // 1. Estado simplificado: Solo Nombre, Director y Tenant Code
  const [formData, setFormData] = useState(() => ({
    name: '',
    director: '',
    code:
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? `HX_${crypto.randomUUID()}`
        : `HX_${Date.now()}_${Math.random().toString(36).slice(2, 10)}` // Código autogenerado
  }));

  // Estado para errores individuales
  const [errors, setErrors] = useState({ name: false, director: false });

  // 2. Función al enviar el formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación: Comprobamos si alguno está vacío
    const newErrors = {
      name: formData.name.trim() === '',
      director: formData.director.trim() === ''
    };
    
    setErrors(newErrors);

    // Si hay algún error, detenemos el envío
    if (newErrors.name || newErrors.director) {
      return;
    }
    
    console.log("Datos del CRUD listos para enviar:", formData);
    alert("¡Grupo creado con éxito!");
    handleClose();
  };

  // Si no está abierto, no renderiza nada
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[var(--bg-black)]/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      
      <div className="bg-[var(--bg-black-gunmetal)] border border-[var(--cyan)]/30 rounded-3xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden shadow-[0_0_40px_rgba(0,255,255,0.15)] transition-all duration-500">
        
        {/* PANEL IZQUIERDO (Simplificado) */}
        <div className="w-full md:w-1/3 bg-[var(--bg-eerie)] p-10 border-b md:border-b-0 md:border-r border-[var(--support-gunmetal)] flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-[var(--cyan)] rounded-full blur-[100px] opacity-20"></div>
          <div className="relative z-10">
            <span className="text-[10px] text-[var(--cyan)] uppercase tracking-widest font-bold">CRUD_Module</span>
            <h2 className="text-4xl font-display font-bold text-[var(--white)] mt-2 leading-tight uppercase tracking-tighter">
              Create<br/>Work<br/>Group
            </h2>
            <p className="text-[var(--support-grey)] text-xs mt-6 leading-relaxed">
              Registra un nuevo grupo de trabajo en el sistema. Asigna un nombre, define al director responsable y verifica el código único del tenant.
            </p>
          </div>
        </div>

        {/* PANEL DERECHO (Solo los 3 campos solicitados) */}
        <div className="w-full md:w-2/3 p-10 flex flex-col justify-center bg-[var(--bg-black-gunmetal)]">
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6">
            
            {/* Input 1: Group Name */}
            <div className="flex flex-col gap-2 group">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase tracking-widest text-[var(--cyan)] font-bold group-focus-within:shadow-[0_0_8px_rgba(0,255,255,0.5)] transition-shadow">Nombre del Grupo</label>
                {errors.name && <span className="text-[9px] uppercase text-[var(--support-lila)] font-bold tracking-widest shadow-[0_0_8px_rgba(255,102,178,0.5)]">Campo Requerido</span>}
              </div>
              <input 
                type="text" 
                placeholder="Ej. Equipo de Desarrollo Web"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className={`bg-[var(--bg-black)] border ${errors.name ? 'border-[var(--support-lila)] shadow-[0_0_10px_rgba(255,102,178,0.2)]' : 'border-[var(--support-gunmetal)]'} rounded-xl px-4 py-3 text-sm text-[var(--white)] focus:outline-none focus:border-[var(--cyan)] focus:shadow-[0_0_15px_rgba(0,255,255,0.2)] transition-all duration-300`}
              />
            </div>

            {/* Input 2: Director */}
            <div className="flex flex-col gap-2 group">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase tracking-widest text-[var(--cyan)] font-bold group-focus-within:shadow-[0_0_8px_rgba(0,255,255,0.5)] transition-shadow">Director / Responsable</label>
                {errors.director && <span className="text-[9px] uppercase text-[var(--support-lila)] font-bold tracking-widest shadow-[0_0_8px_rgba(255,102,178,0.5)]">Campo Requerido</span>}
              </div>
              <input 
                type="text" 
                placeholder="Nombre del director"
                value={formData.director}
                onChange={(e) => setFormData({...formData, director: e.target.value})}
                className={`bg-[var(--bg-black)] border ${errors.director ? 'border-[var(--support-lila)] shadow-[0_0_10px_rgba(255,102,178,0.2)]' : 'border-[var(--support-gunmetal)]'} rounded-xl px-4 py-3 text-sm text-[var(--white)] focus:outline-none focus:border-[var(--cyan)] focus:shadow-[0_0_15px_rgba(0,255,255,0.2)] transition-all duration-300`}
              />
            </div>

            {/* Input 3: Tenant Code (Solo lectura) */}
            <div className="flex flex-col gap-2 group">
              <label className="text-[10px] uppercase tracking-widest text-[var(--cyan)] font-bold">Tenant Code</label>
              <input 
                type="text" 
                value={formData.code}
                readOnly
                className="bg-[var(--bg-black)]/50 border border-[var(--support-gunmetal)] rounded-xl px-4 py-3 text-sm text-[var(--cyan)] opacity-70 cursor-not-allowed shadow-[inset_0_0_10px_rgba(0,255,255,0.05)]"
              />
              <span className="text-[9px] uppercase text-[var(--cyan)] font-bold tracking-widest mt-1 opacity-70">Autogenerado por el sistema</span>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-[var(--support-gunmetal)]">
              <button 
                type="button" 
                onClick={handleClose}
                className="text-[10px] uppercase tracking-widest text-[var(--support-grey)] hover:text-[var(--support-lila)] hover:shadow-[0_0_8px_rgba(255,102,178,0.4)] font-bold transition-all duration-300"
              >
                Cancelar
              </button>
              
              {/* Botón de Confirmar con Neon */}
              <button
                type="submit"
                className="flex items-center gap-2 bg-[var(--cyan)]/10 border border-[var(--cyan)] text-[var(--cyan)] px-6 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold shadow-[0_0_15px_rgba(0,255,255,0.2)] hover:bg-[var(--cyan)] hover:text-[var(--bg-black)] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)] transition-all duration-300"
              >
                Registrar Grupo
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}