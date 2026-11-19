import { FORMATO_FECHA_ISO, LOCALE } from '../constants/fechas';
import type { FechaIso } from '../domain/FechaIso';

export const esFechaIso = (valor: string): valor is FechaIso =>
  FORMATO_FECHA_ISO.test(valor) && !Number.isNaN(Date.parse(valor + 'T00:00:00Z'));

/** Día actual en la zona horaria indicada, para no depender de la del servidor de compilación. */
export const fechaIsoEn = (instante: Date, zonaHoraria: string): FechaIso =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: zonaHoraria,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instante);

const formatoLargo = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "10 de agosto de 2024". Se formatea en UTC al mediodía para que el día no cambie por zona horaria. */
export const formatearFecha = (fecha: FechaIso): string =>
  formatoLargo.format(new Date(fecha + 'T12:00:00Z'));
