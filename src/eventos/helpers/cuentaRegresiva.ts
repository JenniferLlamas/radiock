import type { FechaIso } from '@/compartido';
import type { Evento } from '../domain/Evento';

/** Hora en que empieza un evento que no la indica. */
const HORA_POR_DEFECTO = '00:00';

/**
 * Desfase de la zona horaria en una fecha concreta ("-08:00" en invierno en Tijuana, "-07:00" en
 * verano), para escribir el inicio del evento como un instante ISO que cualquier navegador entiende.
 */
export function desfaseZona(fecha: FechaIso, hora: string, zonaHoraria: string): string {
  const aproximado = new Date(`${fecha}T${hora}:00Z`);
  const nombre = new Intl.DateTimeFormat('en-US', { timeZone: zonaHoraria, timeZoneName: 'longOffset' })
    .formatToParts(aproximado)
    .find((parte) => parte.type === 'timeZoneName')?.value ?? 'GMT';
  return nombre === 'GMT' ? '+00:00' : nombre.replace('GMT', '');
}

/** Inicio del evento como instante ISO con desfase, por ejemplo "2026-12-05T17:00:00-08:00". */
export const inicioEvento = (evento: Pick<Evento, 'fecha' | 'hora'>, zonaHoraria: string): string => {
  const hora = evento.hora ?? HORA_POR_DEFECTO;
  return `${evento.fecha}T${hora}:00${desfaseZona(evento.fecha, hora, zonaHoraria)}`;
};

export interface TiempoRestante {
  readonly dias: number;
  readonly horas: number;
  readonly minutos: number;
  readonly segundos: number;
  /** true cuando ya llegó la hora de inicio. */
  readonly empezo: boolean;
}

/** Cuánto falta desde `ahora` hasta `inicio` (milisegundos). En cero si ya empezó. */
export function tiempoRestante(inicio: number, ahora: number): TiempoRestante {
  const restante = Math.max(0, Math.floor((inicio - ahora) / 1000));
  return {
    dias: Math.floor(restante / 86400),
    horas: Math.floor((restante % 86400) / 3600),
    minutos: Math.floor((restante % 3600) / 60),
    segundos: restante % 60,
    empezo: restante === 0,
  };
}

/** "Faltan 15 días, 2 horas y 10 minutos": resumen para lectores de pantalla (sin segundos). */
export function describirTiempo({ dias, horas, minutos }: TiempoRestante): string {
  const partes = [
    [dias, 'día', 'días'],
    [horas, 'hora', 'horas'],
    [minutos, 'minuto', 'minutos'],
  ] as const;
  const texto = partes.filter(([valor]) => valor > 0).map(([valor, uno, varios]) => `${valor} ${valor === 1 ? uno : varios}`);
  if (!texto.length) return 'Falta menos de un minuto';
  const lista = texto.length > 1 ? `${texto.slice(0, -1).join(', ')} y ${texto[texto.length - 1]}` : texto[0];
  return `Faltan ${lista}`;
}

/** Dos dígitos para horas, minutos y segundos. */
export const dosDigitos = (valor: number): string => String(valor).padStart(2, '0');

/** "17:00" → "5:00 pm"; "12:30" → "12:30 pm"; "00:15" → "12:15 am". */
export function horaLegible(hora: string): string {
  const [h, m] = hora.split(':').map(Number);
  return `${h % 12 || 12}:${dosDigitos(m)} ${h < 12 ? 'am' : 'pm'}`;
}

const formatoCorto = new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

/** "sáb 5 dic" (sin "de" ni puntos de abreviatura), para la barra de aviso. */
export function fechaCorta(fecha: FechaIso): string {
  const partes = formatoCorto.formatToParts(new Date(`${fecha}T12:00:00Z`));
  const valor = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((p) => p.type === tipo)?.value.replace('.', '') ?? '';
  return `${valor('weekday')} ${valor('day')} ${valor('month')}`;
}
