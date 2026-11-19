/** Flujo completo de doPost/doGet: registro válido, validaciones y protecciones. */
import { describe, expect, it } from 'vitest';
import { adjunto, campos, entorno, MODULOS, modulosEnCarpeta, plano } from '../pruebas/entornoAppsScript';

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
