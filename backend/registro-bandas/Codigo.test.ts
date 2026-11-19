/**
 * Pruebas del backend de Apps Script en Node: se ejecuta Codigo.js en un contexto aislado
 * con imitaciones de DriveApp, SpreadsheetApp, Utilities, LockService y ContentService.
 * También comprueba que sus límites coinciden con los del sitio.
 */
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { MAX_BYTES_TOTAL } from '@/contacto/constants/archivos';
import { archivosPresentacion } from '@/contacto/data/archivosPresentacion';
import { camposPresentacion } from '@/contacto/data/camposPresentacion';

const CODIGO = readFileSync(new URL('./Codigo.js', import.meta.url), 'utf8')
  .replace("'PEGAR_AQUI_EL_ID_DE_LA_CARPETA'", "'CARPETA'")
  .replace("'PEGAR_AQUI_EL_ID_DE_LA_HOJA'", "'HOJA'");

interface CarpetaFalsa {
  nombre: string;
  subcarpetas: CarpetaFalsa[];
  archivos: { nombre: string; tipo: string; bytes: number[] }[];
}

/** Valores creados dentro del contexto vm tienen otros prototipos: se normalizan con JSON. */
const plano = <T>(valor: T): T => JSON.parse(JSON.stringify(valor));

function entorno() {
  const carpetas: CarpetaFalsa[] = [];
  const archivos: { carpeta: string; nombre: string; tipo: string; bytes: number }[] = [];
  const filas: unknown[][] = [];
  const crearCarpeta = (nombre: string): CarpetaFalsa & Record<string, unknown> => {
    const carpeta: CarpetaFalsa & Record<string, unknown> = {
      nombre, subcarpetas: [], archivos: [],
      getUrl: () => `https://drive/${encodeURIComponent(nombre)}`,
      createFolder: (n: string) => { const sub = crearCarpeta(n); carpeta.subcarpetas.push(sub); return sub; },
      createFile: (blob: { nombre: string; tipo: string; bytes: number[] }) => {
        carpeta.archivos.push(blob);
        archivos.push({ carpeta: nombre, nombre: blob.nombre, tipo: blob.tipo, bytes: blob.bytes.length });
        return { getUrl: () => `https://drive/archivo/${blob.nombre}` };
      },
    };
    return carpeta;
  };
  const contexto = createContext({
    console: { error: () => {} },
    Utilities: {
      base64Decode: (texto: string) => Array.from(Buffer.from(texto, 'base64')),
      newBlob: (bytes: number[], tipo: string, nombre: string) => ({ bytes, tipo, nombre }),
      formatDate: () => '2026-11-18 20.00',
    },
    DriveApp: { getFolderById: () => ({ createFolder: (n: string) => { const c = crearCarpeta(n); carpetas.push(c); return c; } }) },
    SpreadsheetApp: {
      openById: () => ({
        getSheetByName: () => null,
        insertSheet: () => ({ getLastRow: () => filas.length, appendRow: (fila: unknown[]) => filas.push(plano(fila)), setFrozenRows: () => {} }),
      }),
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (texto: string) => ({ setMimeType: () => JSON.parse(texto) }) },
  });
  runInContext(CODIGO, contexto);
  const post = (cuerpo: unknown) => plano(contexto.doPost({ postData: { contents: JSON.stringify(cuerpo) } })) as { ok: boolean; error?: string };
  return { post, carpetas, archivos, filas, contexto };
}

const b64 = (bytes: number) => Buffer.alloc(bytes, 7).toString('base64');
const adjunto = (campo: string, nombre: string, tipo: string, bytes = 100) => ({ campo, nombre, tipo, contenido: b64(bytes) });
const campos = { banda: 'Oblivion', ciudad: 'Tijuana', genero: 'Rock', instagram: '', youtube: '', contacto: 'oblivion@ejemplo.com' };

describe('backend: registro válido', () => {
  it('crea subcarpetas Fotos/Logos/Canciones y una fila con una columna por tipo', () => {
    const { post, carpetas, archivos, filas } = entorno();
    expect(post({ campos, sitioWeb: '', archivos: [
      adjunto('fotos', 'vivo.jpg', 'image/jpeg', 2000),
      adjunto('logos', 'logo.svg', 'image/svg+xml', 300),
      adjunto('canciones', 'a.mp3', 'audio/mpeg', 5000),
      adjunto('canciones', 'b.wav', 'audio/wav', 4000),
    ] })).toEqual({ ok: true });

    expect(carpetas[0].nombre).toBe('2026-11-18 20.00 — Oblivion');
    expect(carpetas[0].subcarpetas.map((s) => s.nombre)).toEqual(['Fotos', 'Logos', 'Canciones']);
    expect(archivos).toEqual([
      { carpeta: 'Fotos', nombre: 'vivo.jpg', tipo: 'image/jpeg', bytes: 2000 },
      { carpeta: 'Logos', nombre: 'logo.svg', tipo: 'image/svg+xml', bytes: 300 },
      { carpeta: 'Canciones', nombre: 'a.mp3', tipo: 'audio/mpeg', bytes: 5000 },
      { carpeta: 'Canciones', nombre: 'b.wav', tipo: 'audio/wav', bytes: 4000 },
    ]);
    expect(filas[0]).toEqual(['Fecha', 'Banda', 'Ciudad', 'Género', 'Instagram', 'YouTube', 'Contacto', 'Fotos', 'Logos', 'Canciones', 'Carpeta']);
    expect(filas[1].slice(7, 10)).toEqual([
      'https://drive/archivo/vivo.jpg', 'https://drive/archivo/logo.svg', 'https://drive/archivo/a.mp3\nhttps://drive/archivo/b.wav',
    ]);
  });

  it('solo crea las subcarpetas de lo que se envió', () => {
    const { post, carpetas } = entorno();
    post({ campos, archivos: [adjunto('logos', 'logo.png', 'image/png')] });
    expect(carpetas[0].subcarpetas.map((s) => s.nombre)).toEqual(['Logos']);
  });
});

describe('backend: protección', () => {
  it('el campo trampa responde ok sin guardar nada', () => {
    const { post, carpetas, filas } = entorno();
    expect(post({ campos, archivos: [], sitioWeb: 'http://spam' })).toEqual({ ok: true });
    expect(carpetas.length + filas.length).toBe(0);
  });

  it('rechaza obligatorios vacíos, formatos, tamaños, cantidades y campos desconocidos sin crear nada', () => {
    const { post, carpetas } = entorno();
    const r = post({ campos: { ...campos, banda: '  ' }, archivos: [
      adjunto('fotos', 'dibujo.svg', 'image/svg+xml'),
      adjunto('canciones', 'larga.wav', 'audio/wav', 16 * 1024 * 1024),
      ...[1, 2, 3].map((i) => adjunto('logos', `l${i}.png`, 'image/png')),
      adjunto('imagenes', 'vieja.jpg', 'image/jpeg'),
    ] });
    expect(r.ok).toBe(false);
    expect(r.error).toContain('Falta el campo Banda.');
    expect(r.error).toContain('"dibujo.svg" no tiene un formato permitido.');
    expect(r.error).toContain('"larga.wav" supera 15 MB.');
    expect(r.error).toContain('máximo 2 archivo(s) en Logos.');
    expect(r.error).toContain('archivo no esperado');
    expect(carpetas).toHaveLength(0);
  });

  it('rechaza envíos de más de 30 MB', () => {
    const { post } = entorno();
    const r = post({ campos, archivos: [1, 2, 3].map((i) => adjunto('canciones', `c${i}.mp3`, 'audio/mpeg', 12 * 1024 * 1024)) });
    expect(r.error).toContain('suman más de 30 MB');
  });

  it('neutraliza fórmulas en la hoja y rutas en los nombres de archivo', () => {
    const { post, archivos, filas } = entorno();
    post({ campos: { ...campos, contacto: '=IMPORTXML("http://x","//a")', genero: '+1' },
      archivos: [adjunto('fotos', '../../etc/passwd.png', 'image/png')] });
    expect(filas[1][6]).toBe(`'=IMPORTXML("http://x","//a")`);
    expect(filas[1][3]).toBe("'+1");
    expect(archivos[0].nombre).toBe('_.._etc_passwd.png');
  });

  it('JSON inválido devuelve un error genérico y doGet confirma el despliegue', () => {
    const { contexto } = entorno();
    expect(plano(contexto.doPost({ postData: { contents: 'no es json' } }))).toEqual({ ok: false, error: 'No pudimos guardar el registro. Inténtalo de nuevo en unos minutos.' });
    expect(plano(contexto.doGet())).toEqual({ ok: true, servicio: 'registro-bandas' });
  });
});

describe('backend y sitio usan los mismos límites', () => {
  const { contexto } = entorno();
  const config = plano(runInContext('CONFIG', contexto)) as {
    CAMPOS: { nombre: string; obligatorio: boolean; maximo: number }[];
    ARCHIVOS: Record<string, { maximo: number; maxBytes: number; tipos: string[] }>;
    MAX_BYTES_TOTAL: number;
  };

  it('campos de texto', () => {
    expect(config.CAMPOS.map(({ nombre, obligatorio, maximo }) => ({ nombre, obligatorio, maximo })))
      .toEqual(camposPresentacion.map(({ nombre, obligatorio, maximo }) => ({ nombre, obligatorio, maximo })));
  });

  it('fotos, logos y canciones', () => {
    for (const regla of archivosPresentacion) {
      expect(config.ARCHIVOS[regla.nombre], regla.nombre).toMatchObject({ maximo: regla.maximo, maxBytes: regla.maxBytes, tipos: [...regla.tipos] });
    }
    expect(Object.keys(config.ARCHIVOS)).toEqual(archivosPresentacion.map((r) => r.nombre));
    expect(config.MAX_BYTES_TOTAL).toBe(MAX_BYTES_TOTAL);
  });
});
