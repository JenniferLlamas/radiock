import { SALUDO_PRESENTACION } from '../constants/mensajes';
import { camposPresentacion } from '../data/camposPresentacion';
import type { CampoPresentacion, LectorCampos } from '../domain/CampoPresentacion';

/** Compone el mensaje para redes omitiendo los campos vacíos. Función pura, sin dependencias del navegador. */
export function componerPresentacion(
  leer: LectorCampos,
  campos: readonly CampoPresentacion[] = camposPresentacion,
  saludo: string = SALUDO_PRESENTACION,
): string {
  const lineas = campos
    .map((campo) => ({ campo, valor: (leer(campo.nombre) ?? '').trim() }))
    .filter(({ valor }) => valor)
    .map(({ campo, valor }) => `${campo.etiquetaMensaje}: ${valor}`);
  return [saludo, '', ...lineas].join('\n');
}
