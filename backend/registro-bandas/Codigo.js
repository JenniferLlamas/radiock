/**
 * Backend del registro de bandas de Radiock — Google Apps Script publicado como Web App.
 *
 * Recibe el formulario del sitio, guarda las imágenes y el audio en una carpeta de tu
 * Drive (una subcarpeta por registro) y añade una fila a una hoja de cálculo con los
 * datos y los enlaces. Se ejecuta con tu cuenta, así que todo queda en tu Drive.
 *
 * Instalación y publicación: ver README.md en esta carpeta.
 *
 * Los límites deben coincidir con los del sitio:
 * src/contacto/data/camposPresentacion.ts, src/contacto/data/archivosPresentacion.ts y
 * src/contacto/constants/archivos.ts (MAX_BYTES_TOTAL).
 */

const CONFIG = {
  /** ID de la carpeta de Drive donde se guardan los registros (de su URL: /folders/<ID>). */
  CARPETA_ID: 'PEGAR_AQUI_EL_ID_DE_LA_CARPETA',
  /** ID de la hoja de cálculo (de su URL: /spreadsheets/d/<ID>/edit). */
  HOJA_ID: 'PEGAR_AQUI_EL_ID_DE_LA_HOJA',
  /** Pestaña de la hoja; se crea con encabezados si no existe. */
  PESTANA: 'Registros',
  ZONA_HORARIA: 'America/Tijuana',

  CAMPOS: [
    { nombre: 'banda', etiqueta: 'Banda', obligatorio: true, maximo: 120 },
    { nombre: 'ciudad', etiqueta: 'Ciudad', obligatorio: true, maximo: 120 },
    { nombre: 'genero', etiqueta: 'Género', obligatorio: true, maximo: 120 },
    { nombre: 'instagram', etiqueta: 'Instagram', obligatorio: false, maximo: 300 },
    { nombre: 'youtube', etiqueta: 'YouTube', obligatorio: false, maximo: 300 },
    { nombre: 'contacto', etiqueta: 'Contacto', obligatorio: true, maximo: 200 },
  ],
  /** Cada tipo tiene su subcarpeta (con el nombre de `etiqueta`) y su columna en la hoja. */
  ARCHIVOS: {
    fotos: {
      etiqueta: 'Fotos',
      maximo: 3,
      maxBytes: 4 * 1024 * 1024,
      tipos: ['image/jpeg', 'image/png', 'image/webp'],
    },
    logos: {
      etiqueta: 'Logos',
      maximo: 2,
      maxBytes: 4 * 1024 * 1024,
      tipos: ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp'],
    },
    canciones: {
      etiqueta: 'Canciones',
      maximo: 3,
      maxBytes: 15 * 1024 * 1024,
      tipos: ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/ogg'],
    },
  },
  /** Tope del total de archivos, para no superar el límite de ~50 MB por petición de Apps Script. */
  MAX_BYTES_TOTAL: 30 * 1024 * 1024,
};

/** Punto de entrada del Web App: recibe el JSON que envía el sitio (Content-Type text/plain). */
function doPost(e) {
  try {
    const solicitud = leerSolicitud_(e);
    // Campo trampa: los humanos no lo ven; si viene lleno es un bot. Se responde "ok" sin guardar.
    if (solicitud.sitioWeb) return responder_({ ok: true });

    const resultado = validarSolicitud_(solicitud, CONFIG);
    if (resultado.errores.length) return responder_({ ok: false, error: resultado.errores.join(' ') });

    guardarRegistro_(resultado);
    return responder_({ ok: true });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return responder_({ ok: false, error: 'No pudimos guardar el registro. Inténtalo de nuevo en unos minutos.' });
  }
}

/** Permite comprobar desde el navegador que el despliegue responde. */
function doGet() {
  return responder_({ ok: true, servicio: 'registro-bandas' });
}

function leerSolicitud_(e) {
  if (!e || !e.postData || !e.postData.contents) throw new Error('Solicitud vacía');
  return JSON.parse(e.postData.contents);
}

/**
 * Valida y normaliza la solicitud. Función pura (sin servicios de Google) para poder probarla.
 * Devuelve { errores, campos, archivos } con los archivos ya decodificados a bytes.
 */
function validarSolicitud_(solicitud, config, decodificar) {
  const decodificarBase64 = decodificar || function (texto) { return Utilities.base64Decode(texto); };
  const errores = [];
  const camposEntrada = solicitud && typeof solicitud.campos === 'object' && solicitud.campos ? solicitud.campos : {};
  const campos = {};

  config.CAMPOS.forEach(function (campo) {
    const valor = String(camposEntrada[campo.nombre] == null ? '' : camposEntrada[campo.nombre]).trim();
    if (campo.obligatorio && !valor) errores.push('Falta el campo ' + campo.etiqueta + '.');
    if (valor.length > campo.maximo) errores.push(campo.etiqueta + ' es demasiado largo.');
    campos[campo.nombre] = valor;
  });

  const archivosEntrada = Array.isArray(solicitud && solicitud.archivos) ? solicitud.archivos : [];
  const archivos = [];
  const porCampo = {};
  let total = 0;

  archivosEntrada.forEach(function (archivo) {
    const regla = archivo && config.ARCHIVOS[archivo.campo];
    if (!regla) { errores.push('Se recibió un archivo no esperado.'); return; }
    porCampo[archivo.campo] = (porCampo[archivo.campo] || 0) + 1;
    if (regla.tipos.indexOf(String(archivo.tipo)) === -1) {
      errores.push('El archivo "' + nombreSeguro_(archivo.nombre) + '" no tiene un formato permitido.');
      return;
    }
    const bytes = decodificarBase64(String(archivo.contenido || ''));
    if (!bytes.length) { errores.push('El archivo "' + nombreSeguro_(archivo.nombre) + '" está vacío.'); return; }
    if (bytes.length > regla.maxBytes) {
      errores.push('El archivo "' + nombreSeguro_(archivo.nombre) + '" supera ' + megas_(regla.maxBytes) + '.');
      return;
    }
    total += bytes.length;
    archivos.push({ campo: archivo.campo, nombre: nombreSeguro_(archivo.nombre), tipo: archivo.tipo, bytes: bytes });
  });

  Object.keys(porCampo).forEach(function (campo) {
    if (porCampo[campo] > config.ARCHIVOS[campo].maximo) {
      errores.push('Se permiten como máximo ' + config.ARCHIVOS[campo].maximo + ' archivo(s) en ' + config.ARCHIVOS[campo].etiqueta + '.');
    }
  });
  if (total > config.MAX_BYTES_TOTAL) errores.push('Los archivos suman más de ' + megas_(config.MAX_BYTES_TOTAL) + '.');

  return { errores: errores, campos: campos, archivos: archivos };
}

/**
 * Crea la carpeta del registro con una subcarpeta por tipo (Fotos, Logos, Canciones),
 * sube los archivos y añade la fila a la hoja.
 */
function guardarRegistro_(registro) {
  const ahora = new Date();
  const marca = Utilities.formatDate(ahora, CONFIG.ZONA_HORARIA, 'yyyy-MM-dd HH.mm');
  const carpeta = DriveApp.getFolderById(CONFIG.CARPETA_ID)
    .createFolder(marca + ' — ' + nombreSeguro_(registro.campos.banda));

  const tipos = Object.keys(CONFIG.ARCHIVOS);
  const enlaces = {};
  const subcarpetas = {};
  tipos.forEach(function (tipo) { enlaces[tipo] = []; });
  registro.archivos.forEach(function (archivo) {
    // La subcarpeta solo se crea si la banda envió archivos de ese tipo.
    const destino = subcarpetas[archivo.campo]
      || (subcarpetas[archivo.campo] = carpeta.createFolder(CONFIG.ARCHIVOS[archivo.campo].etiqueta));
    const blob = Utilities.newBlob(archivo.bytes, archivo.tipo, archivo.nombre);
    enlaces[archivo.campo].push(destino.createFile(blob).getUrl());
  });

  const fila = [ahora]
    .concat(CONFIG.CAMPOS.map(function (campo) { return textoSeguroParaHoja_(registro.campos[campo.nombre]); }))
    .concat(tipos.map(function (tipo) { return enlaces[tipo].join('\n'); }))
    .concat([carpeta.getUrl()]);

  // El bloqueo evita que dos envíos simultáneos escriban los encabezados a la vez.
  const bloqueo = LockService.getScriptLock();
  bloqueo.waitLock(20000);
  try {
    hojaDeRegistros_().appendRow(fila);
  } finally {
    bloqueo.releaseLock();
  }
}

function hojaDeRegistros_() {
  const libro = SpreadsheetApp.openById(CONFIG.HOJA_ID);
  const hoja = libro.getSheetByName(CONFIG.PESTANA) || libro.insertSheet(CONFIG.PESTANA);
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(['Fecha']
      .concat(CONFIG.CAMPOS.map(function (campo) { return campo.etiqueta; }))
      .concat(Object.keys(CONFIG.ARCHIVOS).map(function (tipo) { return CONFIG.ARCHIVOS[tipo].etiqueta; }))
      .concat(['Carpeta']));
    hoja.setFrozenRows(1);
  }
  return hoja;
}

/** Evita que un texto como "=IMPORTXML(...)" se ejecute como fórmula en la hoja. */
function textoSeguroParaHoja_(valor) {
  const texto = String(valor == null ? '' : valor);
  return /^[=+\-@\t\r]/.test(texto) ? "'" + texto : texto;
}

/** Nombre de archivo o carpeta sin rutas ni caracteres problemáticos. */
function nombreSeguro_(nombre) {
  const limpio = String(nombre == null ? '' : nombre)
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
    .replace(/^\.+/, '')
    .trim()
    .slice(0, 120);
  return limpio || 'sin-nombre';
}

function megas_(bytes) {
  return Math.round(bytes / (1024 * 1024)) + ' MB';
}

function responder_(cuerpo) {
  return ContentService.createTextOutput(JSON.stringify(cuerpo)).setMimeType(ContentService.MimeType.JSON);
}
