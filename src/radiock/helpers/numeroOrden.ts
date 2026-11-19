/** Número de orden con dos cifras: 1 → "01". */
export const numeroOrden = (indice: number): string => String(indice + 1).padStart(2, '0');
