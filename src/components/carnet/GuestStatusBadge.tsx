export function guestStatusLabel(status: string): string {
  if (status === "ACTIVE") return "Activo";
  if (status === "EXPIRED") return "Expirado";
  return "Revocado";
}

type GuestStatusBadgeProps = {
  status: string;
  accentColor?: string;
};

export default function GuestStatusBadge({ status, accentColor }: Readonly<GuestStatusBadgeProps>) {
  const style =
    status === "ACTIVE"
      ? {
          color: accentColor ?? "var(--accent)",
          backgroundColor: `color-mix(in srgb, ${accentColor ?? "var(--accent)"} 12%, transparent)`,
        }
      : status === "EXPIRED"
        ? { color: "#fbbf24", backgroundColor: "rgba(251,191,36,0.1)" }
        : { color: "#f87171", backgroundColor: "rgba(248,113,113,0.1)" };

  return (
    <span
      className="inline-block rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.15em]"
      style={style}
    >
      {guestStatusLabel(status)}
    </span>
  );
}
