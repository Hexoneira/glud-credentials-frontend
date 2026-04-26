const publicApiBaseUrl = import.meta.env.PUBLIC_API_BASE_URL;

if (!publicApiBaseUrl) {
  if (import.meta.env.DEV) {
    console.warn('WARNING: No se encontró PUBLIC_API_BASE_URL en tu .env local. Usando localhost por defecto.');
  } else {
    console.warn('BUILD WARNING: PUBLIC_API_BASE_URL no está configurada. Asegúrate de proveerla en el entorno de despliegue.');
  }
}

export const API_BASE_URL = publicApiBaseUrl || 'http://localhost:8080/api';