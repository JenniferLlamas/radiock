export const KB = 1024;
export const MB = 1024 * KB;

/**
 * Límite total por envío (fotos + logos + canciones): Apps Script admite unos 50 MB
 * por petición y el base64 añade un 33 %. Debe coincidir con CONFIG.MAX_BYTES_TOTAL
 * de backend/registro-bandas/constants/configuracion.js.
 */
export const MAX_BYTES_TOTAL = 30 * MB;

/** A partir de esta fracción del total, el medidor se pone en amarillo. */
export const UMBRAL_MEDIDOR_ALTO = 0.8;

/** Por encima de este peso total se avisa que el envío puede tardar. */
export const BYTES_AVISO_ENVIO_LENTO = 1 * MB;
