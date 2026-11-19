/** Utilidades sobre bytes y tipos de archivo. */

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

/** Nombre canónico de un tipo MIME (audio/mp3 → audio/mpeg…). */
function tipoCanonico_(tipo) {
  return TIPO_CANONICO[tipo] || tipo;
}
