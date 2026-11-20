/** Utilidades de texto sin estado. */

/** Evita que un texto como "=IMPORTXML(...)" se ejecute como fórmula en la hoja. */
function textoSeguroParaHoja_(valor) {
  const texto = String(valor == null ? '' : valor);
  return /^[=+\-@\t\r]/.test(texto) ? "'" + texto : texto;
}
