export const DEFAULT_ACCENT = '#22fefb';

export function hexToRgbTriplet(hex: string | null | undefined): string {
  const value = (hex ?? '').trim().replace(/^#/, '');
  if (!/^[0-9A-Fa-f]{6}$/.test(value)) {
    return '34, 254, 251';
  }
  const channels: number[] = [];
  for (let i = 0; i < 6; i += 2) {
    channels.push(parseInt(value.slice(i, i + 2), 16));
  }
  return channels.join(', ');
}

export function normalizeColor(hex: string | null | undefined): string {
  const value = (hex ?? '').trim();
  if (/^[0-9A-Fa-f]{6}$/.test(value)) {
    return `#${value}`;
  }
  return /^#[0-9A-Fa-f]{6}$/.test(value) ? value : DEFAULT_ACCENT;
}

export function applyTenantTheme(primaryColor?: string | null): void {
  const accent = normalizeColor(primaryColor);
  document.documentElement.style.setProperty('--accent', accent);
  document.documentElement.style.setProperty('--accent-rgb', hexToRgbTriplet(accent));
}
