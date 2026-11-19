import type { Page } from '@playwright/test';
import { URL_APPS_SCRIPT } from './urls';

export interface SolicitudRecibida {
  tipoContenido: string;
  campos: Record<string, string>;
  sitioWeb: string;
  archivos: { campo: string; nombre: string; tipo: string; bytes: Buffer }[];
}

interface Opciones {
  /** Respuesta del backend; por defecto { ok: true }. */
  responder?: (solicitud: SolicitudRecibida) => { ok: boolean; error?: string };
}

/**
 * Imita el Web App de Apps Script interceptando la red, con CORS abierto.
 * Devuelve la lista de solicitudes recibidas (con los archivos ya decodificados).
 *
 * El Apps Script real responde POST → 302 → GET. Aquí se responde 200 directamente porque
 * Chrome rechaza un 302 *simulado por Playwright* en un fetch entre dominios ("Failed to
 * fetch"), aunque con un servidor real sí lo sigue. Seguir la redirección es trabajo del
 * navegador (fetch con redirect: 'follow'); lo que dependen de nuestro código —formato del
 * envío, CORS sin preflight, archivos y manejo de errores— sí queda cubierto.
 */
export async function simularAppsScript(page: Page, { responder = () => ({ ok: true }) }: Opciones = {}) {
  const recibidas: SolicitudRecibida[] = [];
  const cors = { 'access-control-allow-origin': '*' };
  const origen = new URL(URL_APPS_SCRIPT).origin;

  await page.route(`${origen}/**`, async (ruta) => {
    const peticion = ruta.request();
    if (peticion.method() === 'OPTIONS') {
      // Apps Script no responde preflight: si llega uno, el sitio está enviando mal la petición.
      await ruta.fulfill({ status: 405 });
      return;
    }
    if (peticion.method() === 'POST') {
      const cuerpo = JSON.parse(peticion.postData() ?? '{}');
      const solicitud: SolicitudRecibida = {
        tipoContenido: (await peticion.allHeaders())['content-type'] ?? '',
        campos: cuerpo.campos,
        sitioWeb: cuerpo.sitioWeb,
        archivos: cuerpo.archivos.map((a: { campo: string; nombre: string; tipo: string; contenido: string }) => ({
          campo: a.campo, nombre: a.nombre, tipo: a.tipo, bytes: Buffer.from(a.contenido, 'base64'),
        })),
      };
      recibidas.push(solicitud);
      await ruta.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify(responder(solicitud)) });
      return;
    }
    await ruta.fulfill({ status: 404, headers: cors });
  });

  return recibidas;
}
