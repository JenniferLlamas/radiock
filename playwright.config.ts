import { defineConfig, devices } from '@playwright/test';
import { URL_REGISTRO } from './tests/e2e/soporte/urls';

/**
 * Pruebas de interfaz (npm run test:ui) contra el sitio COMPILADO, igual al que se publica.
 * Se generan dos versiones en .e2e/ y se sirven con `astro preview`:
 *   - sitio:    sin backend (formulario que prepara un mensaje para redes).
 *   - registro: con una URL de Apps Script ficticia; cada prueba intercepta esa URL
 *               (tests/e2e/soporte/appsScriptFalso.ts), así que nunca se escribe en Drive.
 * Usa el Chrome instalado en el equipo (channel: 'chrome'); no descarga navegadores.
 */

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: '.e2e/reporte' }]],
  outputDir: '.e2e/resultados',
  use: {
    channel: 'chrome',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'escritorio', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'movil', use: { ...devices['Pixel 7'] } },
  ],
  // Un solo proceso compila ambas versiones en orden y sirve sitio (4401) y registro (4402).
  webServer: {
    command: 'node tests/e2e/soporte/servir.mjs',
    url: URL_REGISTRO,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
