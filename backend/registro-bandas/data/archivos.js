/**
 * Material que puede adjuntar la banda. Cada tipo tiene su subcarpeta (con el nombre de
 * `etiqueta`) y su columna en la hoja. `singular` nombra cada archivo en Drive:
 * "Oblivion - Foto 1.jpg" (ver helpers/nombresArchivo.js).
 * Debe coincidir con src/contacto/data/archivosPresentacion.ts del sitio.
 */
const ARCHIVOS = {
  fotos: {
    etiqueta: 'Fotos',
    singular: 'Foto',
    maximo: 3,
    maxBytes: 4 * 1024 * 1024,
    tipos: ['image/jpeg', 'image/png', 'image/webp'],
  },
  logos: {
    etiqueta: 'Logos',
    singular: 'Logo',
    maximo: 2,
    maxBytes: 4 * 1024 * 1024,
    tipos: ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp'],
  },
  canciones: {
    etiqueta: 'Canciones',
    singular: 'Canción',
    maximo: 3,
    maxBytes: 15 * 1024 * 1024,
    tipos: ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/ogg'],
  },
};
