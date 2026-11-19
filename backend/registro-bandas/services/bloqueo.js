/** Adaptador de LockService. */

/** Ejecuta `accion` sin que otro envío simultáneo entre a la vez (contadores, encabezados). */
function conBloqueo_(accion) {
  const bloqueo = LockService.getScriptLock();
  bloqueo.waitLock(20000);
  try {
    return accion();
  } finally {
    bloqueo.releaseLock();
  }
}
