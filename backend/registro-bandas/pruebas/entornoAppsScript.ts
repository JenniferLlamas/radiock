/**
 * Entorno de pruebas del backend: ejecuta los módulos de Apps Script en Node, en un contexto
 * aislado con imitaciones de DriveApp, SpreadsheetApp, Utilities, LockService,
 * PropertiesService y ContentService. Nada toca Google ni tu Drive.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';

/**
 * Módulos del proyecto de Apps Script. Se cargan juntos en un mismo contexto, como hace Apps
 * Script con los archivos de un proyecto (comparten el ámbito global).
 */
export const MODULOS = [
  'constants/configuracion.js',
  'constants/mensajes.js',
  'constants/formatos.js',
  'data/campos.js',
  'data/archivos.js',
  'helpers/texto.js',
  'helpers/bytes.js',
  'domain/contenidoArchivos.js',
  'domain/validacion.js',
  'domain/cupo.js',
  'services/bloqueo.js',
  'services/propiedades.js',
  'services/almacenamiento.js',
  'api/webApp.js',
];

const CARPETA = new URL('../', import.meta.url);

/** Archivos .js de todas las capas del backend (para detectar un módulo sin registrar). */
export const modulosEnCarpeta = () => (readdirSync(CARPETA, { recursive: true }) as string[])
  .map((ruta) => ruta.replace(/\\/g, '/'))
  .filter((ruta) => ruta.endsWith('.js') && !ruta.startsWith('node_modules/'))
  .sort();

/** Código de los módulos en el orden dado, como un solo script. */
const codigo = (modulos: string[]) => modulos.map((modulo) => readFileSync(new URL(modulo, CARPETA), 'utf8'))
  .join('\n;\n')
  // IDs ficticios, aunque tu copia local tenga los reales.
  .replace(/CARPETA_ID: '[^']*'/, "CARPETA_ID: 'CARPETA'")
  .replace(/HOJA_ID: '[^']*'/, "HOJA_ID: 'HOJA'");

interface CarpetaFalsa {
  nombre: string;
  subcarpetas: CarpetaFalsa[];
  archivos: { nombre: string; tipo: string; bytes: number[] }[];
}

/** Valores creados dentro del contexto vm tienen otros prototipos: se normalizan con JSON. */
export const plano = <T>(valor: T): T => JSON.parse(JSON.stringify(valor));

/** Imitación de PropertiesService.getScriptProperties(). */
export function propiedadesFalsas(iniciales: Record<string, string> = {}) {
  const datos = new Map(Object.entries(iniciales));
  return {
    datos,
    getProperty: (k: string) => datos.get(k) ?? null,
    setProperty: (k: string, v: string) => { datos.set(k, v); },
    getKeys: () => [...datos.keys()],
    deleteProperty: (k: string) => { datos.delete(k); },
  };
}

export function entorno({ propiedades = propiedadesFalsas(), modulos = MODULOS } = {}) {
  /** Reloj controlable: cambia `reloj.hora` o `reloj.dia` para simular el paso del tiempo. */
  const reloj = { dia: '2026-11-18', hora: '20' };
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
    console: { error: () => {}, warn: () => {} },
    Utilities: {
      base64Decode: (texto: string) => Array.from(Buffer.from(texto, 'base64')),
      newBlob: (bytes: number[], tipo: string, nombre: string) => ({ bytes, tipo, nombre }),
      formatDate: (_fecha: Date, _zona: string, formato: string) =>
        formato === "yyyy-MM-dd'T'HH" ? `${reloj.dia}T${reloj.hora}`
          : formato === 'yyyy-MM-dd' ? reloj.dia
            : `${reloj.dia} ${reloj.hora}.00`,
    },
    PropertiesService: { getScriptProperties: () => propiedades },
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
  runInContext(codigo(modulos), contexto);
  const post = (cuerpo: unknown) => plano(contexto.doPost({ postData: { contents: JSON.stringify(cuerpo) } })) as { ok: boolean; error?: string };
  return { post, carpetas, archivos, filas, contexto, reloj, propiedades };
}

/** Primeros bytes reales de cada formato, para que los adjuntos de prueba pasen la revisión de contenido. */
export const FIRMAS: Record<string, Buffer> = {
  'image/jpeg': Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  'image/png': Buffer.from('89504e470d0a1a0a', 'hex'),
  'image/webp': Buffer.from('RIFF\0\0\0\0WEBP', 'latin1'),
  'image/svg+xml': Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><circle r="4"/></svg>'),
  'audio/mpeg': Buffer.from('ID3'),
  'audio/wav': Buffer.from('RIFF\0\0\0\0WAVE', 'latin1'),
};

/** Archivo de `bytes` de tamaño que empieza con la firma de su tipo (el SVG se rellena con espacios). */
const contenidoDe = (tipo: string, bytes: number) => {
  const datos = Buffer.alloc(bytes, tipo === 'image/svg+xml' ? 0x20 : 7);
  FIRMAS[tipo]?.copy(datos);
  return datos;
};

export const adjunto = (campo: string, nombre: string, tipo: string, bytes = 100) =>
  ({ campo, nombre, tipo, contenido: contenidoDe(tipo, bytes).toString('base64') });

/** Adjunto con contenido arbitrario (archivos reales o disfrazados). */
export const adjuntoCon = (campo: string, nombre: string, tipo: string, contenido: Buffer | string) =>
  ({ campo, nombre, tipo, contenido: Buffer.from(contenido).toString('base64') });

/** Archivo de la carpeta public/ del sitio. */
export const publico = (ruta: string) => readFileSync(new URL(`../../../public/${ruta}`, import.meta.url));

export const campos = { banda: 'Oblivion', ciudad: 'Tijuana', genero: 'Rock', instagram: '', youtube: '', contacto: 'oblivion@ejemplo.com' };
