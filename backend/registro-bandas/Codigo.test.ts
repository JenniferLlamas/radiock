/**
 * Pruebas del backend de Apps Script en Node: se ejecuta Codigo.js en un contexto aislado
 * con imitaciones de DriveApp, SpreadsheetApp, Utilities, LockService y ContentService.
 * También comprueba que sus límites coinciden con los del sitio.
 */
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { MAX_BYTES_TOTAL } from '@/contacto/constants/archivos';
import { archivosPresentacion } from '@/contacto/data/archivosPresentacion';
import { camposPresentacion } from '@/contacto/data/camposPresentacion';

const CODIGO = readFileSync(new URL('./Codigo.js', import.meta.url), 'utf8')
  .replace("'PEGAR_AQUI_EL_ID_DE_LA_CARPETA'", "'CARPETA'")
  .replace("'PEGAR_AQUI_EL_ID_DE_LA_HOJA'", "'HOJA'");

interface CarpetaFalsa {
  nombre: string;
  subcarpetas: CarpetaFalsa[];
  archivos: { nombre: string; tipo: string; bytes: number[] }[];
}

/** Valores creados dentro del contexto vm tienen otros prototipos: se normalizan con JSON. */
const plano = <T>(valor: T): T => JSON.parse(JSON.stringify(valor));

/** Imitación de PropertiesService.getScriptProperties(). */
function propiedadesFalsas(iniciales: Record<string, string> = {}) {
  const datos = new Map(Object.entries(iniciales));
  return {
    datos,
    getProperty: (k: string) => datos.get(k) ?? null,
    setProperty: (k: string, v: string) => { datos.set(k, v); },
    getKeys: () => [...datos.keys()],
    deleteProperty: (k: string) => { datos.delete(k); },
  };
}

function entorno({ propiedades = propiedadesFalsas() } = {}) {
  /** Reloj controlable: cambia `reloj.hora` o `reloj.dia` para simular el paso del tiempo. */
  const reloj = { dia: '2026-11-18', hora: '20' };
  const carpetas: CarpetaFalsa[] = [];
  const archivos: { carpeta: string; nombre: string; tipo: string; bytes: number }[] = [];
  const filas: unknown[][] = [];
  const crearCarpeta = (nombre: string): CarpetaFalsa & Record<string, unknown> => {
    const carpeta: CarpetaFalsa & Record<string, unknown> = {
      nombre, subcarpetas: [], archivos: [],
      getUrl: () => `https://drive/${encodeURIComponent(nombre)}`,
      createFolder: (n: string) => { const sub = crearCarpeta(n); carpeta.subcarpetas.push(sub); return sub; },
      createFile: (blob: { nombre: string; tipo: string; bytes: number[] }) => {
        carpeta.archivos.push(blob);
        archivos.push({ carpeta: nombre, nombre: blob.nombre, tipo: blob.tipo, bytes: blob.bytes.length });
        return { getUrl: () => `https://drive/archivo/${blob.nombre}` };
      },
    };
    return carpeta;
  };
  const contexto = createContext({
    console: { error: () => {}, warn: () => {} },
    Utilities: {
      base64Decode: (texto: string) => Array.from(Buffer.from(texto, 'base64')),
      newBlob: (bytes: number[], tipo: string, nombre: string) => ({ bytes, tipo, nombre }),
      formatDate: (_fecha: Date, _zona: string, formato: string) =>
        formato === "yyyy-MM-dd'T'HH" ? `${reloj.dia}T${reloj.hora}`
          : formato === 'yyyy-MM-dd' ? reloj.dia
            : `${reloj.dia} ${reloj.hora}.00`,
    },
    PropertiesService: { getScriptProperties: () => propiedades },
    DriveApp: { getFolderById: () => ({ createFolder: (n: string) => { const c = crearCarpeta(n); carpetas.push(c); return c; } }) },
    SpreadsheetApp: {
      openById: () => ({
        getSheetByName: () => null,
        insertSheet: () => ({ getLastRow: () => filas.length, appendRow: (fila: unknown[]) => filas.push(plano(fila)), setFrozenRows: () => {} }),
      }),
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (texto: string) => ({ setMimeType: () => JSON.parse(texto) }) },
  });
  runInContext(CODIGO, contexto);
  const post = (cuerpo: unknown) => plano(contexto.doPost({ postData: { contents: JSON.stringify(cuerpo) } })) as { ok: boolean; error?: string };
  return { post, carpetas, archivos, filas, contexto, reloj, propiedades };
}

/** Primeros bytes reales de cada formato, para que los adjuntos de prueba pasen la revisión de contenido. */
const FIRMAS: Record<string, Buffer> = {
  'image/jpeg': Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  'image/png': Buffer.from('89504e470d0a1a0a', 'hex'),
  'image/webp': Buffer.from('RIFF\0\0\0\0WEBP', 'latin1'),
  'image/svg+xml': Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><circle r="4"/></svg>'),
  'audio/mpeg': Buffer.from('ID3'),
  'audio/wav': Buffer.from('RIFF\0\0\0\0WAVE', 'latin1'),
};
/** Archivo de `bytes` de tamaño que empieza con la firma de su tipo (el SVG se rellena con espacios). */
const contenidoDe = (tipo: string, bytes: number) => {
  const datos = Buffer.alloc(bytes, tipo === 'image/svg+xml' ? 0x20 : 7);
  FIRMAS[tipo]?.copy(datos);
  return datos;
};
const adjunto = (campo: string, nombre: string, tipo: string, bytes = 100) =>
  ({ campo, nombre, tipo, contenido: contenidoDe(tipo, bytes).toString('base64') });
/** Adjunto con contenido arbitrario (archivos reales o disfrazados). */
const adjuntoCon = (campo: string, nombre: string, tipo: string, contenido: Buffer | string) =>
  ({ campo, nombre, tipo, contenido: Buffer.from(contenido).toString('base64') });
const campos = { banda: 'Oblivion', ciudad: 'Tijuana', genero: 'Rock', instagram: '', youtube: '', contacto: 'oblivion@ejemplo.com' };

describe('backend: registro válido', () => {
  it('crea subcarpetas Fotos/Logos/Canciones y una fila con una columna por tipo', () => {
    const { post, carpetas, archivos, filas } = entorno();
    expect(post({ campos, sitioWeb: '', archivos: [
      adjunto('fotos', 'vivo.jpg', 'image/jpeg', 2000),
      adjunto('logos', 'logo.svg', 'image/svg+xml', 300),
      adjunto('canciones', 'a.mp3', 'audio/mpeg', 5000),
      adjunto('canciones', 'b.wav', 'audio/wav', 4000),
    ] })).toEqual({ ok: true });

    expect(carpetas[0].nombre).toBe('2026-11-18 20.00 — Oblivion');
    expect(carpetas[0].subcarpetas.map((s) => s.nombre)).toEqual(['Fotos', 'Logos', 'Canciones']);
    expect(archivos).toEqual([
      { carpeta: 'Fotos', nombre: 'vivo.jpg', tipo: 'image/jpeg', bytes: 2000 },
      { carpeta: 'Logos', nombre: 'logo.svg', tipo: 'image/svg+xml', bytes: 300 },
      { carpeta: 'Canciones', nombre: 'a.mp3', tipo: 'audio/mpeg', bytes: 5000 },
      { carpeta: 'Canciones', nombre: 'b.wav', tipo: 'audio/wav', bytes: 4000 },
    ]);
    expect(filas[0]).toEqual(['Fecha', 'Banda', 'Ciudad', 'Género', 'Instagram', 'YouTube', 'Contacto', 'Fotos', 'Logos', 'Canciones', 'Carpeta']);
    expect(filas[1].slice(7, 10)).toEqual([
      'https://drive/archivo/vivo.jpg', 'https://drive/archivo/logo.svg', 'https://drive/archivo/a.mp3\nhttps://drive/archivo/b.wav',
    ]);
  });

  it('solo crea las subcarpetas de lo que se envió', () => {
    const { post, carpetas } = entorno();
    post({ campos, archivos: [adjunto('logos', 'logo.png', 'image/png')] });
    expect(carpetas[0].subcarpetas.map((s) => s.nombre)).toEqual(['Logos']);
  });
});

describe('backend: protección', () => {
  it('el campo trampa responde ok sin guardar nada', () => {
    const { post, carpetas, filas } = entorno();
    expect(post({ campos, archivos: [], sitioWeb: 'http://spam' })).toEqual({ ok: true });
    expect(carpetas.length + filas.length).toBe(0);
  });

  it('rechaza obligatorios vacíos, formatos, tamaños, cantidades y campos desconocidos sin crear nada', () => {
    const { post, carpetas } = entorno();
    const r = post({ campos: { ...campos, banda: '  ' }, archivos: [
      adjunto('fotos', 'dibujo.svg', 'image/svg+xml'),
      adjunto('canciones', 'larga.wav', 'audio/wav', 16 * 1024 * 1024),
      ...[1, 2, 3].map((i) => adjunto('logos', `l${i}.png`, 'image/png')),
      adjunto('imagenes', 'vieja.jpg', 'image/jpeg'),
    ] });
    expect(r.ok).toBe(false);
    expect(r.error).toContain('Falta el campo Banda.');
    expect(r.error).toContain('"dibujo.svg" no tiene un formato permitido.');
    expect(r.error).toContain('"larga.wav" supera 15 MB.');
    expect(r.error).toContain('máximo 2 archivo(s) en Logos.');
    expect(r.error).toContain('archivo no esperado');
    expect(carpetas).toHaveLength(0);
  });

  it('rechaza envíos de más de 30 MB', () => {
    const { post } = entorno();
    const r = post({ campos, archivos: [1, 2, 3].map((i) => adjunto('canciones', `c${i}.mp3`, 'audio/mpeg', 12 * 1024 * 1024)) });
    expect(r.error).toContain('suman más de 30 MB');
  });

  it('neutraliza fórmulas en la hoja y rutas en los nombres de archivo', () => {
    const { post, archivos, filas } = entorno();
    post({ campos: { ...campos, contacto: '=IMPORTXML("http://x","//a")', genero: '+1' },
      archivos: [adjunto('fotos', '../../etc/passwd.png', 'image/png')] });
    expect(filas[1][6]).toBe(`'=IMPORTXML("http://x","//a")`);
    expect(filas[1][3]).toBe("'+1");
    expect(archivos[0].nombre).toBe('_.._etc_passwd.png');
  });

  it('JSON inválido devuelve un error genérico y doGet confirma el despliegue', () => {
    const { contexto } = entorno();
    expect(plano(contexto.doPost({ postData: { contents: 'no es json' } }))).toEqual({ ok: false, error: 'No pudimos guardar el registro. Inténtalo de nuevo en unos minutos.' });
    expect(plano(contexto.doGet())).toEqual({ ok: true, servicio: 'registro-bandas' });
  });
});

describe('backend: contenido real de los archivos', () => {
  const publico = (ruta: string) => readFileSync(new URL(`../../public/${ruta}`, import.meta.url));
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
    const config = runInContext('CONFIG', contexto);
    const conSigno = (texto: string) => Array.from(new Int8Array(Buffer.from(texto, 'base64')));
    const r = validar({ campos, archivos: [adjuntoCon('fotos', 'logo.png', 'image/png', publico('bandas/oblivion/logo.png'))] }, config, conSigno);
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

describe('backend: límites contra spam', () => {
  const limitar = (contexto: ReturnType<typeof entorno>['contexto'], limites: Record<string, number>) =>
    runInContext(`Object.assign(CONFIG.LIMITES, ${JSON.stringify(limites)})`, contexto);
  const MB = 1024 * 1024;

  it('rechaza al pasar los envíos por hora y vuelve a aceptar la hora siguiente', () => {
    const { post, contexto, reloj, carpetas } = entorno();
    limitar(contexto, { ENVIOS_POR_HORA: 2 });
    expect(post({ campos, archivos: [] }).ok).toBe(true);
    expect(post({ campos, archivos: [] }).ok).toBe(true);
    const r = post({ campos, archivos: [] });
    expect(r).toEqual({ ok: false, error: expect.stringContaining('Recibimos muchos registros') });
    expect(carpetas).toHaveLength(2);

    reloj.hora = '21';
    expect(post({ campos, archivos: [] }).ok).toBe(true);
  });

  it('rechaza al pasar los envíos por día aunque cambie la hora, y se reinicia al día siguiente', () => {
    const { post, contexto, reloj } = entorno();
    limitar(contexto, { ENVIOS_POR_DIA: 2 });
    post({ campos, archivos: [] });
    reloj.hora = '21';
    post({ campos, archivos: [] });
    reloj.hora = '22';
    expect(post({ campos, archivos: [] }).ok).toBe(false);
    reloj.dia = '2026-11-19';
    expect(post({ campos, archivos: [] }).ok).toBe(true);
  });

  it('cuenta los megas del día: rechaza el envío que no cabe, pero acepta uno más chico', () => {
    const { post, contexto } = entorno();
    limitar(contexto, { MEGAS_POR_DIA: 20 });
    const cancion = (mb: number) => adjunto('canciones', 'c.mp3', 'audio/mpeg', mb * MB);
    expect(post({ campos, archivos: [cancion(12)] }).ok).toBe(true);
    expect(post({ campos, archivos: [cancion(10)] }).ok).toBe(false);
    expect(post({ campos, archivos: [cancion(8)] }).ok).toBe(true);
  });

  it('los envíos inválidos y los del campo trampa no gastan cupo', () => {
    const { post, contexto } = entorno();
    limitar(contexto, { ENVIOS_POR_HORA: 1 });
    post({ campos: { ...campos, banda: '' }, archivos: [] });
    post({ campos, archivos: [], sitioWeb: 'http://spam' });
    expect(post({ campos, archivos: [] }).ok).toBe(true);
  });

  it('borra los contadores viejos y no toca otras propiedades del script', () => {
    const propiedades = propiedadesFalsas({ 'limite:hora:2026-11-17T09': '5', 'limite:dia:2026-11-17': '{"envios":5,"bytes":0}', OTRA: 'x' });
    const { post } = entorno({ propiedades });
    post({ campos, archivos: [] });
    expect([...propiedades.datos.keys()].sort()).toEqual(['OTRA', 'limite:dia:2026-11-18', 'limite:hora:2026-11-18T20']);
  });

  it('REGISTRO_PAUSADO = "si" rechaza todo sin guardar; al borrarla se reanuda', () => {
    const propiedades = propiedadesFalsas({ REGISTRO_PAUSADO: ' Si ' });
    const { post, carpetas } = entorno({ propiedades });
    expect(post({ campos, archivos: [] })).toEqual({ ok: false, error: expect.stringContaining('pausado') });
    expect(carpetas).toHaveLength(0);
    propiedades.deleteProperty('REGISTRO_PAUSADO');
    expect(post({ campos, archivos: [] }).ok).toBe(true);
  });
});

describe('backend y sitio usan los mismos límites', () => {
  const { contexto } = entorno();
  const config = plano(runInContext('CONFIG', contexto)) as {
    CAMPOS: { nombre: string; obligatorio: boolean; maximo: number }[];
    ARCHIVOS: Record<string, { maximo: number; maxBytes: number; tipos: string[] }>;
    MAX_BYTES_TOTAL: number;
  };

  it('campos de texto', () => {
    expect(config.CAMPOS.map(({ nombre, obligatorio, maximo }) => ({ nombre, obligatorio, maximo })))
      .toEqual(camposPresentacion.map(({ nombre, obligatorio, maximo }) => ({ nombre, obligatorio, maximo })));
  });

  it('fotos, logos y canciones', () => {
    for (const regla of archivosPresentacion) {
      expect(config.ARCHIVOS[regla.nombre], regla.nombre).toMatchObject({ maximo: regla.maximo, maxBytes: regla.maxBytes, tipos: [...regla.tipos] });
    }
    expect(Object.keys(config.ARCHIVOS)).toEqual(archivosPresentacion.map((r) => r.nombre));
    expect(config.MAX_BYTES_TOTAL).toBe(MAX_BYTES_TOTAL);
  });
});
