export function getAuthErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const anyError = error as { name?: unknown; message?: unknown };
    if (anyError.name === 'AbortError' || anyError.name === 'TimeoutError') {
      return 'La conexión tardó demasiado. Reintenta.';
    }
  }

  if (error instanceof Error) {
    if (error instanceof TypeError) {
      return error.message || 'Error de conexión. Revisa tu internet.';
    }
    return error.message || 'Error de conexión. Revisa tu internet.';
  }

  return 'Error de conexión. Revisa tu internet.';
}