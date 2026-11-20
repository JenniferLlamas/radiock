import type { TipoRegistro } from './Registro';

/** Archivo elegido por la persona, junto al campo del formulario del que viene. */
export interface ArchivoParaEnviar {
  readonly campo: string;
  readonly archivo: File;
}

export interface SolicitudRegistro {
  readonly tipo: TipoRegistro;
  readonly campos: Readonly<Record<string, string>>;
  readonly archivos: readonly ArchivoParaEnviar[];
  /** Campo trampa: vacío para personas, relleno por bots. */
  readonly sitioWeb: string;
}

/** Puerto de envío del registro. El controlador del formulario solo conoce esta interfaz. */
export interface EnvioRegistro {
  /** Resuelve si el registro quedó guardado; rechaza con un ErrorRegistro si no. */
  enviar(solicitud: SolicitudRegistro): Promise<void>;
}

/** Error con un mensaje que se puede mostrar tal cual a quien llena el formulario. */
export class ErrorRegistro extends Error {
  override name = 'ErrorRegistro';
}
