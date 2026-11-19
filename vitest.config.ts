import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Pruebas unitarias (npm test): lógica pura de cada funcionalidad, el backend de Apps Script
 * y las reglas de arquitectura. No necesitan navegador ni servidor.
 * Las pruebas de interfaz están en tests/e2e y usan Playwright (npm run test:ui).
 */
export default defineConfig({
  resolve: {
    alias: [{ find: /^@\//, replacement: fileURLToPath(new URL('./src/', import.meta.url)) }],
  },
  test: {
    include: ['src/**/*.test.ts', 'backend/**/*.test.ts', 'tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
