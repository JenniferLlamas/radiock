import type { CampoPresentacion } from '../domain/CampoPresentacion';

/**
 * Campos de la presentación de una banda. El formulario, el mensaje para redes y el
 * registro se construyen a partir de esta lista: para añadir, quitar o reordenar un
 * campo solo se edita aquí. Si el registro se envía al backend, actualiza también
 * CAMPOS en backend/registro-bandas/data/campos.js.
 */
export const camposPresentacion: readonly CampoPresentacion[] = [
  { nombre: 'banda', etiqueta: 'Nombre de la banda', etiquetaMensaje: 'Banda', obligatorio: true, maximo: 120, sugerencia: 'Así nos llamamos', autocompletar: 'organization' },
  { nombre: 'ciudad', etiqueta: 'Ciudad', etiquetaMensaje: 'Ciudad', obligatorio: true, maximo: 120, sugerencia: 'De dónde venimos', autocompletar: 'address-level2' },
  { nombre: 'genero', etiqueta: 'Género', etiquetaMensaje: 'Género', obligatorio: true, maximo: 120, sugerencia: 'A qué sonamos' },
  { nombre: 'instagram', etiqueta: 'Instagram', etiquetaMensaje: 'Instagram', obligatorio: false, tipo: 'url', maximo: 300, sugerencia: 'https://www.instagram.com/…' },
  { nombre: 'youtube', etiqueta: 'YouTube', etiquetaMensaje: 'YouTube', obligatorio: false, tipo: 'url', maximo: 300, sugerencia: 'https://www.youtube.com/…' },
  { nombre: 'contacto', etiqueta: 'Contacto', etiquetaMensaje: 'Contacto', obligatorio: true, maximo: 200, sugerencia: 'Correo, teléfono o perfil donde encontrarte' },
];
