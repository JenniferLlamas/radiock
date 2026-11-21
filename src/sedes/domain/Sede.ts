import type { Identificable } from '@/compartido';

/** Lugar que prestó su espacio para un Radiock Fest. */
export interface Sede extends Identificable {
  readonly nombre: string;
  /** Dónde está, como se ve en la tarjeta. */
  readonly ubicacion: string;
  /** public/sedes/<id>/logo.webp, con fondo transparente (las tarjetas son oscuras). */
  readonly logo: string;
  /** Ids de los eventos que se hicieron ahí, en orden cronológico. */
  readonly eventos: readonly string[];
}
