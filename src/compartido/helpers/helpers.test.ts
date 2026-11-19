import { describe, expect, it } from 'vitest';
import { cantidadEnPalabras, capitalizar } from './numeros';
import { redesRadiock } from './redesSociales';
import { rutaAncla } from './rutas';

describe('números', () => {
  it('escribe cantidades pequeñas con palabras y grandes con cifras', () => {
    expect(cantidadEnPalabras(6)).toBe('seis');
    expect(cantidadEnPalabras(12)).toBe('doce');
    expect(cantidadEnPalabras(20)).toBe('20');
    expect(capitalizar('seis')).toBe('Seis');
  });
});

describe('redes sociales', () => {
  it('solo muestra las redes con URL, en el orden del registro', () => {
    expect(redesRadiock({ twitch: 'https://t', youtube: '', instagram: 'https://i' })).toEqual([
      { nombre: 'Instagram', url: 'https://i' },
      { nombre: 'Twitch', url: 'https://t' },
    ]);
  });

  it('por defecto usa las redes configuradas del sitio', () => {
    expect(redesRadiock().map((r) => r.nombre)).toEqual(['Instagram', 'Facebook', 'Twitch']);
  });
});

describe('rutas', () => {
  it('enlaza secciones de la página de inicio desde cualquier ruta', () => {
    expect(rutaAncla('bandas')).toBe('/#bandas');
  });
});
