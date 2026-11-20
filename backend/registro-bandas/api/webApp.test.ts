/** Flujo completo de doPost/doGet: registro válido, validaciones y protecciones. */
import { describe, expect, it } from 'vitest';
import { adjunto, adjuntoCon, campos, entorno, MODULOS, modulosEnCarpeta, plano } from '../pruebas/entornoAppsScript';

describe('backend: registro válido', () => {
  it('crea subcarpetas Fotos/Logos/Canciones, nombra cada archivo con la banda y un número, y añade una fila', () => {
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
      { carpeta: 'Fotos', nombre: 'Oblivion - Foto 1.jpg', tipo: 'image/jpeg', bytes: 2000 },
      { carpeta: 'Logos', nombre: 'Oblivion - Logo 1.svg', tipo: 'image/svg+xml', bytes: 300 },
      { carpeta: 'Canciones', nombre: 'Oblivion - Canción 1.mp3', tipo: 'audio/mpeg', bytes: 5000 },
      { carpeta: 'Canciones', nombre: 'Oblivion - Canción 2.wav', tipo: 'audio/wav', bytes: 4000 },
    ]);
    expect(filas[0]).toEqual(['Fecha', 'Banda', 'Ciudad', 'Género', 'Instagram', 'YouTube', 'Contacto', 'Fotos', 'Logos', 'Canciones', 'Carpeta']);
    expect(filas[1].slice(7, 10)).toEqual([
      'https://drive/archivo/Oblivion - Foto 1.jpg', 'https://drive/archivo/Oblivion - Logo 1.svg',
      'https://drive/archivo/Oblivion - Canción 1.mp3\nhttps://drive/archivo/Oblivion - Canción 2.wav',
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

  it('neutraliza fórmulas en la hoja y rutas en los nombres de archivo y de carpeta', () => {
    const { post, archivos, carpetas, filas } = entorno();
    post({ campos: { ...campos, banda: '../AC/DC', contacto: '=IMPORTXML("http://x","//a")', genero: '+1' },
      archivos: [adjunto('fotos', '../../etc/passwd.png', 'image/png')] });
    expect(filas[1][6]).toBe(`'=IMPORTXML("http://x","//a")`);
    expect(filas[1][3]).toBe("'+1");
    expect(carpetas[0].nombre).toBe('2026-11-18 20.00 — _AC_DC');
    expect(archivos[0].nombre).toBe('_AC_DC - Foto 1.png');
  });

  it('la extensión sale del formato y el número sigue dentro de cada sección', () => {
    const { post, archivos } = entorno();
    expect(post({ campos, archivos: [
      adjunto('fotos', 'sin-extension', 'image/webp'),
      adjunto('fotos', 'FOTO.JPEG', 'image/jpeg'),
      adjunto('logos', 'logo.png', 'image/png'),
      // audio/x-m4a es una variante de audio/mp4: se guarda como .m4a
      adjuntoCon('canciones', 'tema', 'audio/x-m4a', Buffer.from('\0\0\0\x20ftypM4A \0\0\0\0', 'latin1')),
    ] }).ok).toBe(true);
    expect(archivos.map((a) => a.nombre)).toEqual(['Oblivion - Foto 1.webp', 'Oblivion - Foto 2.jpg', 'Oblivion - Logo 1.png', 'Oblivion - Canción 1.m4a']);
  });

  it('con un nombre de banda muy largo conserva el tipo, el número y la extensión', () => {
    const { post, archivos } = entorno();
    post({ campos: { ...campos, banda: 'B'.repeat(120) }, archivos: [adjunto('canciones', 'a.mp3', 'audio/mpeg')] });
    expect(archivos[0].nombre).toBe(`${'B'.repeat(80)} - Canción 1.mp3`);
  });

  it('JSON inválido devuelve un error genérico y doGet confirma el despliegue', () => {
    const { contexto } = entorno();
    expect(plano(contexto.doPost({ postData: { contents: 'no es json' } }))).toEqual({ ok: false, error: 'No pudimos guardar el registro. Inténtalo de nuevo en unos minutos.' });
    expect(plano(contexto.doGet())).toEqual({ ok: true, servicio: 'registro-bandas' });
  });
});

describe('backend: módulos', () => {
  it('el entorno de pruebas carga todos los archivos .js del proyecto de Apps Script', () => {
    expect([...MODULOS].sort()).toEqual(modulosEnCarpeta());
  });

  it('funciona sin importar el orden en que Apps Script cargue los archivos', () => {
    const { post, carpetas } = entorno({ modulos: [...MODULOS].reverse() });
    expect(post({ campos, archivos: [adjunto('logos', 'logo.svg', 'image/svg+xml')] })).toEqual({ ok: true });
    expect(carpetas).toHaveLength(1);
  });
});
