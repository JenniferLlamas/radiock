/**
 * Entorno de pruebas común a los backends de Apps Script (registro-bandas, registro-locales):
 * ejecuta los módulos de un proyecto en Node, en un contexto aislado con imitaciones de
 * DriveApp, SpreadsheetApp, Utilities, LockService, PropertiesService y ContentService.
 * Nada toca Google ni tu Drive.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';

/** Archivos .js de todas las capas de un proyecto (para detectar un módulo sin registrar). */
export const modulosEnCarpeta = (carpeta: URL) => (readdirSync(carpeta, { recursive: true }) as string[])
  .map((ruta) => ruta.replace(/\\/g, '/'))
  .filter((ruta) => ruta.endsWith('.js') && !ruta.startsWith('node_modules/'))
  .sort();

/** Código de los módulos en el orden dado, como un solo script (Apps Script comparte el ámbito global). */
const codigo = (carpeta: URL, modulos: readonly string[]) => modulos
  .map((modulo) => readFileSync(new URL(modulo, carpeta), 'utf8'))
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

export interface OpcionesEntorno {
  /** Carpeta del proyecto de Apps Script (termina en /). */
  carpeta: URL;
  modulos: readonly string[];
  propiedades?: ReturnType<typeof propiedadesFalsas>;
}

export function crearEntorno({ carpeta, modulos, propiedades = propiedadesFalsas() }: OpcionesEntorno) {
  /** Reloj controlable: cambia `reloj.hora` o `reloj.dia` para simular el paso del tiempo. */
  const reloj = { dia: '2026-11-18', hora: '20' };
  const carpetas: CarpetaFalsa[] = [];
  const archivos: { carpeta: string; nombre: string; tipo: string; bytes: number }[] = [];
  const filas: unknown[][] = [];
  /** Pestañas creadas en la hoja, en orden. */
  const pestanas: string[] = [];
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
        insertSheet: (nombre: string) => {
          pestanas.push(nombre);
          return { getLastRow: () => filas.length, appendRow: (fila: unknown[]) => filas.push(plano(fila)), setFrozenRows: () => {} };
        },
      }),
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (texto: string) => ({ setMimeType: () => JSON.parse(texto) }) },
  });
  runInContext(codigo(carpeta, modulos), contexto);
  const post = (cuerpo: unknown) => plano(contexto.doPost({ postData: { contents: JSON.stringify(cuerpo) } })) as { ok: boolean; error?: string };
  return { post, carpetas, archivos, filas, pestanas, contexto, reloj, propiedades };
}
