import type { EnlaceExterno, Identificable } from '@/compartido';

/** Foto de una banda: versión grande (hasta 1600 px) y miniatura (hasta 640 px), ambas WebP. */
export interface FotoBanda {
  readonly imagen: string;
  readonly miniatura: string;
  readonly alt: string;
  /** Medidas de la versión grande, para reservar su espacio y evitar saltos al cargar. */
  readonly ancho: number;
  readonly alto: number;
}

export interface Banda extends Identificable {
  readonly nombre: string;
  /** public/bandas/<id>/logo.png, con fondo transparente o oscuro (las tarjetas son oscuras). */
  readonly logo: string;
  readonly ciudad?: string;
  readonly genero?: string;
  readonly redes: readonly EnlaceExterno[];
  /** Fotos de public/bandas/<id>/fotos/ que aparecen en la galería. */
  readonly fotos: readonly FotoBanda[];
}
