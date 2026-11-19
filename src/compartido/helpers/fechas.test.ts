import { describe, expect, it } from 'vitest';
import { esFechaIso, fechaIsoEn, formatearFecha } from './fechas';

describe('fechas', () => {
  it('reconoce fechas ISO válidas y rechaza otros formatos', () => {
    expect(esFechaIso('2024-08-10')).toBe(true);
    expect(esFechaIso('10/08/2024')).toBe(false);
    expect(esFechaIso('2024-13-45')).toBe(false);
  });

  it('calcula el día según la zona horaria, no la del servidor', () => {
    // 05:00 UTC del 1 de enero todavía es 31 de diciembre en Tijuana
    expect(fechaIsoEn(new Date('2026-01-01T05:00:00Z'), 'America/Tijuana')).toBe('2025-12-31');
    expect(fechaIsoEn(new Date('2026-01-01T09:00:00Z'), 'America/Tijuana')).toBe('2026-01-01');
  });

  it('formatea en español sin cambiar de día', () => {
    expect(formatearFecha('2024-08-10')).toBe('10 de agosto de 2024');
    expect(formatearFecha('2025-01-01')).toBe('1 de enero de 2025');
  });
});
