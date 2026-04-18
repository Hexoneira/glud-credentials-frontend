import React from 'react';

const tenantsData = [
  {
    id: 'NODE-01-GL',
    name: 'GLUD',
    subtitle: 'LINUX USER GROUP',
    population: '34',
    status: 'ACTIVE',
    iconColor: 'var(--cyan)'
  },
  {
    id: 'NODE-02-IN',
    name: 'ACM',
    subtitle: 'ACM GROUP',
    population: '45',
    status: 'ACTIVE',
    iconColor: 'var(--purple)'
  },
  {
    id: 'NODE-03-CS',
    name: 'CyberSec',
    subtitle: 'SID SOCIEDAD DE INOVACIÓN Y DESARROLLO',
    population: '218',
    status: 'SUSPENDED',
    // Usamos el rosa/rojo que tienes en tu CSS para alertas
    iconColor: 'var(--support-lila)' 
  }
];

export default function WorkgroupsTable() {
  return (
    <div className="flex flex-col gap-4">
      
      {/* ENCABEZADOS DE LA TABLA */}
      <div className="grid grid-cols-5 px-6 text-[10px] uppercase tracking-widest text-[var(--support-grey)] font-bold mb-2">
        <div className="col-span-1">Tenant Identity</div>
        <div className="col-span-1">Node Code</div>
        <div className="col-span-1">Population</div>
        <div className="col-span-1">Status Vector</div>
        <div className="col-span-1 text-right">Protocol</div>
      </div>

      {/* FILAS DE LA TABLA (Mapeo de los datos) */}
      <div className="flex flex-col gap-4">
        {tenantsData.map((tenant) => {
          const isActive = tenant.status === 'ACTIVE';

          return (
            <div 
              key={tenant.id} 
              className="grid grid-cols-5 items-center bg-[var(--bg-black-gunmetal)] p-5 rounded-2xl border border-[var(--support-gunmetal)] hover:border-[var(--support-grey)] transition-colors"
            >
              
              {/* Columna 1: Identidad e Ícono */}
              <div className="flex items-center gap-4">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--bg-black)] border border-[var(--support-gunmetal)]"
                >
                  {/* Simulamos un ícono con un recuadro de color */}
                  <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: tenant.iconColor }}></div>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-base text-[var(--white)]">{tenant.name}</span>
                  <span className="text-[9px] uppercase tracking-widest text-[var(--support-grey)]">{tenant.subtitle}</span>
                </div>
              </div>

              {/* Columna 2: Código de Nodo (Badge) */}
              <div>
                <span className="bg-[var(--bg-black)] border border-[var(--support-gunmetal)] rounded-full px-3 py-1 text-[10px] font-bold text-[var(--cyan)] tracking-widest">
                  {tenant.id}
                </span>
              </div>

              {/* Columna 3: Población */}
              <div className="flex items-baseline gap-1">
                <span className="font-bold text-lg text-[var(--white)]">{tenant.population}</span>
                <span className="text-[9px] uppercase tracking-widest text-[var(--support-grey)]">MEMBERS</span>
              </div>

              {/* Columna 4: Estado */}
              <div className="flex items-center gap-2">
                <span 
                  className={`w-2 h-2 rounded-full ${isActive ? 'bg-[var(--cyan)] shadow-[0_0_8px_var(--cyan)]' : 'bg-[var(--support-lila)] shadow-[0_0_8px_var(--support-lila)]'}`}
                ></span>
                <span 
                  className={`text-[10px] font-bold tracking-widest ${isActive ? 'text-[var(--cyan)]' : 'text-[var(--support-lila)]'}`}
                >
                  {tenant.status}
                </span>
              </div>

              {/* Columna 5: Acciones (Protocolo) */}
              <div className="flex items-center justify-end gap-6">
                {/* Ícono de editar (Lápiz genérico) */}
                <button className="text-[var(--support-grey)] hover:text-[var(--white)] transition-colors">
                </button>
                
                {/* Botón de acción dinámica según el estado */}
                {isActive ? (
                  <button className="border border-[var(--support-gunmetal)] text-[var(--support-grey)] rounded-full px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:border-[var(--support-grey)] transition-all">
                    Suspend
                  </button>
                ) : (
                  <button className="bg-[var(--cyan)] text-[var(--bg-black)] rounded-full px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:shadow-[0_0_15px_rgba(0,255,255,0.4)] transition-all">
                    Reactivate
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}