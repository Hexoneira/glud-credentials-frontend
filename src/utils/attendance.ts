const CODIGO_PATTERN = /^[A-Za-z0-9_-]{3,30}$/;
const QR_ID_PATTERN = /^ID:([A-Za-z0-9_-]{3,30})\|TOTP:/;

/**
 * Extrae el código de miembro desde el contenido escaneado.
 * Acepta un código plano o el payload QR del carnet (ID:...|TOTP:...).
 * Devuelve null si el contenido no es reconocido.
 */
export function extractCodigoFromScan(scanned: string): string | null {
  const value = scanned?.trim() ?? "";
  if (CODIGO_PATTERN.test(value)) {
    return value;
  }
  const match = QR_ID_PATTERN.exec(value);
  return match ? match[1] : null;
}
