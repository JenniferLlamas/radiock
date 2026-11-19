import { MAX_BYTES_TOTAL } from '../constants/archivos';
import { archivosPresentacion } from '../data/archivosPresentacion';
import { megas } from '../helpers/archivos';
import type { ArchivoAdjunto, ReglaArchivos } from './ReglaArchivos';

/** Error de un solo archivo frente a su regla (formato, vacío o tamaño); null si es válido. */
export function validarArchivo(archivo: Pick<ArchivoAdjunto, 'nombre' | 'tipo' | 'tamano'>, regla: ReglaArchivos): string | null {
  if (!regla.tipos.includes(archivo.tipo)) return `"${archivo.nombre}" no tiene un formato permitido.`;
  if (archivo.tamano === 0) return `"${archivo.nombre}" está vacío.`;
  if (archivo.tamano > regla.maxBytes) return `"${archivo.nombre}" pesa más de ${megas(regla.maxBytes)}.`;
  return null;
}

/** Valida todo el material: cantidades por sección, cada archivo y el total. Lista vacía si es válido. */
export function validarArchivos(
  archivos: readonly ArchivoAdjunto[],
  reglas: readonly ReglaArchivos[] = archivosPresentacion,
  maxTotal: number = MAX_BYTES_TOTAL,
): string[] {
  const errores: string[] = [];
  for (const regla of reglas) {
    const delCampo = archivos.filter((archivo) => archivo.campo === regla.nombre);
    if (regla.obligatorio && delCampo.length === 0) errores.push(`Adjunta ${regla.etiqueta.toLowerCase()}.`);
    if (delCampo.length > regla.maximo) {
      errores.push(`${regla.etiqueta}: puedes adjuntar como máximo ${regla.maximo}.`);
    }
    for (const archivo of delCampo) {
      const error = validarArchivo(archivo, regla);
      if (error) errores.push(error);
    }
  }
  const total = archivos.reduce((suma, archivo) => suma + archivo.tamano, 0);
  if (total > maxTotal) errores.push(`Entre todos, los archivos pesan más de ${megas(maxTotal)}.`);
  return errores;
}
