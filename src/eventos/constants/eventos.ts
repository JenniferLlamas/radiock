/** Ruta base de las páginas de evento: /eventos/<id>. Debe coincidir con src/pages/eventos/[id].astro. */
export const RUTA_EVENTOS = '/eventos';

/** Separador entre el nombre del venue y su ubicación ("República de Hops · Pasaje Revolución"). */
export const SEPARADOR_VENUE = ' · ';

/** Textos fijos de la página de detalle según el estado del evento. */
export const TEXTOS_ESTADO = {
  finalizado: { antetitulo: 'NUESTRO RECORRIDO / EVENTO ANTERIOR', estado: 'EVENTO FINALIZADO' },
  proximo: { antetitulo: 'NOS VEMOS FRENTE AL ESCENARIO / PRÓXIMO EVENTO', estado: 'PRÓXIMO EVENTO' },
} as const;
