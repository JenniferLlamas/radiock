import type { EnlaceNavegacion } from '../domain/EnlaceNavegacion';

export const navegacion: readonly EnlaceNavegacion[] = [
  { etiqueta: 'Inicio', ancla: 'inicio' },
  { etiqueta: 'Radiock', ancla: 'radiock' },
  { etiqueta: 'Eventos', ancla: 'eventos' },
  { etiqueta: 'Bandas', ancla: 'bandas' },
  { etiqueta: 'Comunidad', ancla: 'comunidad' },
  { etiqueta: 'Contacto', ancla: 'contacto' },
];

export const llamadoNavegacion: EnlaceNavegacion = { etiqueta: 'Hagamos ruido', ancla: 'convocatoria' };
