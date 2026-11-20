/**
 * Adaptador de Drive y Hojas de cálculo: guarda un registro ya validado en una carpeta con
 * subcarpetas por tipo de material y añade una fila con los datos y los enlaces.
 */

/** Crea la carpeta del registro, sube los archivos y añade la fila a la hoja. */
function guardarRegistro_(registro) {
  const ahora = new Date();
  const marca = Utilities.formatDate(ahora, CONFIG.ZONA_HORARIA, 'yyyy-MM-dd HH.mm');
  const carpeta = DriveApp.getFolderById(CONFIG.CARPETA_ID)
    .createFolder(marca + ' — ' + nombreSeguro_(registro.campos.banda));

  const tipos = Object.keys(ARCHIVOS);
  const enlaces = {};
  const subcarpetas = {};
  tipos.forEach(function (tipo) { enlaces[tipo] = []; });
  registro.archivos.forEach(function (archivo) {
    // La subcarpeta solo se crea si la banda envió archivos de ese tipo.
    const destino = subcarpetas[archivo.campo]
      || (subcarpetas[archivo.campo] = carpeta.createFolder(ARCHIVOS[archivo.campo].etiqueta));
    // "Oblivion - Foto 1.jpg": banda + tipo + número dentro de su sección, en lugar del nombre original.
    const numero = enlaces[archivo.campo].length + 1;
    const nombre = nombreArchivo_(registro.campos.banda, ARCHIVOS[archivo.campo].singular, numero, archivo.tipo, archivo.nombre);
    const blob = Utilities.newBlob(archivo.bytes, archivo.tipo, nombre);
    enlaces[archivo.campo].push(destino.createFile(blob).getUrl());
  });

  const fila = [ahora]
    .concat(CAMPOS.map(function (campo) { return textoSeguroParaHoja_(registro.campos[campo.nombre]); }))
    .concat(tipos.map(function (tipo) { return enlaces[tipo].join('\n'); }))
    .concat([carpeta.getUrl()]);

  // El bloqueo evita que dos envíos simultáneos escriban los encabezados a la vez.
  conBloqueo_(function () { hojaDeRegistros_().appendRow(fila); });
}

/** Pestaña de registros; la crea con encabezados la primera vez. */
function hojaDeRegistros_() {
  const libro = SpreadsheetApp.openById(CONFIG.HOJA_ID);
  const hoja = libro.getSheetByName(CONFIG.PESTANA) || libro.insertSheet(CONFIG.PESTANA);
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(['Fecha']
      .concat(CAMPOS.map(function (campo) { return campo.etiqueta; }))
      .concat(Object.keys(ARCHIVOS).map(function (tipo) { return ARCHIVOS[tipo].etiqueta; }))
      .concat(['Carpeta']));
    hoja.setFrozenRows(1);
  }
  return hoja;
}
