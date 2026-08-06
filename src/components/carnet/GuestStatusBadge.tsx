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
  const activeColor = accentColor ?? "var(--accent)";

  let style: React.CSSProperties;
  if (status === "ACTIVE") {
    style = {
      color: activeColor,
      backgroundColor: `color-mix(in srgb, ${activeColor} 12%, transparent)`,
    };
  } else if (status === "EXPIRED") {
    style = { color: "#fbbf24", backgroundColor: "rgba(251,191,36,0.1)" };
  } else {
    style = { color: "#f87171", backgroundColor: "rgba(248,113,113,0.1)" };
  }

  return (
    <span
      className="inline-block rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.15em]"
      style={style}
    >
      {guestStatusLabel(status)}
    </span>
  );
}
