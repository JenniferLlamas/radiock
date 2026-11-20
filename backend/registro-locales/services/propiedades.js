/**
 * Adaptador de las Propiedades del script: interruptor de pausa y almacén de los contadores
 * de cupo (claves `limite:…`).
 */

/** true si la propiedad REGISTRO_PAUSADO vale "si" (sin importar mayúsculas ni espacios). */
function registroPausado_(propiedades) {
  return String(propiedades.getProperty(CONFIG.PROPIEDAD_PAUSA) || '').trim().toLowerCase() === 'si';
}

/** Claves de los contadores: la hora y el día actuales en la zona horaria de Radiock. */
function clavesDeTiempo_(ahora) {
  return {
    hora: 'limite:hora:' + Utilities.formatDate(ahora, CONFIG.ZONA_HORARIA, "yyyy-MM-dd'T'HH"),
    dia: 'limite:dia:' + Utilities.formatDate(ahora, CONFIG.ZONA_HORARIA, 'yyyy-MM-dd'),
  };
}

/** Adapta las propiedades del script al almacén de texto que usa reservarCupo_. */
function almacenDePropiedades_(propiedades) {
  return {
    leer: function (clave) { return propiedades.getProperty(clave); },
    escribir: function (clave, valor) { propiedades.setProperty(clave, valor); },
    claves: function () { return propiedades.getKeys(); },
    borrar: function (clave) { propiedades.deleteProperty(clave); },
  };
}
