import { fechaIsoEn, sitio, type FechaIso } from '@/compartido';
import { yaPaso } from '../domain/Evento';

/** Día de hoy en la zona horaria de Radiock, según el reloj de quien visita. */
const hoyEnRadiock = (): FechaIso => fechaIsoEn(new Date(), sitio.zonaHoraria);

/**
 * El sitio es estático: al compilar decide qué eventos son próximos. Este hook vuelve a decidirlo
 * al abrir la página, así un evento pasa solo a "Eventos anteriores" el día después de su fecha,
 * sin volver a compilar. Sin JavaScript se queda lo que se decidió al compilar.
 *
 * Marcado esperado (EventosOrganizados.astro):
 *   [data-agenda] > [data-agenda-proximos] > [data-evento-proximo][data-id][data-fecha]
 *                 > [data-agenda-vacio]          (aviso "La próxima fecha comienza a tomar forma")
 *                 > [data-agenda-recorrido]      (enlace "Nuestro recorrido")
 *                 > [data-agenda-anteriores] > [data-evento-archivo][data-id]
 */
export function useAgendaEnVivo(raiz: HTMLElement | null, hoy: FechaIso = hoyEnRadiock()): void {
  if (!raiz) return;
  const proximos = Array.from(raiz.querySelectorAll<HTMLElement>('[data-evento-proximo]'));
  for (const tarjeta of proximos) {
    if (!yaPaso(tarjeta.dataset.fecha ?? '', hoy)) continue;
    tarjeta.hidden = true;
    const archivo = raiz.querySelector<HTMLElement>(`[data-evento-archivo][data-id="${tarjeta.dataset.id}"]`);
    if (archivo) archivo.hidden = false;
  }

  const quedanProximos = proximos.some((tarjeta) => !tarjeta.hidden);
  const lista = raiz.querySelector<HTMLElement>('[data-agenda-proximos]');
  if (lista) {
    lista.hidden = !quedanProximos;
    // Con un solo próximo, la tarjeta usa el diseño de cartel y datos lado a lado.
    lista.dataset.cantidad = String(proximos.filter((tarjeta) => !tarjeta.hidden).length);
  }
  const vacio = raiz.querySelector<HTMLElement>('[data-agenda-vacio]');
  if (vacio) vacio.hidden = quedanProximos;

  const hayAnteriores = Array.from(raiz.querySelectorAll<HTMLElement>('[data-evento-archivo]')).some((tarjeta) => !tarjeta.hidden);
  raiz.querySelectorAll<HTMLElement>('[data-agenda-anteriores], [data-agenda-recorrido]').forEach((elemento) => {
    elemento.hidden = !hayAnteriores;
  });
}

/**
 * En la página de un evento compilada como próximo: si su fecha ya pasó, cambia los textos a
 * "evento finalizado" y muestra la sección del archivo de fotografías.
 *
 * Marcado esperado (PortadaEvento.astro y PaginaEvento.astro):
 *   [data-evento-fecha] con elementos [data-texto-finalizado]; [data-solo-finalizado] oculto.
 */
export function useEstadoEventoEnVivo(raiz: HTMLElement | null, hoy: FechaIso = hoyEnRadiock()): void {
  if (!raiz || !yaPaso(raiz.dataset.eventoFecha ?? '', hoy)) return;
  raiz.querySelectorAll<HTMLElement>('[data-texto-finalizado]').forEach((elemento) => {
    elemento.textContent = elemento.dataset.textoFinalizado ?? elemento.textContent;
  });
  document.querySelectorAll<HTMLElement>('[data-solo-finalizado]').forEach((elemento) => { elemento.hidden = false; });
}
