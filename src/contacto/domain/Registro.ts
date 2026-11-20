import type { CampoPresentacion } from './CampoPresentacion';
import type { ReglaArchivos } from './ReglaArchivos';

/** Quién se registra. Es también la clave `tipo` que recibe el backend. */
export type TipoRegistro = 'banda' | 'local';

/**
 * Definición de un formulario de registro: qué campos y archivos pide y cómo se presenta.
 * Los controladores (con envío o por mensaje) son los mismos para todos los tipos.
 */
export interface Registro {
  readonly tipo: TipoRegistro;
  readonly campos: readonly CampoPresentacion[];
  /** Material que se puede adjuntar; vacío si el formulario solo tiene texto. */
  readonly archivos: readonly ReglaArchivos[];
  /** Campo cuyo valor se muestra en el mensaje de éxito ("Recibimos el registro de …"). */
  readonly campoNombre: string;
  /** Primera línea del mensaje para redes (modo sin backend). */
  readonly saludo: string;
}
