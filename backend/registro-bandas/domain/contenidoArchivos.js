/**
 * Contenido real de los archivos: el tipo que declara el navegador se puede falsificar, así que
 * se leen los primeros bytes ("firma" o "número mágico") y, en los SVG, se busca código o
 * enlaces externos.
 */

/**
 * Comprueba que el contenido corresponde a uno de los tipos permitidos de su sección.
 * Devuelve el final del mensaje de error, o '' si el archivo es válido.
 */
function revisarContenido_(bytes, tiposPermitidos) {
  const permitidos = tiposPermitidos.map(tipoCanonico_);
  const detectados = detectarTipos_(bytes).filter(function (tipo) { return permitidos.indexOf(tipo) !== -1; });
  if (!detectados.length) return 'no es un archivo de un formato permitido o está dañado.';
  if (detectados[0] === 'image/svg+xml') {
    const motivo = problemaSvg_(textoDeBytes_(bytes));
    if (motivo) return 'no se aceptó: el SVG ' + motivo + '. Expórtalo como SVG simple o súbelo en PNG.';
  }
  return '';
}

/**
 * Formatos reales según los primeros bytes del archivo.
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

  const enlaces = /(?:xlink:)?href\s*=\s*(["'])([\s\S]*?)\1/g;
  let enlace;
  while ((enlace = enlaces.exec(texto))) if (!SVG_REFERENCIA_PERMITIDA.test(enlace[2])) return 'tiene enlaces externos';
  const urls = /url\(\s*(["']?)([\s\S]*?)\1\s*\)/g;
  let url;
  while ((url = urls.exec(texto))) if (!SVG_REFERENCIA_PERMITIDA.test(url[2])) return 'carga recursos externos';
  return '';
}
