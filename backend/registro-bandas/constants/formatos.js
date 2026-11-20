/** Variantes de un mismo formato que usan los navegadores → nombre canónico. */
const TIPO_CANONICO = {
  'audio/mp3': 'audio/mpeg',
  'audio/x-m4a': 'audio/mp4',
  'audio/x-wav': 'audio/wav',
  'audio/wave': 'audio/wav',
};

/** Extensión con la que se guarda cada formato en Drive (por tipo canónico). */
const EXTENSIONES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/aac': 'aac',
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
};

/** En un SVG solo se permiten referencias internas (#id) e imágenes incrustadas en base64. */
const SVG_REFERENCIA_PERMITIDA = /^\s*(#|data:image\/(png|jpe?g|gif|webp);base64,)/;
