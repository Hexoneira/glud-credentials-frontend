import { describe, expect, it } from 'vitest';
import { formatDate } from './format';

describe('formatDate', () => {
  it('formatea una fecha ISO en formato es-CO', () => {
    expect(formatDate('2026-08-05T18:00:00')).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('devuelve — para valores vacíos o inválidos', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('')).toBe('—');
    expect(formatDate('no-es-fecha')).toBe('—');
  });
});
