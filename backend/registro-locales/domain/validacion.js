/**
 * Reglas del registro de locales: solo datos de texto (obligatorios y longitud máxima).
 * Sin servicios de Google.
 */

/**
 * Valida y normaliza la solicitud con los `campos` dados (por defecto, CAMPOS; se leen al
 * llamar, no al cargar, para no depender del orden de los archivos).
 * Devuelve { errores, campos }. Este registro no recibe archivos: si llegan, se rechaza.
 */
function validarSolicitud_(solicitud, campos) {
  const reglas = campos || CAMPOS;
  const errores = [];
  const entrada = solicitud && typeof solicitud.campos === 'object' && solicitud.campos ? solicitud.campos : {};
  const valores = {};
  reglas.forEach(function (campo) {
    const valor = String(entrada[campo.nombre] == null ? '' : entrada[campo.nombre]).trim();
    if (campo.obligatorio && !valor) errores.push('Falta el campo ' + campo.etiqueta + '.');
    if (valor.length > campo.maximo) errores.push(campo.etiqueta + ' es demasiado largo.');
    valores[campo.nombre] = valor;
  });
  if (Array.isArray(solicitud && solicitud.archivos) && solicitud.archivos.length) {
    errores.push('Este registro no recibe archivos.');
  }
  return { errores: errores, campos: valores };
}
