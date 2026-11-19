import { MENSAJES_REGISTRO } from '../constants/mensajes';
import { ErrorRegistro, type EnvioRegistro, type SolicitudRegistro } from '../domain/EnvioRegistro';
import { leerComoBase64 } from '../helpers/archivos';

/**
 * Adaptador para el Web App de Google Apps Script (backend/registro-bandas).
 * Envía JSON como text/plain para que sea una petición CORS "simple", sin preflight,
 * que Apps Script no admite. Apps Script responde con una redirección que fetch sigue.
 */
export function envioAppsScript(url: string, leer: (archivo: Blob) => Promise<string> = leerComoBase64): EnvioRegistro {
  return {
    async enviar(solicitud: SolicitudRegistro): Promise<void> {
      const archivos = await Promise.all(solicitud.archivos.map(async ({ campo, archivo }) => ({
        campo,
        nombre: archivo.name,
        tipo: archivo.type,
        contenido: await leer(archivo),
      })));

      let respuesta: Response;
      try {
        respuesta = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ campos: solicitud.campos, archivos, sitioWeb: solicitud.sitioWeb }),
          redirect: 'follow',
        });
      } catch {
        throw new ErrorRegistro(MENSAJES_REGISTRO.errorRed);
      }

      const cuerpo = await respuesta.json().catch(() => null) as { ok?: boolean; error?: string } | null;
      if (!respuesta.ok || !cuerpo?.ok) {
        throw new ErrorRegistro(cuerpo?.error || MENSAJES_REGISTRO.errorGuardado);
      }
    },
  };
}
