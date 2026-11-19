/** Campo de texto de la presentación de una banda (formulario, mensaje y backend). */
export interface CampoPresentacion {
  readonly nombre: string;
  /** Texto visible en el formulario, sin el asterisco de obligatorio. */
  readonly etiqueta: string;
  /** Prefijo de la línea en el mensaje. */
  readonly etiquetaMensaje: string;
  readonly obligatorio: boolean;
  readonly tipo?: 'text' | 'url';
  readonly maximo: number;
  readonly sugerencia: string;
  readonly autocompletar?: string;
}

/** Lector de valores desacoplado del DOM: puede ser un FormData, un objeto o un doble de prueba. */
export type LectorCampos = (nombre: string) => string | null | undefined;
