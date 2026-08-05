import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_ACCENT, applyTenantTheme, hexToRgbTriplet, normalizeColor } from './theme';

describe('theme util', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--accent');
    document.documentElement.style.removeProperty('--accent-rgb');
  });

  it('hexToRgbTriplet convierte #22fefb a triple RGB', () => {
    expect(hexToRgbTriplet('#22fefb')).toBe('34, 254, 251');
  });

  it('hexToRgbTriplet acepta hex sin # y devuelve fallback para inválidos', () => {
    expect(hexToRgbTriplet('22fefb')).toBe('34, 254, 251');
    expect(hexToRgbTriplet('zzz')).toBe('34, 254, 251');
    expect(hexToRgbTriplet(null)).toBe('34, 254, 251');
  });

  it('normalizeColor agrega # y usa default para vacíos', () => {
    expect(normalizeColor('ff0000')).toBe('#ff0000');
    expect(normalizeColor('#ff0000')).toBe('#ff0000');
    expect(normalizeColor('')).toBe(DEFAULT_ACCENT);
    expect(normalizeColor(null)).toBe(DEFAULT_ACCENT);
  });

  it('applyTenantTheme setea variables CSS en documentElement', () => {
    applyTenantTheme('#ff0000');
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#ff0000');
    expect(document.documentElement.style.getPropertyValue('--accent-rgb')).toBe('255, 0, 0');
  });

  it('applyTenantTheme usa el default cuando no hay color', () => {
    applyTenantTheme(null);
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe(DEFAULT_ACCENT);
  });
});
