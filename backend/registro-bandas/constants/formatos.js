/** Variantes de un mismo formato que usan los navegadores → nombre canónico. */
const TIPO_CANONICO = {
  'audio/mp3': 'audio/mpeg',
  'audio/x-m4a': 'audio/mp4',
  'audio/x-wav': 'audio/wav',
  'audio/wave': 'audio/wav',
};

/** En un SVG solo se permiten referencias internas (#id) e imágenes incrustadas en base64. */
const SVG_REFERENCIA_PERMITIDA = /^\s*(#|data:image\/(png|jpe?g|gif|webp);base64,)/;
