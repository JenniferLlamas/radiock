import { describe, expect, it } from 'vitest';
import { archivosPresentacion } from '../data/archivosPresentacion';
import { huellaArchivo, megas, pesoLegible, valorAccept } from './archivos';
import { componerPresentacion } from './componerPresentacion';
import { formatoTiempo } from './tiempo';

describe('componerPresentacion', () => {
  it('arma el mensaje en el orden de los campos y omite los vacíos', () => {
    const datos: Record<string, string> = { contacto: 'x@y.z', banda: ' Oblivion ', ciudad: 'Tijuana', genero: 'Rock', instagram: '' };
    expect(componerPresentacion((campo) => datos[campo])).toBe(
      '¡Hola, Radiock! Queremos compartir nuestra música original con ustedes.\n\nBanda: Oblivion\nCiudad: Tijuana\nGénero: Rock\nContacto: x@y.z',
    );
  });
});

describe('archivos', () => {
  it('muestra pesos legibles', () => {
    expect(pesoLegible(500)).toBe('1 KB');
    expect(pesoLegible(820 * 1024)).toBe('820 KB');
    expect(pesoLegible(2.44 * 1024 * 1024)).toBe('2.4 MB');
    expect(megas(30 * 1024 * 1024)).toBe('30 MB');
  });

  it('identifica un archivo por nombre, tamaño y fecha para no duplicarlo', () => {
    expect(huellaArchivo({ name: 'a.mp3', size: 3, lastModified: 9 })).toBe('a.mp3|3|9');
  });

  it('el atributo accept incluye tipos y extensiones', () => {
    const logos = archivosPresentacion.find((r) => r.nombre === 'logos')!;
    expect(valorAccept(logos)).toContain('image/svg+xml');
    expect(valorAccept(logos)).toContain('.svg');
  });
  // leerComoBase64 usa FileReader (solo navegador): lo cubre tests/e2e/registro-envio.spec.ts,
  // que comprueba que cada archivo llega al backend byte a byte.
});

describe('tiempo', () => {
  it('formatea mm:ss y marca la duración desconocida', () => {
    expect(formatoTiempo(0)).toBe('0:00');
    expect(formatoTiempo(201.7)).toBe('3:21');
    expect(formatoTiempo(Number.NaN)).toBe('--:--');
  });
});
