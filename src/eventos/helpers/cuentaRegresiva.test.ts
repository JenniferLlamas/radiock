import { describe, expect, it } from 'vitest';
import { describirTiempo, dosDigitos, fechaCorta, horaLegible, inicioEvento, tiempoRestante } from './cuentaRegresiva';

const zona = 'America/Tijuana';

describe('inicioEvento', () => {
  it('usa el desfase de Tijuana de esa fecha (invierno -08:00, verano -07:00)', () => {
    expect(inicioEvento({ fecha: '2026-12-05', hora: '17:00' }, zona)).toBe('2026-12-05T17:00:00-08:00');
    expect(inicioEvento({ fecha: '2025-08-30', hora: '17:00' }, zona)).toBe('2025-08-30T17:00:00-07:00');
  });

  it('sin hora, cuenta desde la medianoche', () => {
    expect(inicioEvento({ fecha: '2026-12-05' }, zona)).toBe('2026-12-05T00:00:00-08:00');
  });

  it('el instante corresponde a las 17:00 en Tijuana', () => {
    const instante = new Date(inicioEvento({ fecha: '2026-12-05', hora: '17:00' }, zona));
    expect(instante.toISOString()).toBe('2026-12-06T01:00:00.000Z');
  });
});

describe('tiempoRestante', () => {
  const inicio = Date.parse('2026-12-05T17:00:00-08:00');

  it('separa días, horas, minutos y segundos', () => {
    const ahora = inicio - ((15 * 24 + 2) * 3600 + 10 * 60 + 5) * 1000;
    expect(tiempoRestante(inicio, ahora)).toEqual({ dias: 15, horas: 2, minutos: 10, segundos: 5, empezo: false });
  });

  it('en cero y "empezó" a la hora de inicio o después', () => {
    expect(tiempoRestante(inicio, inicio)).toMatchObject({ dias: 0, horas: 0, minutos: 0, segundos: 0, empezo: true });
    expect(tiempoRestante(inicio, inicio + 3600_000).empezo).toBe(true);
  });
});

describe('describirTiempo', () => {
  it('arma una frase en español sin segundos y con singulares', () => {
    expect(describirTiempo({ dias: 15, horas: 2, minutos: 10, segundos: 5, empezo: false })).toBe('Faltan 15 días, 2 horas y 10 minutos');
    expect(describirTiempo({ dias: 1, horas: 0, minutos: 1, segundos: 0, empezo: false })).toBe('Faltan 1 día y 1 minuto');
    expect(describirTiempo({ dias: 0, horas: 0, minutos: 0, segundos: 30, empezo: false })).toBe('Falta menos de un minuto');
  });

  it('dos dígitos', () => {
    expect(dosDigitos(5)).toBe('05');
    expect(dosDigitos(12)).toBe('12');
  });
});

describe('textos de fecha y hora', () => {
  it('hora en formato de 12 horas', () => {
    expect(horaLegible('17:00')).toBe('5:00 pm');
    expect(horaLegible('12:30')).toBe('12:30 pm');
    expect(horaLegible('00:15')).toBe('12:15 am');
    expect(horaLegible('09:05')).toBe('9:05 am');
  });

  it('fecha corta sin puntos ni comas', () => {
    expect(fechaCorta('2026-12-05')).toBe('sáb 5 dic');
  });
});
