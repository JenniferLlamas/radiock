import { cantidadEnPalabras, capitalizar, formatearFecha } from '@/compartido';
import { SEPARADOR_VENUE, TEXTOS_ESTADO } from '../constants/eventos';
import type { EstadoEvento, Evento } from '../domain/Evento';

/** Lugar corto: "República de Hops, Tijuana, B.C" (sin el punto final, para no duplicarlo en una frase). */
export const lugarCorto = (evento: Pick<Evento, 'venue' | 'ciudad'>): string =>
  `${evento.venue.split(SEPARADOR_VENUE)[0]}, ${evento.ciudad.replace(/\.$/, '')}`;

/** Textos derivados de los datos del evento, para no escribirlos a mano en cada página. */
export const textosEvento = (evento: Evento, estado: EstadoEvento) => {
  const cantidad = cantidadEnPalabras(evento.bandas.length);
  const fecha = formatearFecha(evento.fecha);
  const lugar = lugarCorto(evento);
  return {
    tituloPagina: `${evento.titulo} | Radiock`,
    descripcion: estado === 'finalizado'
      ? `El archivo de ${evento.titulo}: ${cantidad} bandas de música original reunidas el ${fecha} en ${lugar}.`
      : `${evento.titulo}: ${cantidad} bandas de música original el ${fecha} en ${lugar}.`,
    ...TEXTOS_ESTADO[estado],
    lema: `${capitalizar(cantidad)} propuestas originales. Un mismo escenario.`,
    altCartel: `Cartel original de ${evento.titulo} con sus ${cantidad} bandas participantes`,
    fecha,
  };
};
