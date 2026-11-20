/**
 * Entorno de pruebas del backend de bandas: carga sus módulos con las imitaciones de Google de
 * backend/pruebas/appsScriptFalso.ts. Nada toca Google ni tu Drive.
 */
import { readFileSync } from 'node:fs';
import { crearEntorno, modulosEnCarpeta as modulosDe, propiedadesFalsas, plano } from '../../pruebas/appsScriptFalso';

export { plano, propiedadesFalsas };

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
  'helpers/nombresArchivo.js',
  'domain/contenidoArchivos.js',
  'domain/validacion.js',
  'domain/cupo.js',
  'services/bloqueo.js',
  'services/propiedades.js',
  'services/almacenamiento.js',
  'api/webApp.js',
];

const CARPETA = new URL('../', import.meta.url);

/** Archivos .js de todas las capas de este backend (para detectar un módulo sin registrar). */
export const modulosEnCarpeta = () => modulosDe(CARPETA);

export const entorno = ({ propiedades = propiedadesFalsas(), modulos = MODULOS } = {}) =>
  crearEntorno({ carpeta: CARPETA, modulos, propiedades });

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
