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
  /** Cartel completo. */
  readonly cartel: string;
  /** Medidas del cartel en píxeles; si faltan, 1000×1545 (vertical, como los primeros carteles). */
  readonly cartelMedidas?: { readonly ancho: number; readonly alto: number };
  /** Imagen horizontal para el archivo; si falta se usa el cartel. */
  readonly miniatura?: string;
  /** Nombres tal como aparecen en el cartel. */
  readonly bandas: readonly string[];
}

export type EstadoEvento = 'proximo' | 'finalizado';

/** Un evento sigue siendo próximo durante todo el día en que ocurre; pasa al archivo al día siguiente. */
export const yaPaso = (fecha: FechaIso, hoy: FechaIso): boolean => fecha < hoy;

export const estadoEvento = (evento: Evento, hoy: FechaIso): EstadoEvento =>
  yaPaso(evento.fecha, hoy) ? 'finalizado' : 'proximo';

export const rutaEvento = (evento: Pick<Evento, 'id'>): string => `${RUTA_EVENTOS}/${evento.id}`;

export const imagenArchivo = (evento: Evento): string => evento.miniatura ?? evento.cartel;

export const medidasCartel = (evento: Evento): { ancho: number; alto: number } =>
  evento.cartelMedidas ?? { ancho: 1000, alto: 1545 };

const ordenPorFecha = (a: Evento, b: Evento) => a.fecha.localeCompare(b.fecha);
export const ordenarPorFecha = (eventos: readonly Evento[]): Evento[] => [...eventos].sort(ordenPorFecha);
