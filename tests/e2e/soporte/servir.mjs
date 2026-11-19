// Compila las dos versiones del sitio una tras otra (dos `astro build` a la vez se pisan la
// caché) y luego sirve ambas con `astro preview`. Lo ejecuta Playwright (playwright.config.ts).
import { spawn, spawnSync } from 'node:child_process';

// Debe coincidir con URL_APPS_SCRIPT de tests/e2e/soporte/urls.ts (este archivo es .mjs y no puede importarlo).
const URL_APPS_SCRIPT = 'https://apps-script.prueba/exec';
const versiones = [
  { carpeta: '.e2e/sitio', puerto: 4401, registro: '' },
  { carpeta: '.e2e/registro', puerto: 4402, registro: URL_APPS_SCRIPT },
];
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const opciones = (registro) => ({ stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, PUBLIC_REGISTRO_URL: registro } });

for (const { carpeta, registro } of versiones) {
  const resultado = spawnSync(npx, ['astro', 'build', '--outDir', carpeta], opciones(registro));
  if (resultado.status !== 0) process.exit(resultado.status ?? 1);
}

const servidores = versiones.map(({ carpeta, puerto, registro }) =>
  spawn(npx, ['astro', 'preview', '--outDir', carpeta, '--port', String(puerto)], opciones(registro)));

const cerrar = () => { servidores.forEach((s) => s.kill()); process.exit(0); };
process.on('SIGINT', cerrar);
process.on('SIGTERM', cerrar);
servidores.forEach((s) => s.on('exit', (codigo) => { if (codigo) process.exit(codigo); }));
