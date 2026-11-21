import { fechaIsoEn, sitio } from '@/compartido';
import { yaPaso } from '../domain/Evento';
import { describirTiempo, dosDigitos, tiempoRestante } from '../helpers/cuentaRegresiva';

/**
 * Activa los contadores del próximo evento y decide qué avisos se ven, con el reloj de quien visita:
 *   - Antes de la hora de inicio: días, horas, minutos y segundos que faltan.
 *   - Desde la hora de inicio y durante el resto de ese día: el mensaje "¡Ya empezó!".
 *   - Al día siguiente (hora de Tijuana): se ocultan los avisos [data-aviso-evento] de ese evento
 *     y se muestran los elementos [data-sin-aviso] (por ejemplo, el boleto original de la portada).
 * Sin JavaScript se ve la fecha escrita en lugar del contador.
 *
 * Marcado esperado (CuentaRegresiva.astro):
 *   [data-cuenta-regresiva][data-inicio] > [data-cuenta-fecha] (respaldo sin JS)
 *                                        > [data-cuenta-unidades] > [data-unidad="dias|horas|minutos|segundos"]
 *                                        > [data-cuenta-empezo]
 * Devuelve una función que detiene el contador.
 */
export function useCuentaRegresiva(raiz: ParentNode = document, ahora: () => number = Date.now): () => void {
  const contadores = Array.from(raiz.querySelectorAll<HTMLElement>('[data-cuenta-regresiva]'));
  const avisos = Array.from(raiz.querySelectorAll<HTMLElement>('[data-aviso-evento]'));
  if (!contadores.length && !avisos.length) return () => {};
  contadores.forEach((contador) => {
    contador.querySelector<HTMLElement>('[data-cuenta-fecha]')?.setAttribute('hidden', '');
  });

  const actualizar = () => {
    const instante = ahora();
    const hoy = fechaIsoEn(new Date(instante), sitio.zonaHoraria);
    avisos.forEach((aviso) => { aviso.hidden = yaPaso(aviso.dataset.fecha ?? '', hoy); });
    const hayAviso = avisos.some((aviso) => !aviso.hidden);
    raiz.querySelectorAll<HTMLElement>('[data-sin-aviso]').forEach((elemento) => { elemento.hidden = hayAviso; });

    for (const contador of contadores) {
      const tiempo = tiempoRestante(Date.parse(contador.dataset.inicio ?? ''), instante);
      const unidades = contador.querySelector<HTMLElement>('[data-cuenta-unidades]');
      const empezo = contador.querySelector<HTMLElement>('[data-cuenta-empezo]');
      if (unidades) unidades.hidden = tiempo.empezo;
      if (empezo) empezo.hidden = !tiempo.empezo;
      if (tiempo.empezo) continue;
      const valores = { dias: String(tiempo.dias), horas: dosDigitos(tiempo.horas), minutos: dosDigitos(tiempo.minutos), segundos: dosDigitos(tiempo.segundos) };
      for (const [unidad, valor] of Object.entries(valores)) {
        const celda = contador.querySelector<HTMLElement>(`[data-unidad="${unidad}"]`);
        if (celda && celda.textContent !== valor) celda.textContent = valor;
      }
      // Resumen para lectores de pantalla; cambia cada minuto, no cada segundo.
      const resumen = describirTiempo(tiempo);
      if (unidades && unidades.getAttribute('aria-label') !== resumen) unidades.setAttribute('aria-label', resumen);
    }
  };

  actualizar();
  const intervalo = window.setInterval(actualizar, 1000);
  return () => window.clearInterval(intervalo);
}
