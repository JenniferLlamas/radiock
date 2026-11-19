/**
 * Reglas del registro: campos, formatos declarados, tamaños, cantidades y contenido real de
 * cada archivo (contenidoArchivos.js). Sin servicios de Google, salvo la decodificación base64,
 * que se puede inyectar en las pruebas.
 */

/** Reglas vigentes, armadas al llamar (no al cargar) para no depender del orden de los archivos. */
function reglasRegistro_() {
  return { CAMPOS: CAMPOS, ARCHIVOS: ARCHIVOS, MAX_BYTES_TOTAL: CONFIG.MAX_BYTES_TOTAL };
}

/**
 * Valida y normaliza la solicitud con las `reglas` ({ CAMPOS, ARCHIVOS, MAX_BYTES_TOTAL }).
 * Devuelve { errores, campos, archivos } con los archivos ya decodificados a bytes.
 */
function validarSolicitud_(solicitud, reglas, decodificar) {
  const decodificarBase64 = decodificar || function (texto) { return Utilities.base64Decode(texto); };
  const errores = [];
  const campos = validarCampos_(solicitud, reglas, errores);

  const archivosEntrada = Array.isArray(solicitud && solicitud.archivos) ? solicitud.archivos : [];
  const archivos = [];
  const porCampo = {};

  archivosEntrada.forEach(function (archivo) {
    const regla = archivo && reglas.ARCHIVOS[archivo.campo];
    if (!regla) { errores.push('Se recibió un archivo no esperado.'); return; }
    porCampo[archivo.campo] = (porCampo[archivo.campo] || 0) + 1;

    const nombre = nombreSeguro_(archivo.nombre);
    if (regla.tipos.indexOf(String(archivo.tipo)) === -1) {
      errores.push('El archivo "' + nombre + '" no tiene un formato permitido.');
      return;
    }
    const bytes = decodificarBase64(String(archivo.contenido || ''));
    if (!bytes.length) { errores.push('El archivo "' + nombre + '" está vacío.'); return; }
    if (bytes.length > regla.maxBytes) {
      errores.push('El archivo "' + nombre + '" supera ' + megas_(regla.maxBytes) + '.');
      return;
    }
    // El tipo lo declara el navegador (o quien llame a la URL): se comprueba el contenido real.
    const problema = revisarContenido_(bytes, regla.tipos);
    if (problema) {
      errores.push('El archivo "' + nombre + '" ' + problema);
      return;
    }
    archivos.push({ campo: archivo.campo, nombre: nombre, tipo: archivo.tipo, bytes: bytes });
  });

  Object.keys(porCampo).forEach(function (campo) {
    const regla = reglas.ARCHIVOS[campo];
    if (porCampo[campo] > regla.maximo) {
      errores.push('Se permiten como máximo ' + regla.maximo + ' archivo(s) en ' + regla.etiqueta + '.');
    }
  });
  if (bytesDe_(archivos) > reglas.MAX_BYTES_TOTAL) errores.push('Los archivos suman más de ' + megas_(reglas.MAX_BYTES_TOTAL) + '.');

  return { errores: errores, campos: campos, archivos: archivos };
}

/** Campos de texto: obligatorios y longitud máxima. Añade los problemas a `errores`. */
function validarCampos_(solicitud, reglas, errores) {
  const entrada = solicitud && typeof solicitud.campos === 'object' && solicitud.campos ? solicitud.campos : {};
  const campos = {};
  reglas.CAMPOS.forEach(function (campo) {
    const valor = String(entrada[campo.nombre] == null ? '' : entrada[campo.nombre]).trim();
    if (campo.obligatorio && !valor) errores.push('Falta el campo ' + campo.etiqueta + '.');
    if (valor.length > campo.maximo) errores.push(campo.etiqueta + ' es demasiado largo.');
    campos[campo.nombre] = valor;
  });
  return campos;
}

/** Peso total de una lista de archivos ya decodificados. */
function bytesDe_(archivos) {
  return archivos.reduce(function (suma, archivo) { return suma + archivo.bytes.length; }, 0);
}
