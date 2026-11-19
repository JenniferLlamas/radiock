/** Utilidades de texto sin estado. */

/** Nombre de archivo o carpeta sin rutas ni caracteres problemáticos. */
function nombreSeguro_(nombre) {
  const limpio = String(nombre == null ? '' : nombre)
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
    .replace(/^\.+/, '')
    .trim()
    .slice(0, 120);
  return limpio || 'sin-nombre';
}

/** Evita que un texto como "=IMPORTXML(...)" se ejecute como fórmula en la hoja. */
function textoSeguroParaHoja_(valor) {
  const texto = String(valor == null ? '' : valor);
  return /^[=+\-@\t\r]/.test(texto) ? "'" + texto : texto;
}

function megas_(bytes) {
  return Math.round(bytes / (1024 * 1024)) + ' MB';
}
