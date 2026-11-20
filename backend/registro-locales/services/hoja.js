/** Adaptador de Hojas de cálculo: añade una fila por local con la fecha y sus datos. */

/** Añade el registro ya validado a la hoja. */
function guardarRegistro_(registro) {
  const fila = [new Date()]
    .concat(CAMPOS.map(function (campo) { return textoSeguroParaHoja_(registro.campos[campo.nombre]); }));
  // El bloqueo evita que dos envíos simultáneos escriban los encabezados a la vez.
  conBloqueo_(function () { hojaDeLocales_().appendRow(fila); });
}

/** Pestaña de locales; la crea con encabezados la primera vez. */
function hojaDeLocales_() {
  const libro = SpreadsheetApp.openById(CONFIG.HOJA_ID);
  const hoja = libro.getSheetByName(CONFIG.PESTANA) || libro.insertSheet(CONFIG.PESTANA);
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(['Fecha'].concat(CAMPOS.map(function (campo) { return campo.etiqueta; })));
    hoja.setFrozenRows(1);
  }
  return hoja;
}
