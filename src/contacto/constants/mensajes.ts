/** Textos fijos del formulario de contacto y registro de bandas. */

export const SALUDO_PRESENTACION = '¡Hola, Radiock! Queremos compartir nuestra música original con ustedes.';

export const MENSAJE_OBLIGATORIO = 'Completa este campo.';

/** Modo sin backend: copiar el mensaje para redes. */
export const MENSAJES_COPIA = {
  copiado: 'Mensaje copiado. Abre nuestras redes y pégalo en un mensaje directo.',
  seleccionado: 'Seleccionamos el mensaje. Usa Copiar en tu dispositivo y pégalo en nuestras redes.',
} as const;

/** Modo con backend: estados del envío. */
export const MENSAJES_REGISTRO = {
  enviando: 'Enviando tu registro…',
  enviandoArchivos: (cantidad: number) =>
    `Enviando tu registro y ${cantidad} archivo(s)… Puede tardar un poco; no cierres la página.`,
  errorInesperado: 'Algo salió mal al enviar. Inténtalo de nuevo o escríbenos por nuestras redes.',
  errorRed: 'No pudimos conectar con Radiock. Revisa tu conexión e inténtalo de nuevo.',
  errorGuardado: 'No pudimos guardar tu registro. Inténtalo de nuevo en unos minutos.',
} as const;

/** Vista previa de canciones. */
export const MENSAJES_REPRODUCTOR = {
  sinVistaPrevia: 'Sin vista previa',
  escuchar: (nombre: string) => `Escuchar ${nombre}`,
  avance: (nombre: string) => `Avance de ${nombre}`,
} as const;
