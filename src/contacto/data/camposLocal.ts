import type { CampoPresentacion } from '../domain/CampoPresentacion';

/**
 * Campos del registro de locales que quieren prestar su espacio para eventos.
 * Si el registro se envía al backend, actualiza también CAMPOS_LOCAL en
 * backend/registro-bandas/data/camposLocal.js.
 */
export const camposLocal: readonly CampoPresentacion[] = [
  { nombre: 'local', etiqueta: 'Nombre del local', etiquetaMensaje: 'Local', obligatorio: true, maximo: 120, sugerencia: 'Bar, foro, café…', autocompletar: 'organization' },
  { nombre: 'responsable', etiqueta: 'Responsable', etiquetaMensaje: 'Responsable', obligatorio: true, maximo: 120, sugerencia: 'Con quién hablamos', autocompletar: 'name' },
  { nombre: 'ubicacion', etiqueta: 'Ubicación', etiquetaMensaje: 'Ubicación', obligatorio: true, maximo: 300, sugerencia: 'Dirección o colonia, y ciudad', autocompletar: 'street-address' },
  { nombre: 'contacto', etiqueta: 'Teléfono o correo', etiquetaMensaje: 'Contacto', obligatorio: true, maximo: 200, sugerencia: 'Dónde te podemos contactar' },
];
