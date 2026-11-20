/** Nombres con los que se guardan los archivos en Drive. */

/**
 * "<Banda> - <Tipo> <n>.<ext>", por ejemplo "Oblivion - Foto 1.jpg" o "Oblivion - Canción 2.mp3".
 * La extensión sale del formato (tipo MIME canónico); si no se conoce, se usa la del nombre
 * original. El resultado pasa por nombreSeguro_ (sin barras, rutas ni caracteres de control).
 */
function nombreArchivo_(banda, singular, numero, tipo, nombreOriginal) {
  const extension = EXTENSIONES[tipoCanonico_(tipo)] || extensionDe_(nombreOriginal);
  // La banda se recorta a 80 caracteres para que el tipo, el número y la extensión siempre quepan.
  const base = nombreSeguro_(banda).slice(0, 80).trim() + ' - ' + singular + ' ' + numero;
  return nombreSeguro_(extension ? base + '.' + extension : base);
}

/** Extensión en minúsculas de un nombre de archivo ("Logo.PNG" → "png"), o '' si no tiene. */
function extensionDe_(nombre) {
  const coincidencia = /\.([a-z0-9]{1,5})$/i.exec(String(nombre || ''));
  return coincidencia ? coincidencia[1].toLowerCase() : '';
}
