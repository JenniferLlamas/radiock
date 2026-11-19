// API pública del núcleo compartido (solo TypeScript, sin componentes):
//   '@/compartido'        → domain, data, constants, helpers y services
//   '@/compartido/hooks'  → hooks para el navegador
//   '@/compartido/ui'     → componentes Astro

// domain
export type { Identificable, Repositorio } from './domain/Repositorio';
export type { EnlaceExterno } from './domain/EnlaceExterno';
export type { EnlaceNavegacion } from './domain/EnlaceNavegacion';
export type { FechaIso } from './domain/FechaIso';

// constants
export { sitio } from './constants/sitio';
export { nombresRedes, type IdRedSocial } from './constants/redesSociales';

// data
export { navegacion, llamadoNavegacion } from './data/navegacion';

// helpers
export { esFechaIso, fechaIsoEn, formatearFecha } from './helpers/fechas';
export { cantidadEnPalabras, capitalizar } from './helpers/numeros';
export { redesRadiock } from './helpers/redesSociales';
export { rutaAncla } from './helpers/rutas';
export { comportamientoDesplazamiento, consultaMovimientoReducido, prefiereMovimientoReducido } from './helpers/preferencias';

// services
export { RepositorioEnMemoria } from './services/RepositorioEnMemoria';
