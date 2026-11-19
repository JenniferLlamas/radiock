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

const MENSAJES = {
  pausado: 'El registro está pausado por ahora. Escríbenos por nuestras redes y te respondemos.',
  limite: 'Recibimos muchos registros en este momento. Inténtalo de nuevo más tarde o escríbenos por nuestras redes.',
  error: 'No pudimos guardar el registro. Inténtalo de nuevo en unos minutos.',
};

/** Punto de entrada del Web App: recibe el JSON que envía el sitio (Content-Type text/plain). */
function doPost(e) {
  try {
    const solicitud = leerSolicitud_(e);
    // Campo trampa: los humanos no lo ven; si viene lleno es un bot. Se responde "ok" sin guardar.
    if (solicitud.sitioWeb) return responder_({ ok: true });

    const propiedades = PropertiesService.getScriptProperties();
    if (String(propiedades.getProperty(CONFIG.PROPIEDAD_PAUSA) || '').trim().toLowerCase() === 'si') {
      return responder_({ ok: false, error: MENSAJES.pausado });
    }

    const resultado = validarSolicitud_(solicitud, CONFIG);
    if (resultado.errores.length) return responder_({ ok: false, error: resultado.errores.join(' ') });

    const bytes = resultado.archivos.reduce(function (suma, archivo) { return suma + archivo.bytes.length; }, 0);
    const cupo = conBloqueo_(function () {
      return reservarCupo_(almacenDePropiedades_(propiedades), clavesDeTiempo_(new Date()), bytes, CONFIG.LIMITES);
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
    // El tipo lo declara el navegador (o quien llame a la URL): se comprueba el contenido real.
    const problema = revisarContenido_(bytes, regla.tipos);
    if (problema) {
      errores.push('El archivo "' + nombreSeguro_(archivo.nombre) + '" ' + problema);
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

/** Variantes de un mismo formato que usan los navegadores → nombre canónico. */
const TIPO_CANONICO = {
  'audio/mp3': 'audio/mpeg',
  'audio/x-m4a': 'audio/mp4',
  'audio/x-wav': 'audio/wav',
  'audio/wave': 'audio/wav',
};
const canonico_ = function (tipo) { return TIPO_CANONICO[tipo] || tipo; };

/**
 * Formatos reales según los primeros bytes del archivo ("firma" o "número mágico").
 * Devuelve los tipos canónicos posibles; vacío si no se reconoce. Los bytes de Apps Script
 * vienen con signo (-128…127), por eso se normalizan con & 0xFF.
 */
function detectarTipos_(bytes) {
  const b = function (i) { return i < bytes.length ? bytes[i] & 0xff : -1; };
  const ascii = function (desde, texto) {
    for (let i = 0; i < texto.length; i++) if (b(desde + i) !== texto.charCodeAt(i)) return false;
    return true;
  };

  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return ['image/jpeg'];
  if (ascii(0, '\u0089PNG\r\n\u001a\n')) return ['image/png'];
  if (ascii(0, 'RIFF') && ascii(8, 'WEBP')) return ['image/webp'];
  if (ascii(0, 'RIFF') && ascii(8, 'WAVE')) return ['audio/wav'];
  if (ascii(0, 'OggS')) return ['audio/ogg'];
  if (ascii(4, 'ftyp')) return ['audio/mp4'];
  // Etiqueta ID3 al inicio: la usan MP3 y algunos AAC.
  if (ascii(0, 'ID3')) return ['audio/mpeg', 'audio/aac'];
  if (ascii(0, 'ADIF')) return ['audio/aac'];
  if (b(0) === 0xff) {
    // Cabecera ADTS de AAC: capa 00. Trama MPEG de MP3: capa distinta de 00.
    if ((b(1) & 0xf6) === 0xf0) return ['audio/aac'];
    if ((b(1) & 0xe0) === 0xe0 && ((b(1) >> 1) & 3) !== 0) return ['audio/mpeg'];
  }
  if (pareceSvg_(textoDeBytes_(bytes, 2048))) return ['image/svg+xml'];
  return [];
}

/** Bytes → texto (latin1). Basta para buscar marcas y atributos, que son ASCII. */
function textoDeBytes_(bytes, limite) {
  const fin = Math.min(bytes.length, limite || bytes.length);
  let texto = '';
  for (let i = 0; i < fin; i += 8192) {
    const trozo = [];
    for (let j = i; j < Math.min(fin, i + 8192); j++) trozo.push(bytes[j] & 0xff);
    texto += String.fromCharCode.apply(null, trozo);
  }
  return texto.replace(/^ï»¿/, ''); // BOM de UTF-8
}

/** Un SVG empieza (tras la declaración XML, comentarios y doctype) con la etiqueta <svg. */
function pareceSvg_(texto) {
  const inicio = texto
    .replace(/^\s*<\?xml[\s\S]*?\?>/i, '')
    .replace(/^(\s*<!--[\s\S]*?-->)+/, '')
    .replace(/^\s*<!doctype[^>[]*(\[[\s\S]*?\])?\s*>/i, '')
    .replace(/^(\s*<!--[\s\S]*?-->)+/, '');
  return /^\s*<svg[\s>]/i.test(inicio);
}

/**
 * Un SVG es texto y puede llevar código que se ejecuta al abrirlo en el navegador.
 * Devuelve el motivo del rechazo, o '' si es un logo simple: formas, colores, degradados,
 * texto e imágenes incrustadas, sin scripts, eventos, contenido HTML ni enlaces externos.
 */
function problemaSvg_(svg) {
  const texto = svg.toLowerCase();
  if (/<!entity|<!doctype[^>]*\[/.test(texto)) return 'declara entidades XML';
  if (/<script[\s>/]/.test(texto)) return 'contiene scripts';
  // Atributos on… (onload, onclick…) dentro de una etiqueta; el texto visible no cuenta.
  const etiquetas = texto.match(/<[^>]*>/g) || [];
  if (etiquetas.some(function (etiqueta) { return /[\s/"']on[a-z]+\s*=/.test(etiqueta); })) return 'contiene eventos de JavaScript';
  if (/<(foreignobject|iframe|embed|object|audio|video|handler|listener)[\s>/]/.test(texto)) return 'contiene contenido incrustado';
  if (/javascript:|vbscript:|data:text\/html/.test(texto)) return 'contiene enlaces de código';
  // Una animación podría cambiar un enlace a código después de cargar.
  if (/attributename\s*=\s*["']\s*(xlink:)?href/.test(texto)) return 'anima enlaces';
  if (/@import/.test(texto)) return 'importa estilos externos';

  // Solo se permiten referencias internas (#id) e imágenes incrustadas en base64.
  const permitido = /^\s*(#|data:image\/(png|jpe?g|gif|webp);base64,)/;
  const enlaces = /(?:xlink:)?href\s*=\s*(["'])([\s\S]*?)\1/g;
  let enlace;
  while ((enlace = enlaces.exec(texto))) if (!permitido.test(enlace[2])) return 'tiene enlaces externos';
  const urls = /url\(\s*(["']?)([\s\S]*?)\1\s*\)/g;
  let url;
  while ((url = urls.exec(texto))) if (!permitido.test(url[2])) return 'carga recursos externos';
  return '';
}

/**
 * Comprueba que el contenido corresponde a uno de los tipos permitidos de su sección.
 * Devuelve el final del mensaje de error, o '' si el archivo es válido.
 */
function revisarContenido_(bytes, tiposPermitidos) {
  const permitidos = tiposPermitidos.map(canonico_);
  const detectados = detectarTipos_(bytes).filter(function (tipo) { return permitidos.indexOf(tipo) !== -1; });
  if (!detectados.length) return 'no es un archivo de un formato permitido o está dañado.';
  if (detectados[0] === 'image/svg+xml') {
    const motivo = problemaSvg_(textoDeBytes_(bytes));
    if (motivo) return 'no se aceptó: el SVG ' + motivo + '. Expórtalo como SVG simple o súbelo en PNG.';
  }
  return '';
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
  conBloqueo_(function () { hojaDeRegistros_().appendRow(fila); });
}

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

/** Claves de los contadores: la hora y el día actuales en la zona horaria de Radiock. */
function clavesDeTiempo_(ahora) {
  return {
    hora: 'limite:hora:' + Utilities.formatDate(ahora, CONFIG.ZONA_HORARIA, "yyyy-MM-dd'T'HH"),
    dia: 'limite:dia:' + Utilities.formatDate(ahora, CONFIG.ZONA_HORARIA, 'yyyy-MM-dd'),
  };
}

/** Adapta las propiedades del script a un almacén simple de texto. */
function almacenDePropiedades_(propiedades) {
  return {
    leer: function (clave) { return propiedades.getProperty(clave); },
    escribir: function (clave, valor) { propiedades.setProperty(clave, valor); },
    claves: function () { return propiedades.getKeys(); },
    borrar: function (clave) { propiedades.deleteProperty(clave); },
  };
}

/**
 * Comprueba los límites y, si hay cupo, cuenta este envío. Función pura sobre `almacen`
 * (se prueba sin servicios de Google). Borra los contadores de horas y días anteriores.
 * Devuelve { ok: true } o { ok: false, motivo }.
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
