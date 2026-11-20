// Compila las dos versiones del sitio una tras otra (dos `astro build` a la vez se pisan la
// caché) y luego sirve ambas con `astro preview`. Lo ejecuta Playwright (playwright.config.ts).
import { spawn, spawnSync } from 'node:child_process';

// Deben coincidir con tests/e2e/soporte/urls.ts (este archivo es .mjs y no puede importarlo).
const URL_APPS_SCRIPT = 'https://apps-script.prueba/exec';
const URL_APPS_SCRIPT_LOCALES = 'https://apps-script-locales.prueba/exec';
const versiones = [
  { carpeta: '.e2e/sitio', puerto: 4401, registro: '', locales: '' },
  { carpeta: '.e2e/registro', puerto: 4402, registro: URL_APPS_SCRIPT, locales: URL_APPS_SCRIPT_LOCALES },
];
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
// Las variables se fijan siempre (aunque sea vacías) para que un .env local no se cuele en las pruebas.
const opciones = ({ registro, locales }) => ({ stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, PUBLIC_REGISTRO_URL: registro, PUBLIC_REGISTRO_LOCALES_URL: locales } });

for (const version of versiones) {
  const resultado = spawnSync(npx, ['astro', 'build', '--outDir', version.carpeta], opciones(version));
  if (resultado.status !== 0) process.exit(resultado.status ?? 1);
}

const servidores = versiones.map((version) =>
  spawn(npx, ['astro', 'preview', '--outDir', version.carpeta, '--port', String(version.puerto)], opciones(version)));

const cerrar = () => { servidores.forEach((s) => s.kill()); process.exit(0); };
process.on('SIGINT', cerrar);
process.on('SIGTERM', cerrar);
servidores.forEach((s) => s.on('exit', (codigo) => { if (codigo) process.exit(codigo); }));
