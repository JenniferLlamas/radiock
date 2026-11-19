/**
 * Backend del registro de bandas de Radiock — Google Apps Script publicado como Web App.
 * Este archivo: IDs de Drive, zona horaria, tope por envío, límites contra spam y pausa.
 * Estructura y capas: README.md de esta carpeta.
 *
 * MAX_BYTES_TOTAL debe coincidir con src/contacto/constants/archivos.ts del sitio.
 */
const CONFIG = {
  /** ID de la carpeta de Drive donde se guardan los registros (de su URL: /folders/<ID>). */
  CARPETA_ID: 'PEGAR_AQUI_EL_ID_DE_LA_CARPETA',
  /** ID de la hoja de cálculo (de su URL: /spreadsheets/d/<ID>/edit). */
  HOJA_ID: 'PEGAR_AQUI_EL_ID_DE_LA_HOJA',
  /** Pestaña de la hoja; se crea con encabezados si no existe. */
  PESTANA: 'Registros',
  ZONA_HORARIA: 'America/Tijuana',

  /** Tope del total de archivos, para no superar el límite de ~50 MB por petición de Apps Script. */
  MAX_BYTES_TOTAL: 30 * 1024 * 1024,

  /**
   * Límites globales contra spam (Apps Script no conoce la IP de quien envía, así que cuentan
   * todos los envíos juntos). Protegen el espacio de tu Drive y las cuotas diarias del script.
   * Solo cuentan los registros válidos que se van a guardar.
   */
  LIMITES: {
    ENVIOS_POR_HORA: 15,
    ENVIOS_POR_DIA: 60,
    MEGAS_POR_DIA: 500,
  },
  /**
   * Interruptor de emergencia: en ⚙️ Configuración del proyecto → Propiedades del script, crea
   * la propiedad REGISTRO_PAUSADO con el valor "si" para rechazar todos los envíos sin volver
   * a implementar. Bórrala para reanudar.
   */
  PROPIEDAD_PAUSA: 'REGISTRO_PAUSADO',
};
