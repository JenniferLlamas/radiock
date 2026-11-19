import type { FechaIso, Identificable } from '@/compartido';
import { RUTA_EVENTOS } from '../constants/eventos';

export interface Evento extends Identificable {
  readonly titulo: string;
  /** Fecha ISO `YYYY-MM-DD`. */
  readonly fecha: FechaIso;
  /** Hora local `HH:MM`, opcional. */
  readonly hora?: string;
  readonly venue: string;
  readonly ciudad: string;
  /** Cartel completo (vertical). */
  readonly cartel: string;
  /** Imagen horizontal para el archivo; si falta se usa el cartel. */
  readonly miniatura?: string;
  /** Nombres tal como aparecen en el cartel. */
  readonly bandas: readonly string[];
}

export type EstadoEvento = 'proximo' | 'finalizado';

/** Un evento sigue siendo próximo durante todo el día en que ocurre. */
export const estadoEvento = (evento: Evento, hoy: FechaIso): EstadoEvento =>
  evento.fecha >= hoy ? 'proximo' : 'finalizado';

export const rutaEvento = (evento: Pick<Evento, 'id'>): string => `${RUTA_EVENTOS}/${evento.id}`;

export const imagenArchivo = (evento: Evento): string => evento.miniatura ?? evento.cartel;

const ordenPorFecha = (a: Evento, b: Evento) => a.fecha.localeCompare(b.fecha);
export const ordenarPorFecha = (eventos: readonly Evento[]): Evento[] => [...eventos].sort(ordenPorFecha);
