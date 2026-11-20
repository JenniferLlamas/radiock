/**
 * Backend del registro de locales de Radiock — Google Apps Script publicado como Web App.
 * Es un proyecto aparte del de bandas (backend/registro-bandas), con su propia hoja y su
 * propia URL, para que los registros de locales y de bandas no se mezclen.
 * Este archivo: ID de la hoja, zona horaria, límites contra spam y pausa.
 * Estructura y capas: README.md de esta carpeta.
 */
const CONFIG = {
  /** ID de la hoja de cálculo de locales (de su URL: /spreadsheets/d/<ID>/edit). */
  HOJA_ID: 'PEGAR_AQUI_EL_ID_DE_LA_HOJA',
  /** Pestaña de la hoja; se crea con encabezados si no existe. */
  PESTANA: 'Locales',
  ZONA_HORARIA: 'America/Tijuana',

  /**
   * Límites globales contra spam (Apps Script no conoce la IP de quien envía, así que cuentan
   * todos los envíos juntos). Solo cuentan los registros válidos que se van a guardar.
   */
  LIMITES: {
    ENVIOS_POR_HORA: 10,
    ENVIOS_POR_DIA: 40,
  },
  /**
   * Interruptor de emergencia: en ⚙️ Configuración del proyecto → Propiedades del script, crea
   * la propiedad REGISTRO_PAUSADO con el valor "si" para rechazar todos los envíos sin volver
   * a implementar. Bórrala para reanudar.
   */
  PROPIEDAD_PAUSA: 'REGISTRO_PAUSADO',
};
