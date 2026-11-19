import { readFileSync } from 'node:fs';

/** Archivo en memoria para `setInputFiles`. */
export interface ArchivoPrueba {
  name: string;
  mimeType: string;
  buffer: Buffer;
}

const desdePublic = (ruta: string, name: string, mimeType: string): ArchivoPrueba =>
  ({ name, mimeType, buffer: readFileSync(`public/${ruta}`) });

/**
 * Rutas de fotos reales en disco. Úsalas para probar duplicados: el sitio reconoce un archivo
 * por nombre, tamaño y fecha de modificación, y los archivos en memoria de Playwright reciben
 * una fecha nueva en cada llamada (no parecen el mismo); los del disco conservan la suya.
 */
export const rutasFotos = {
  bailarina: 'public/comunidad/bailarina-en-vivo.webp',
  jumping: 'public/comunidad/jumping-beans-en-vivo.webp',
  stridulus: 'public/comunidad/stridulus-ensayo.webp',
  bluesfire: 'public/comunidad/bluesfire-en-vivo.webp',
};

/** Fotos y logos reales del proyecto, para que las vistas previas carguen imágenes de verdad. */
export const fotos = {
  bailarina: desdePublic('comunidad/bailarina-en-vivo.webp', 'bailarina.webp', 'image/webp'),
  jumping: desdePublic('comunidad/jumping-beans-en-vivo.webp', 'jumping.webp', 'image/webp'),
  stridulus: desdePublic('comunidad/stridulus-ensayo.webp', 'stridulus.webp', 'image/webp'),
  bluesfire: desdePublic('comunidad/bluesfire-en-vivo.webp', 'bluesfire.webp', 'image/webp'),
};

export const logos = {
  oblivion: desdePublic('bandas/oblivion/logo.png', 'logo-oblivion.png', 'image/png'),
  stridulus: desdePublic('bandas/stridulus/logo.png', 'logo-stridulus.png', 'image/png'),
  svg: {
    name: 'logo.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="red"/></svg>'),
  } satisfies ArchivoPrueba,
};

/** WAV válido (tono de 440 Hz), para que el reproductor conozca la duración y pueda sonar. */
export function wav(name: string, segundos = 3, frecuencia = 440): ArchivoPrueba {
  const muestreo = 22050;
  const muestras = muestreo * segundos;
  const datos = Buffer.alloc(44 + muestras * 2);
  datos.write('RIFF', 0); datos.writeUInt32LE(36 + muestras * 2, 4); datos.write('WAVE', 8);
  datos.write('fmt ', 12); datos.writeUInt32LE(16, 16); datos.writeUInt16LE(1, 20); datos.writeUInt16LE(1, 22);
  datos.writeUInt32LE(muestreo, 24); datos.writeUInt32LE(muestreo * 2, 28); datos.writeUInt16LE(2, 32); datos.writeUInt16LE(16, 34);
  datos.write('data', 36); datos.writeUInt32LE(muestras * 2, 40);
  for (let i = 0; i < muestras; i++) datos.writeInt16LE(Math.round(Math.sin((2 * Math.PI * frecuencia * i) / muestreo) * 6000), 44 + i * 2);
  return { name, mimeType: 'audio/wav', buffer: datos };
}

/** Archivo de un tamaño dado (contenido de relleno); sirve para probar límites de peso y formato. */
export const relleno = (name: string, mimeType: string, megas: number): ArchivoPrueba =>
  ({ name, mimeType, buffer: Buffer.alloc(Math.round(megas * 1024 * 1024), 1) });
