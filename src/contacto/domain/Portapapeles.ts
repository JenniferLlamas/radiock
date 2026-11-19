/** Puerto para copiar texto. El controlador del formulario depende de esta interfaz, no de la API del navegador. */
export interface Portapapeles {
  /** Rechaza la promesa si no se pudo copiar. */
  copiar(texto: string): Promise<void>;
}
