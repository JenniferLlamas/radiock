/**
 * Puntos de entrada del Web App. Orquesta el registro: campo trampa → pausa → validación →
 * cupo → guardado. Es la única capa que conecta las reglas (domain) con Google (services).
 */

/** Recibe el JSON que envía el sitio (Content-Type text/plain, sin preflight CORS). */
function doPost(e) {
  try {
    const solicitud = leerSolicitud_(e);
    // Campo trampa: los humanos no lo ven; si viene lleno es un bot. Se responde "ok" sin guardar.
    if (solicitud.sitioWeb) return responder_({ ok: true });

    const propiedades = PropertiesService.getScriptProperties();
    if (registroPausado_(propiedades)) return responder_({ ok: false, error: MENSAJES.pausado });

    const resultado = validarSolicitud_(solicitud);
    if (resultado.errores.length) return responder_({ ok: false, error: resultado.errores.join(' ') });

    const cupo = conBloqueo_(function () {
      return reservarCupo_(almacenDePropiedades_(propiedades), clavesDeTiempo_(new Date()), CONFIG.LIMITES);
    });
    if (!cupo.ok) {
      console.warn('Límite alcanzado (' + cupo.motivo + '). Revisa Ejecuciones por si es spam.');
      return responder_({ ok: false, error: MENSAJES.limite });
    }

    guardarRegistro_(resultado);
    return responder_({ ok: true });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return responder_({ ok: false, error: MENSAJES.error });
  }
}

/** Permite comprobar desde el navegador que el despliegue responde. */
function doGet() {
  return responder_({ ok: true, servicio: 'registro-locales' });
}

function leerSolicitud_(e) {
  if (!e || !e.postData || !e.postData.contents) throw new Error('Solicitud vacía');
  return JSON.parse(e.postData.contents);
}

function responder_(cuerpo) {
  return ContentService.createTextOutput(JSON.stringify(cuerpo)).setMimeType(ContentService.MimeType.JSON);
}
