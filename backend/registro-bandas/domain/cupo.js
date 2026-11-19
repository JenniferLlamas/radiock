/**
 * Cupo de envíos contra spam: límites globales por hora y por día. Regla pura sobre un
 * `almacen` de texto (services/propiedades.js lo implementa con las Propiedades del script).
 */

/**
 * Comprueba los límites y, si hay cupo, cuenta este envío. Borra los contadores de horas y días
 * anteriores. Debe llamarse dentro de conBloqueo_ para que dos envíos simultáneos no cuenten mal.
 * `claves` = { hora, dia } (ver clavesDeTiempo_). Devuelve { ok: true } o { ok: false, motivo }.
 */
function reservarCupo_(almacen, claves, bytes, limites) {
  almacen.claves().forEach(function (clave) {
    if (clave.indexOf('limite:') === 0 && clave !== claves.hora && clave !== claves.dia) almacen.borrar(clave);
  });

  const hora = Number(almacen.leer(claves.hora) || 0);
  const dia = JSON.parse(almacen.leer(claves.dia) || '{"envios":0,"bytes":0}');

  if (hora >= limites.ENVIOS_POR_HORA) return { ok: false, motivo: 'envíos por hora' };
  if (dia.envios >= limites.ENVIOS_POR_DIA) return { ok: false, motivo: 'envíos por día' };
  if (dia.bytes + bytes > limites.MEGAS_POR_DIA * 1024 * 1024) return { ok: false, motivo: 'megas por día' };

  almacen.escribir(claves.hora, String(hora + 1));
  almacen.escribir(claves.dia, JSON.stringify({ envios: dia.envios + 1, bytes: dia.bytes + bytes }));
  return { ok: true };
}
