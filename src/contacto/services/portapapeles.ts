import type { Portapapeles } from '../domain/Portapapeles';

/** Adaptador sobre la API Clipboard del navegador. */
export const portapapelesNavegador: Portapapeles = {
  copiar: (texto) => navigator.clipboard.writeText(texto),
};
