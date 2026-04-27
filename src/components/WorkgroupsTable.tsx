import React from 'react';

export const tenantsData = [
  {
    id: 'NODE-01-GL',
    name: 'GLUD',
    subtitle: 'LINUX USER GROUP',
    director: 'Linus Torvalds',
    population: '34',
    status: 'ACTIVE',
    iconColor: 'var(--cyan)',
    shadowColor: 'rgba(0, 255, 255, 0.25)'
  },
  {
    id: 'NODE-02-IN',
    name: 'ACM',
    subtitle: 'ACM GROUP',
    director: 'Alan Turing',
    population: '45',
    status: 'ACTIVE',
    iconColor: 'var(--support-beer)',
    shadowColor: 'rgba(242, 169, 0, 0.25)'
  },
  {
    id: 'NODE-03-CS',
    name: 'SID',
    subtitle: 'SOCIEDAD DE INNOVACIÓN Y DESARROLLO',
    director: 'Ada Lovelace',
    population: '40',
    status: 'SUSPENDED',
    iconColor: 'var(--support-lila)',
    shadowColor: 'rgba(255, 102, 178, 0.25)'
  }
];

export default function WorkgroupsTable() {
  // Estadísticas globales derivadas de los datos
  const totalGroups = tenantsData.length;
  const activeGroups = tenantsData.filter(t => t.status === 'ACTIVE').length;
  const totalMembers = tenantsData.reduce((acc, t) => acc + (parseInt(t.population) || 0), 0);

  return (
    <div className="flex flex-col gap-8">
      
      {/* ESTADÍSTICAS GLOBALES DE LA TABLA (Parte Superior) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Workgroups', value: totalGroups, color: 'text-[var(--white)]', border: 'border-[var(--support-gunmetal)]', glow: 'shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:border-[var(--white)]/20' },
          { label: 'Active Workgroups', value: activeGroups, color: 'text-[var(--cyan)]', border: 'border-[var(--cyan)]/30', glow: 'shadow-[0_0_15px_rgba(0,255,255,0.1)] hover:shadow-[0_0_25px_rgba(0,255,255,0.2)] hover:border-[var(--cyan)]/50' },
          { label: 'Global Population', value: totalMembers, color: 'text-[var(--support-beer)]', border: 'border-[var(--support-beer)]/30', glow: 'shadow-[0_0_15px_rgba(242,169,0,0.1)] hover:shadow-[0_0_25px_rgba(242,169,0,0.2)] hover:border-[var(--support-beer)]/50' },
        ].map((stat, i) => (
          <div key={i} className={`bg-[var(--bg-black-gunmetal)] p-6 rounded-2xl border ${stat.border} ${stat.glow} transition-all duration-300 flex flex-col justify-center`}>
            <span className="text-[10px] uppercase tracking-widest text-[var(--support-grey)] mb-2">{stat.label}</span>
            <span className={`text-4xl font-bold font-display ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* REJILLA DE TARJETAS DE TRABAJO (Reemplaza a la tabla tradicional) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {tenantsData.map((tenant) => {
          const isActive = tenant.status === 'ACTIVE';

          return (
            <div 
              key={tenant.id} 
              className={`bg-[var(--bg-black-gunmetal)] rounded-3xl border border-[var(--support-gunmetal)] flex flex-col overflow-hidden group transition-all duration-300`}
              style={{
                boxShadow: `0 0 15px rgba(0,0,0,0.5)`,
                borderColor: 'var(--support-gunmetal)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = tenant.iconColor;
                e.currentTarget.style.boxShadow = `0 0 25px ${tenant.shadowColor}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--support-gunmetal)';
                e.currentTarget.style.boxShadow = `0 0 15px rgba(0,0,0,0.5)`;
              }}
            >
              {/* CABECERA DE LA TARJETA */}
              <div className="p-6 border-b border-[var(--support-gunmetal)] flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--bg-black)] border border-[var(--support-gunmetal)] shadow-inner">
                    <div className="w-5 h-5 rounded-md shadow-[0_0_10px_currentColor]" style={{ backgroundColor: tenant.iconColor, color: tenant.iconColor }}></div>
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-bold text-xl text-[var(--white)] tracking-tight">{tenant.name}</h3>
                    <span className="text-[9px] uppercase tracking-widest text-[var(--support-grey)] mt-1">{tenant.subtitle}</span>
                  </div>
                </div>
                {/* Badge de Estado */}
                <div className={`px-3 py-1.5 rounded-full text-[9px] font-bold tracking-widest flex items-center gap-2 border ${isActive ? 'bg-[var(--cyan)]/10 text-[var(--cyan)] border-[var(--cyan)]/30' : 'bg-[var(--support-lila)]/10 text-[var(--support-lila)] border-[var(--support-lila)]/30'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[var(--cyan)] shadow-[0_0_5px_var(--cyan)]' : 'bg-[var(--support-lila)] shadow-[0_0_5px_var(--support-lila)]'}`}></span>
                  {tenant.status}
                </div>
              </div>

              {/* CUERPO DE LA TARJETA (Estadísticas Específicas) */}
              <div className="p-6 flex-1 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-widest text-[var(--support-grey)]">Node Code</span>
                  <span className="text-xs font-mono font-bold text-[var(--white)] bg-[var(--bg-black)] px-2 py-1 rounded border border-[var(--support-gunmetal)]">
                    {tenant.id}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-widest text-[var(--support-grey)]">Population</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-bold text-lg text-[var(--white)]">{tenant.population}</span>
                    <span className="text-[9px] uppercase tracking-widest text-[var(--support-grey)]">Members</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-widest text-[var(--support-grey)]">Director</span>
                  <span className="text-sm font-bold text-[var(--white)]">{tenant.director}</span>
                </div>
              </div>

              {/* PIE DE LA TARJETA (Acciones al fondo) */}
              <div className="p-4 bg-[var(--bg-black)] border-t border-[var(--support-gunmetal)] flex items-center justify-between gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                
                <div className="flex gap-4 px-2">
                  <button className="text-[10px] font-bold uppercase tracking-widest text-[var(--support-grey)] hover:text-[var(--cyan)] transition-colors">
                    Edit
                  </button>
                  <button className="text-[10px] font-bold uppercase tracking-widest text-[var(--support-grey)] hover:text-[var(--support-lila)] transition-colors">
                    Delete
                  </button>
                </div>
                
                {isActive ? (
                  <button className="border border-[var(--support-gunmetal)] text-[var(--support-grey)] rounded-full px-5 py-2 text-[10px] font-bold uppercase tracking-widest hover:border-[var(--support-lila)] hover:text-[var(--support-lila)] transition-all">
                    Suspend
                  </button>
                ) : (
                  <button className="bg-[var(--cyan)]/20 border border-[var(--cyan)] text-[var(--cyan)] rounded-full px-5 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--cyan)] hover:text-[var(--bg-black)] hover:shadow-[0_0_15px_rgba(0,255,255,0.4)] transition-all">
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