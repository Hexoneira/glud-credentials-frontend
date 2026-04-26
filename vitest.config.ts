/// <reference types="vitest" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        '.astro/**',
        'src/layouts/**',
        'src/pages/**',
        'src/assets/**',
        'src/styles/**',
        'src/config.ts',
        'src/**/*.d.ts',
        'astro.config.mjs',
        'vitest.config.ts',
        'vitest.setup.ts',
        'tailwind.config.*',
      ],
    },
  },
});