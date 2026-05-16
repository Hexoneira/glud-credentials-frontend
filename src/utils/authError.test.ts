import { describe, expect, it } from 'vitest';
import { getAuthErrorMessage } from './authError';

describe('getAuthErrorMessage', () => {
  it('returns the timeout message for AbortError and TimeoutError', () => {
    expect(getAuthErrorMessage({ name: 'AbortError' })).toBe('La conexión tardó demasiado. Reintenta.');
    expect(getAuthErrorMessage({ name: 'TimeoutError' })).toBe('La conexión tardó demasiado. Reintenta.');
  });

  it('returns the original error message for generic errors', () => {
    expect(getAuthErrorMessage(new Error('No autorizado'))).toBe('No autorizado');
  });

  it('returns the fallback message for unknown values', () => {
    expect(getAuthErrorMessage(null)).toBe('Error de conexión. Revisa tu internet.');
  });

  it('returns the error message for TypeError instances (network failures)', () => {
    expect(getAuthErrorMessage(new TypeError('Network failure'))).toBe('Network failure');
  });
});