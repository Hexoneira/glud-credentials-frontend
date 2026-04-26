const publicApiBaseUrl = import.meta.env.PUBLIC_API_BASE_URL;

if (!publicApiBaseUrl && !import.meta.env.DEV) {
  throw new Error('CRÍTICO: PUBLIC_API_BASE_URL no está configurada en Producción.');
}

if (!publicApiBaseUrl && import.meta.env.DEV) {
  console.warn('WARNING: No se encontró PUBLIC_API_BASE_URL en tu .env local. Usando localhost por defecto.');
}

export const API_BASE_URL = publicApiBaseUrl || 'http://localhost:8080/api';