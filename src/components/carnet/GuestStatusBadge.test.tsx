import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import GuestStatusBadge, { guestStatusLabel } from './GuestStatusBadge';

describe('guestStatusLabel', () => {
  it('mapea los tres estados', () => {
    expect(guestStatusLabel('ACTIVE')).toBe('Activo');
    expect(guestStatusLabel('EXPIRED')).toBe('Expirado');
    expect(guestStatusLabel('REVOKED')).toBe('Revocado');
    expect(guestStatusLabel('OTRO')).toBe('Revocado');
  });
});

describe('GuestStatusBadge', () => {
  it('usa el color del tenant para ACTIVE', () => {
    render(<GuestStatusBadge status="ACTIVE" accentColor="#ff0000" />);

    const badge = screen.getByText('Activo');
    expect(badge).toHaveStyle({ color: '#ff0000' });
  });

  it('usa colores fijos para EXPIRED y REVOKED', () => {
    const { rerender } = render(<GuestStatusBadge status="EXPIRED" />);
    expect(screen.getByText('Expirado')).toHaveStyle({ color: '#fbbf24' });

    rerender(<GuestStatusBadge status="REVOKED" />);
    expect(screen.getByText('Revocado')).toHaveStyle({ color: '#f87171' });
  });
});
