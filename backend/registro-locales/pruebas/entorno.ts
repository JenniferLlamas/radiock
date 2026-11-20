/**
 * Entorno de pruebas del backend de locales: carga sus módulos con las imitaciones de Google de
 * backend/pruebas/appsScriptFalso.ts. Nada toca Google ni tus hojas.
 */
import { crearEntorno, modulosEnCarpeta as modulosDe, propiedadesFalsas, plano } from '../../pruebas/appsScriptFalso';

export { plano, propiedadesFalsas };

/** Módulos del proyecto de Apps Script; se cargan juntos, como hace Apps Script. */
export const MODULOS = [
  'constants/configuracion.js',
  'constants/mensajes.js',
  'data/campos.js',
  'helpers/texto.js',
  'domain/validacion.js',
  'domain/cupo.js',
  'services/bloqueo.js',
  'services/propiedades.js',
  'services/hoja.js',
  'api/webApp.js',
];

const CARPETA = new URL('../', import.meta.url);

export const modulosEnCarpeta = () => modulosDe(CARPETA);

export const entorno = ({ propiedades = propiedadesFalsas(), modulos = MODULOS } = {}) =>
  crearEntorno({ carpeta: CARPETA, modulos, propiedades });

export const campos = { local: 'El Foro', responsable: 'Ana López', ubicacion: 'Av. Revolución 123, Centro, Tijuana', contacto: '664 123 4567' };
