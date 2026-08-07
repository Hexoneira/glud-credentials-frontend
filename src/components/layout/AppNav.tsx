import { useAuthStore } from "../../store/authStore";

export function roleLabel(rol: string): string {
  switch (rol) {
    case "TENANT_ADMIN":
      return "Admin";
    case "SUPER_ADMIN":
      return "Super Admin";
    case "MIEMBRO":
      return "Miembro";
    default:
      return "Invitado";
  }
}

type NavLink = {
  href: string;
  label: string;
  show: boolean;
};

const linksFor = (isAdmin: boolean, isSuperAdmin: boolean): NavLink[] =>
  [
    { href: "/carnet", label: "Carnet", show: true },
    { href: "/invitados", label: "Invitados", show: true },
    { href: "/admin", label: "Mi grupo", show: isAdmin },
    { href: "/super-admin", label: "Grupos", show: isSuperAdmin },
  ].filter((link) => link.show);

/**
 * Barra de navegación única para todas las vistas autenticadas.
 * Los enlaces dependen del rol y la ruta activa se resalta con el acento del tenant.
 */
export default function AppNav() {
  const user = useAuthStore((state) => state.user);
  const role = user?.role ?? "";
  const links = linksFor(role === "TENANT_ADMIN", role === "SUPER_ADMIN");
  const pathname = globalThis.location?.pathname ?? "/";
  const initial = user?.tenantName?.charAt(0) ?? "G";
  const codigo = user?.codigo || user?.id || "";

  const handleLogout = () => {
    useAuthStore.getState().logout();
    globalThis.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 border-b border-(--support-gunmetal) bg-[#0c1017]/95 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between">
        <a href="/carnet" className="flex w-fit items-center gap-3" aria-label="Ir a mi carnet">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-(--accent)/30 bg-(--accent)/10 text-sm font-black text-(--accent)"
            aria-hidden="true"
          >
            {initial}
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-black uppercase tracking-[0.18em] text-(--white)">
              GLUD Credenciales
            </span>
            <span className="block text-[0.6rem] font-bold uppercase tracking-[0.22em] text-(--accent)">
              {roleLabel(role)}
            </span>
          </span>
        </a>

        <nav className="flex items-center gap-1 overflow-x-auto md:gap-2" aria-label="Navegación principal">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "shrink-0 rounded-full border border-(--accent)/40 bg-(--accent)/10 px-4 py-2 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-(--accent)"
                    : "shrink-0 rounded-full px-4 py-2 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-(--support-grey) transition-colors hover:text-(--accent)"
                }
              >
                {link.label}
              </a>
            );
          })}

          <div className="ml-auto flex shrink-0 items-center gap-3 md:ml-4 md:border-l md:border-(--support-gunmetal) md:pl-4">
            {codigo && (
              <span className="hidden font-mono text-xs tracking-wider text-(--support-grey) sm:inline">
                {codigo}
              </span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-(--support-grey) transition-colors hover:text-(--support-lila)"
            >
              Cerrar sesión
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
