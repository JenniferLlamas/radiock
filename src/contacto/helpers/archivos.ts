import { KB, MB } from '../constants/archivos';
import type { ReglaArchivos } from '../domain/ReglaArchivos';

/** Valor del atributo accept: tipos MIME y extensiones. */
export const valorAccept = (regla: ReglaArchivos): string => [...regla.tipos, ...regla.extensiones].join(',');

/** Megas redondeados: "30 MB". */
export const megas = (bytes: number): string => `${Math.round(bytes / MB)} MB`;

/** Peso legible con un decimal: "820 KB", "2.4 MB". */
export const pesoLegible = (bytes: number): string =>
  bytes < MB ? `${Math.max(1, Math.round(bytes / KB))} KB` : `${(bytes / MB).toFixed(1)} MB`;

/** Identidad de un archivo elegido, para no agregarlo dos veces. */
export const huellaArchivo = (archivo: Pick<File, 'name' | 'size' | 'lastModified'>): string =>
  `${archivo.name}|${archivo.size}|${archivo.lastModified}`;

/** Lee un archivo como base64 sin el prefijo "data:…;base64,". */
export const leerComoBase64 = (archivo: Blob): Promise<string> =>
  new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(String(lector.result).split(',')[1] ?? '');
    lector.onerror = () => rechazar(lector.error);
    lector.readAsDataURL(archivo);
  });
