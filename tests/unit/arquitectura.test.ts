/**
 * Reglas de arquitectura (Screaming Architecture + capas). Si alguna falla, el mensaje
 * indica el archivo y el import que la rompe. Las reglas están documentadas en README.md.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, posix, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');

const CAPAS = ['constants', 'domain', 'data', 'helpers', 'services', 'hooks', 'ui', 'styles'] as const;
type Capa = (typeof CAPAS)[number];

/** Qué capas puede importar cada capa dentro de la misma funcionalidad. */
const PERMITIDAS: Record<Capa, readonly Capa[]> = {
  constants: ['constants', 'domain'],
  domain: ['domain', 'constants', 'data', 'helpers'],
  data: ['data', 'domain', 'constants'],
  helpers: ['helpers', 'constants', 'domain', 'data'],
  services: ['services', 'domain', 'constants', 'data', 'helpers'],
  hooks: ['hooks', 'domain', 'constants', 'data', 'helpers', 'services'],
  ui: ['ui', 'domain', 'constants', 'data', 'helpers', 'services', 'hooks', 'styles'],
  styles: ['styles'],
};

/** Desde otra funcionalidad solo se importa su API pública. */
const API_PUBLICA = /^@\/[a-z]+$|^@\/compartido\/(hooks|ui)$/;

const archivos = readdirSync(SRC, { recursive: true, encoding: 'utf8' })
  .map((f) => f.split(sep).join('/'))
  .filter((f) => /\.(ts|astro|mjs)$/.test(f) && !f.endsWith('.test.ts') && !f.startsWith('pages/') && f !== 'env.d.ts');

const imports = (archivo: string) =>
  [...readFileSync(join(SRC, archivo), 'utf8').matchAll(/(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/g)]
    .map((m) => m[1] ?? m[2]);

const funcionalidades = [...new Set(archivos.map((f) => f.split('/')[0]))];

describe('arquitectura', () => {
  it('cada archivo está en una capa conocida (o es la API pública index.ts)', () => {
    const fuera = archivos.filter((f) => {
      const partes = f.split('/');
      return !(partes.length === 2 && partes[1] === 'index.ts') && !CAPAS.includes(partes[1] as Capa);
    });
    expect(fuera).toEqual([]);
  });

  it('cada funcionalidad tiene API pública (index.ts)', () => {
    expect(funcionalidades.filter((f) => !archivos.includes(`${f}/index.ts`))).toEqual([]);
  });

  it('las capas solo importan capas permitidas de su funcionalidad', () => {
    const errores: string[] = [];
    for (const archivo of archivos) {
      const [funcionalidad, capa, ...resto] = archivo.split('/');
      if (!resto.length) continue; // index.ts
      for (const ruta of imports(archivo).filter((r) => r.startsWith('.'))) {
        const destino = posix.normalize(posix.join(funcionalidad, capa, posix.dirname(resto.join('/')), ruta));
        const [funcDestino, capaDestino] = destino.split('/');
        if (funcDestino !== funcionalidad) errores.push(`${archivo} sale de su funcionalidad con "${ruta}"`);
        else if (!PERMITIDAS[capa as Capa]?.includes(capaDestino as Capa)) errores.push(`${archivo}: ${capa} no debe importar ${capaDestino} ("${ruta}")`);
      }
    }
    expect(errores).toEqual([]);
  });

  it('entre funcionalidades solo se usa la API pública, y compartido no depende de ninguna', () => {
    const errores: string[] = [];
    for (const archivo of archivos) {
      const funcionalidad = archivo.split('/')[0];
      for (const ruta of imports(archivo).filter((r) => r.startsWith('@/'))) {
        if (ruta.split('/')[1] === funcionalidad) errores.push(`${archivo} usa "${ruta}" para su propia funcionalidad (usar ruta relativa)`);
        else if (!API_PUBLICA.test(ruta)) errores.push(`${archivo} importa "${ruta}", que no es una API pública`);
        if (funcionalidad === 'compartido') errores.push(`${archivo}: compartido no debe importar "${ruta}"`);
      }
    }
    expect(errores).toEqual([]);
  });

  it('domain, data, helpers y constants no dependen de Astro', () => {
    const conAstro = archivos.filter((f) => ['domain', 'data', 'helpers', 'constants'].includes(f.split('/')[1])
      && imports(f).some((r) => r.endsWith('.astro') || r === 'astro' || r.startsWith('astro:')));
    expect(conAstro).toEqual([]);
  });
});
