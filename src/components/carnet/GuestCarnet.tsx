import { useCallback, useEffect, useState } from "react";
import { fetchGuestAccess } from "../../services/api";
import type { Guest } from "../../services/api";
import { applyTenantTheme } from "../../utils/theme";
import GuestTOTPCard from "../carnet/GuestTOTPCard";

type GuestCarnetProps = {
  token: string;
};

type State =
  | { kind: "loading" }
  | { kind: "error"; reason: "expired" | "invalid" | "network" }
  | { kind: "ready"; guest: Guest };

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function GuestCarnet({ token }: Readonly<GuestCarnetProps>) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!token) {
        setState({ kind: "error", reason: "invalid" });
        return;
      }
      try {
        const guest = await fetchGuestAccess(token);
        if (cancelled) return;
        applyTenantTheme(guest.primaryColor);
        setState({ kind: "ready", guest });
      } catch (error: unknown) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "";
        const status = (error as { status?: number })?.status;
        setState({
          kind: "error",
          reason:
            status === 410 || /expirado/i.test(message)
              ? "expired"
              : status === 404
                ? "invalid"
                : "network",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      /* portapapeles no disponible */
    }
  }, []);

  if (state.kind === "loading") {
    return (
      <section className="grid min-h-screen place-items-center bg-[#050916] font-sans">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-(--accent)">
          Cargando credencial...
        </p>
      </section>
    );
  }

  if (state.kind === "error") {
    return (
      <section className="grid min-h-screen place-items-center bg-[#050916] px-6 font-sans">
        <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#0b1120]/95 p-10 text-center">
          <h1 className="text-2xl font-black tracking-[0.12em] text-white">
            {state.reason === "expired"
              ? "Enlace expirado"
              : state.reason === "invalid"
                ? "Enlace inválido"
                : "No se pudo conectar"}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            {state.reason === "expired" &&
              "Este enlace de acceso temporal ya venció (máximo 2 horas). Pídele al miembro que te lo generó un nuevo enlace."}
            {state.reason === "invalid" &&
              "El enlace no es válido o ya fue reemplazado. Revisa la URL que recibiste."}
            {state.reason === "network" &&
              "No pudimos validar el enlace. Verifica tu conexión e intenta de nuevo."}
          </p>
        </div>
      </section>
    );
  }

  const { guest } = state;
  const primaryColor = guest.primaryColor ?? "#22fefb";
  const initial = guest.name.charAt(0).toUpperCase();

  return (
    <section
      id="guest-carnet"
      className="relative isolate grid min-h-screen grid-cols-[1.25rem_minmax(0,1fr)_1.25rem] grid-rows-[1fr_auto_1fr] overflow-hidden bg-[#050916] py-6 font-sans sm:py-0"
    >
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: `radial-gradient(circle at 15% 15%, rgba(var(--accent-rgb), 0.12), transparent 36%), radial-gradient(circle at 85% 85%, rgba(129,140,248,0.1), transparent 40%), linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
          backgroundSize: "auto, auto, 28px 28px, 28px 28px",
        }}
      />

      <article className="relative z-20 col-start-2 row-start-2 w-full max-w-2xl justify-self-center overflow-hidden rounded-4xl border bg-[#0b1120]/95 backdrop-blur-2xl grid grid-rows-[1fr_auto]"
        style={{ borderColor: `color-mix(in srgb, ${primaryColor} 45%, transparent)`, boxShadow: `0 0 24px rgba(var(--accent-rgb), 0.18)` }}
      >
        <div className="grid grid-rows-[0.7rem_auto_1fr_auto_0.7rem]">
          <header className="row-start-2 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-white/15 p-5 sm:p-6 md:p-8">
            <div className="min-w-0 text-left">
              <h1 className="text-2xl font-black tracking-[0.14em] text-white sm:text-3xl md:text-4xl"
                style={{ textShadow: `0 0 14px rgba(var(--accent-rgb), 0.35)` }}>
                {guest.tenantName || "GLUD"}
              </h1>
              <p className="mt-1 text-[0.6rem] font-bold uppercase tracking-[0.27em] sm:text-[0.7rem] md:text-[0.75rem]"
                style={{ color: primaryColor }}>
                Invitado Temporal
              </p>
            </div>
            <div className="self-start whitespace-nowrap pl-2 text-right">
              <p className="mt-1 font-mono text-[0.65rem] tracking-[0.12em] text-slate-300 sm:text-[0.75rem]">
                Código: <span className="font-semibold text-white">{guest.codigo}</span>
              </p>
            </div>
          </header>

          <div className="row-start-3 grid gap-6 p-5 sm:p-6 md:grid-cols-[1.1fr_1fr] md:gap-8 md:p-8">
            <section className="flex flex-col justify-center gap-5">
              <div className="flex items-center gap-4">
                <div className="flex aspect-square w-16 shrink-0 items-center justify-center rounded-md overflow-hidden sm:w-20"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, #4f46e5)` }}>
                  <span className="text-3xl sm:text-4xl font-black text-white">{initial}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.25em]"
                    style={{ color: primaryColor }}>
                    Invitado
                  </p>
                  <h2 className="mt-1 text-xl sm:text-2xl font-bold leading-tight tracking-wide text-white">
                    {guest.name}
                  </h2>
                </div>
              </div>

              <div className="grid gap-3">
                <div>
                  <span className="block text-[0.6rem] font-bold uppercase tracking-[0.2em] text-slate-500">
                    Estado
                  </span>
                  <span className="mt-1 inline-block rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.15em]"
                    style={{
                      color: primaryColor,
                      backgroundColor: `color-mix(in srgb, ${primaryColor} 12%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${primaryColor} 40%, transparent)`,
                    }}>
                    {guest.status === "ACTIVE" ? "Activo" : guest.status === "EXPIRED" ? "Expirado" : "Revocado"}
                  </span>
                </div>
                <div>
                  <span className="block text-[0.6rem] font-bold uppercase tracking-[0.2em] text-slate-500">
                    Enlace válido hasta
                  </span>
                  <p className="mt-1 text-sm font-semibold text-slate-200">{formatDate(guest.expiresAt)}</p>
                </div>
                <div>
                  <span className="block text-[0.6rem] font-bold uppercase tracking-[0.2em] text-slate-500">
                    Invitado por
                  </span>
                  <p className="mt-1 text-sm font-semibold text-slate-200">
                    {guest.createdByCodigo} · {guest.tenantName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={copyLink}
                className="mt-2 self-start rounded-full px-4 py-2 text-[0.65rem] font-bold uppercase tracking-[0.15em] transition-opacity hover:opacity-80"
                style={{
                  color: primaryColor,
                  border: `1px solid color-mix(in srgb, ${primaryColor} 40%, transparent)`,
                }}
              >
                Copiar enlace
              </button>
            </section>

            <section className="grid place-items-center">
              <div className="w-full max-w-sm">
                <GuestTOTPCard
                  secret={guest.totpSecret ?? ""}
                  studentId={guest.codigo}
                  qrSize={200}
                  primaryColor={primaryColor}
                  qrLightColor="#0b1120"
                />
              </div>
            </section>
          </div>
        </div>

        <footer className="border-t border-white/15 bg-black/50 p-4 text-center text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-slate-400 sm:text-[0.6rem]">
          Credencial temporal generada por {guest.tenantName}. Vence automáticamente.
        </footer>
      </article>
    </section>
  );
}
