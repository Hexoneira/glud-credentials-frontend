import type { ReactNode } from "react";

export type EmptyStateIcon = "inbox" | "users" | "qrcode" | "building" | "clock" | "ticket";

type EmptyStateProps = {
  icon?: EmptyStateIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
};

const ICON_PATHS: Record<EmptyStateIcon, ReactNode> = {
  inbox: (
    <>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z"
      />
    </>
  ),
  users: (
    <>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
      />
    </>
  ),
  qrcode: (
    <>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 13.875c0-.621.504-1.125 1.125-1.125h.375c.621 0 1.125.504 1.125 1.125v.375c0 .621-.504 1.125-1.125 1.125h-.375a1.125 1.125 0 0 1-1.125-1.125v-.375Zm6.75 0c0-.621.504-1.125 1.125-1.125h.375c.621 0 1.125.504 1.125 1.125v.375c0 .621-.504 1.125-1.125 1.125h-.375a1.125 1.125 0 0 1-1.125-1.125v-.375ZM13.5 20.625c0-.621.504-1.125 1.125-1.125h.375c.621 0 1.125.504 1.125 1.125v.375c0 .621-.504 1.125-1.125 1.125h-.375a1.125 1.125 0 0 1-1.125-1.125v-.375Zm6.75 0c0-.621.504-1.125 1.125-1.125h.375c.621 0 1.125.504 1.125 1.125v.375c0 .621-.504 1.125-1.125 1.125h-.375a1.125 1.125 0 0 1-1.125-1.125v-.375Z"
      />
    </>
  ),
  building: (
    <>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
      />
    </>
  ),
  clock: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </>
  ),
  ticket: (
    <>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z"
      />
    </>
  ),
};

export default function EmptyState({
  icon = "inbox",
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
}: Readonly<EmptyStateProps>) {
  return (
    <div
      className={`flex flex-col items-center gap-4 rounded-3xl border border-dashed border-(--support-gunmetal) bg-(--bg-black)/40 text-center ${
        compact ? "px-6 py-10" : "px-6 py-14"
      }`}
    >
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/10 text-(--accent)"
        aria-hidden="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-6 w-6"
        >
          {ICON_PATHS[icon]}
        </svg>
      </span>
      <div className="max-w-sm">
        <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-(--white)">{title}</h3>
        {description && (
          <p className="mt-2 text-xs leading-relaxed text-(--support-grey)">{description}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="rounded-full border border-(--accent)/40 bg-(--accent)/10 px-5 py-2 text-[0.65rem] font-bold uppercase tracking-[0.15em] text-(--accent) transition-all hover:bg-(--accent) hover:text-[#050916]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
