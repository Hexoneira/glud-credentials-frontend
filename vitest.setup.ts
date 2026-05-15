import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Ejecutar cleanup después de cada test de forma automática
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
