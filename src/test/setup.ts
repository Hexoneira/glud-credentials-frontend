import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock CSS variables that are used in the components
Object.defineProperty(window, 'CSS', {
  value: {
    supports: () => true
  }
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});