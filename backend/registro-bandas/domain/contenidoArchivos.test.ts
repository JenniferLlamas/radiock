/** Firma real de cada archivo y revisión de logos SVG (ContenidoArchivos.js). */
import { runInContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { adjunto, adjuntoCon, campos, entorno, FIRMAS, plano, publico } from '../pruebas/entornoAppsScript';

describe('backend: contenido real de los archivos', () => {
  const errorDe = (archivo: ReturnType<typeof adjunto>) => entorno().post({ campos, archivos: [archivo] }).error ?? '';

  it('acepta archivos reales del proyecto, aunque el navegador declare otro formato permitido', () => {
    const { post, archivos } = entorno();
    expect(post({ campos, archivos: [
      adjuntoCon('fotos', 'vivo.webp', 'image/webp', publico('comunidad/bailarina-en-vivo.webp')),
      adjuntoCon('fotos', 'cartel.jpg', 'image/jpeg', publico('eventos/radiock-fest-vol-1.jpg')),
      adjuntoCon('fotos', 'logo-como-foto.jpg', 'image/jpeg', publico('bandas/oblivion/logo.png')), // PNG con extensión .jpg
      adjuntoCon('logos', 'logo.png', 'image/png', publico('bandas/oblivion/logo.png')),
    ] })).toEqual({ ok: true });
    expect(archivos).toHaveLength(4);
  });

  it.each([
    ['MP3 sin ID3 (trama MPEG)', 'audio/mpeg', Buffer.from([0xff, 0xfb, 0x90, 0x00])],
    ['AAC (ADTS)', 'audio/aac', Buffer.from([0xff, 0xf1, 0x50, 0x80])],
    ['M4A', 'audio/x-m4a', Buffer.from('\0\0\0\x20ftypM4A ', 'latin1')],
    ['OGG', 'audio/ogg', Buffer.from('OggS\0\x02')],
    ['WAV declarado como audio/wave', 'audio/wave', FIRMAS['audio/wav']],
  ])('acepta canciones: %s', (_nombre, tipo, firma) => {
    expect(errorDe(adjuntoCon('canciones', 'tema', tipo, Buffer.concat([firma, Buffer.alloc(200, 1)])))).toBe('');
  });

  it.each([
    ['un ejecutable disfrazado de MP3', adjuntoCon('canciones', 'tema.mp3', 'audio/mpeg', Buffer.concat([Buffer.from('MZ'), Buffer.alloc(300)]))],
    ['una imagen subida como canción', adjuntoCon('canciones', 'tema.mp3', 'audio/mpeg', publico('bandas/oblivion/logo.png'))],
    ['un audio subido como foto', adjuntoCon('fotos', 'foto.jpg', 'image/jpeg', FIRMAS['audio/wav'])],
    ['texto que dice ser JPG', adjuntoCon('fotos', 'foto.jpg', 'image/jpeg', 'hola, no soy una foto')],
    ['un HTML que dice ser SVG', adjuntoCon('logos', 'logo.svg', 'image/svg+xml', '<html><body><svg></svg></body></html>')],
  ])('rechaza %s', (_caso, archivo) => {
    expect(errorDe(archivo)).toContain('no es un archivo de un formato permitido o está dañado.');
  });

  it('lee bien los bytes con signo que entrega Apps Script (-128…127)', () => {
    const { contexto } = entorno();
    const validar = runInContext('validarSolicitud_', contexto);
    const reglas = runInContext('reglasRegistro_()', contexto);
    const conSigno = (texto: string) => Array.from(new Int8Array(Buffer.from(texto, 'base64')));
    const r = validar({ campos, archivos: [adjuntoCon('fotos', 'logo.png', 'image/png', publico('bandas/oblivion/logo.png'))] }, reglas, conSigno);
    expect(plano(r.errores)).toEqual([]);
  });

  it('acepta un logo SVG simple como los que exportan Illustrator o Inkscape', () => {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generator: Adobe Illustrator 27.0 -->
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" xml:space="preserve">
  <defs><linearGradient id="g"><stop offset="0" stop-color="#f00"/></linearGradient></defs>
  <style>.a{fill:url(#g);font-family:'Montserrat'}</style>
  <rect class="a" width="100" height="100" style="fill: url('#g')"/>
  <use xlink:href="#g"/>
  <image href="data:image/png;base64,iVBORw0KGgo=" width="10" height="10"/>
  <text x="5" y="50">Banda one = 1</text>
</svg>`;
    expect(errorDe(adjuntoCon('logos', 'logo.svg', 'image/svg+xml', svg))).toBe('');
  });

  const svg = (interior: string, inicio = '') => `${inicio}<svg xmlns="http://www.w3.org/2000/svg">${interior}</svg>`;
  it.each([
    ['contiene scripts', svg('<script>alert(1)</script>')],
    ['contiene scripts', svg('<SCRIPT type="text/javascript">x()</SCRIPT>')],
    ['contiene eventos de JavaScript', svg('<rect onload="alert(1)"/>')],
    ['contiene eventos de JavaScript', svg('<rect\nonclick = "x()"/>')],
    ['contiene contenido incrustado', svg('<foreignObject><iframe src="x"/></foreignObject>')],
    ['contiene enlaces de código', svg('<a href="javascript:alert(1)"><rect/></a>')],
    ['anima enlaces', svg('<a href="#x"><set attributeName="href" to="&#106;avascript:alert(1)"/></a>')],
    ['importa estilos externos', svg('<style>@import "https://malo.ejemplo/x.css";</style>')],
    ['tiene enlaces externos', svg('<image href="https://rastreo.ejemplo/pixel.png"/>')],
    ['tiene enlaces externos', svg('<use xlink:href="otro.svg#icono"/>')],
    ['carga recursos externos', svg('<rect style="fill:url(https://malo.ejemplo/x)"/>')],
    ['declara entidades XML', svg('<text>&x;</text>', '<?xml version="1.0"?><!DOCTYPE svg [<!ENTITY x "a">]>')],
  ])('rechaza un SVG que %s', (motivo, contenido) => {
    expect(errorDe(adjuntoCon('logos', 'logo.svg', 'image/svg+xml', contenido))).toBe(
      `El archivo "logo.svg" no se aceptó: el SVG ${motivo}. Expórtalo como SVG simple o súbelo en PNG.`,
    );
  });
});
