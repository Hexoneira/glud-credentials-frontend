const publicApiBaseUrl = import.meta.env.PUBLIC_API_BASE_URL;

if (!publicApiBaseUrl && !import.meta.env.DEV) {
  throw new Error('PUBLIC_API_BASE_URL must be configured in production');
}

export const API_BASE_URL = publicApiBaseUrl || 'http://localhost:8080';