const PALABRAS = [
  'cero', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis',
  'siete', 'ocho', 'nueve', 'diez', 'once', 'doce',
];

/** Escribe cantidades pequeñas con palabras ("seis"); a partir de 13 usa cifras. */
export const cantidadEnPalabras = (cantidad: number): string =>
  PALABRAS[cantidad] ?? String(cantidad);

export const capitalizar = (texto: string): string =>
  texto.charAt(0).toUpperCase() + texto.slice(1);
