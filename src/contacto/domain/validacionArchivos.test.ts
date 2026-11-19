import { describe, expect, it } from 'vitest';
import { MB } from '../constants/archivos';
import { archivosPresentacion } from '../data/archivosPresentacion';
import { validarArchivo, validarArchivos } from './validacionArchivos';

const regla = (nombre: string) => archivosPresentacion.find((r) => r.nombre === nombre)!;
const archivo = (campo: string, nombre: string, tipo: string, tamano = 1000) => ({ campo, nombre, tipo, tamano });

describe('validarArchivo', () => {
  it('acepta SVG solo como logo', () => {
    expect(validarArchivo(archivo('logos', 'logo.svg', 'image/svg+xml'), regla('logos'))).toBeNull();
    expect(validarArchivo(archivo('fotos', 'logo.svg', 'image/svg+xml'), regla('fotos'))).toMatch(/formato permitido/);
  });

  it('rechaza archivos vacíos y demasiado pesados', () => {
    expect(validarArchivo(archivo('fotos', 'a.jpg', 'image/jpeg', 0), regla('fotos'))).toMatch(/vacío/);
    expect(validarArchivo(archivo('fotos', 'a.jpg', 'image/jpeg', 5 * MB), regla('fotos'))).toBe('"a.jpg" pesa más de 4 MB.');
    expect(validarArchivo(archivo('canciones', 'c.wav', 'audio/wav', 15 * MB), regla('canciones'))).toBeNull();
  });
});

describe('validarArchivos', () => {
  it('acepta el máximo de cada sección: 3 fotos, 2 logos y 3 canciones', () => {
    const material = [
      ...[1, 2, 3].map((i) => archivo('fotos', `f${i}.jpg`, 'image/jpeg')),
      ...[1, 2].map((i) => archivo('logos', `l${i}.png`, 'image/png')),
      ...[1, 2, 3].map((i) => archivo('canciones', `c${i}.mp3`, 'audio/mpeg')),
    ];
    expect(validarArchivos(material)).toEqual([]);
  });

  it('avisa cuando una sección se pasa del máximo', () => {
    const errores = validarArchivos([1, 2, 3].map((i) => archivo('logos', `l${i}.png`, 'image/png')));
    expect(errores).toEqual(['Logos: puedes adjuntar como máximo 2.']);
  });

  it('avisa cuando el total pasa de 30 MB aunque cada archivo sea válido', () => {
    const errores = validarArchivos([1, 2, 3].map((i) => archivo('canciones', `c${i}.mp3`, 'audio/mpeg', 12 * MB)));
    expect(errores).toEqual(['Entre todos, los archivos pesan más de 30 MB.']);
  });
});
