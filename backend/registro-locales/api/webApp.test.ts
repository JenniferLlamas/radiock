/** Flujo completo de doPost/doGet del registro de locales: guardado, validaciones y protecciones. */
import { runInContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { campos, entorno, MODULOS, modulosEnCarpeta, plano, propiedadesFalsas } from '../pruebas/entorno';

describe('locales: registro válido', () => {
  it('añade una fila a la pestaña Locales, sin crear carpetas en Drive', () => {
    const { post, filas, pestanas, carpetas } = entorno();
    expect(post({ tipo: 'local', campos, archivos: [], sitioWeb: '' })).toEqual({ ok: true });
    expect(pestanas).toEqual(['Locales']);
    expect(filas[0]).toEqual(['Fecha', 'Local', 'Responsable', 'Ubicación', 'Contacto']);
    expect(filas[1].slice(1)).toEqual(['El Foro', 'Ana López', 'Av. Revolución 123, Centro, Tijuana', '664 123 4567']);
    expect(carpetas).toHaveLength(0);
  });

  it('recorta espacios y solo escribe los encabezados una vez', () => {
    const { post, filas } = entorno();
    post({ campos: { ...campos, local: '  El Foro  ' } });
    post({ campos: { ...campos, local: 'La Bodega' } });
    expect(filas.map((f) => f[1])).toEqual(['Local', 'El Foro', 'La Bodega']);
  });
});

describe('locales: protección', () => {
  it('el campo trampa responde ok sin guardar nada', () => {
    const { post, filas } = entorno();
    expect(post({ campos, sitioWeb: 'http://spam' })).toEqual({ ok: true });
    expect(filas).toHaveLength(0);
  });

  it('rechaza obligatorios vacíos, textos demasiado largos y archivos, sin guardar', () => {
    const { post, filas } = entorno();
    const r = post({ campos: { ...campos, responsable: '   ', ubicacion: 'x'.repeat(301) }, archivos: [{ campo: 'fotos', nombre: 'a.jpg' }] });
    expect(r.ok).toBe(false);
    expect(r.error).toContain('Falta el campo Responsable.');
    expect(r.error).toContain('Ubicación es demasiado largo.');
    expect(r.error).toContain('no recibe archivos');
    expect(filas).toHaveLength(0);
  });

  it('neutraliza fórmulas en la hoja', () => {
    const { post, filas } = entorno();
    post({ campos: { ...campos, contacto: '=IMPORTXML("http://x","//a")', local: '+1 bar' } });
    expect(filas[1][4]).toBe(`'=IMPORTXML("http://x","//a")`);
    expect(filas[1][1]).toBe("'+1 bar");
  });

  it('límite por hora: rechaza al pasarlo y acepta la hora siguiente; los inválidos no cuentan', () => {
    const { post, contexto, reloj, filas } = entorno();
    runInContext('CONFIG.LIMITES.ENVIOS_POR_HORA = 2', contexto);
    post({ campos: { ...campos, local: '' } });
    expect(post({ campos }).ok).toBe(true);
    expect(post({ campos }).ok).toBe(true);
    expect(post({ campos })).toEqual({ ok: false, error: expect.stringContaining('Recibimos muchos registros') });
    expect(filas).toHaveLength(3); // encabezados + 2
    reloj.hora = '21';
    expect(post({ campos }).ok).toBe(true);
  });

  it('límite por día: se reinicia al día siguiente y borra los contadores viejos', () => {
    const propiedades = propiedadesFalsas({ 'limite:dia:2026-11-17': '9', OTRA: 'x' });
    const { post, contexto, reloj } = entorno({ propiedades });
    runInContext('CONFIG.LIMITES.ENVIOS_POR_DIA = 1', contexto);
    expect(post({ campos }).ok).toBe(true);
    reloj.hora = '22';
    expect(post({ campos }).ok).toBe(false);
    // Se borró el día anterior y la hora 20; el envío rechazado no crea contador de la hora 22.
    expect([...propiedades.datos.keys()].sort()).toEqual(['OTRA', 'limite:dia:2026-11-18']);
    reloj.dia = '2026-11-19';
    expect(post({ campos }).ok).toBe(true);
  });

  it('REGISTRO_PAUSADO = "si" rechaza todo sin guardar', () => {
    const { post, filas } = entorno({ propiedades: propiedadesFalsas({ REGISTRO_PAUSADO: ' Si ' }) });
    expect(post({ campos })).toEqual({ ok: false, error: expect.stringContaining('está pausado') });
    expect(filas).toHaveLength(0);
  });

  it('JSON inválido devuelve un error genérico y doGet confirma el despliegue', () => {
    const { contexto } = entorno();
    expect(plano(contexto.doPost({ postData: { contents: 'no es json' } }))).toEqual({ ok: false, error: 'No pudimos guardar tus datos. Inténtalo de nuevo en unos minutos.' });
    expect(plano(contexto.doGet())).toEqual({ ok: true, servicio: 'registro-locales' });
  });
});

describe('locales: módulos', () => {
  it('el entorno de pruebas carga todos los archivos .js del proyecto', () => {
    expect([...MODULOS].sort()).toEqual(modulosEnCarpeta());
  });

  it('funciona sin importar el orden en que Apps Script cargue los archivos', () => {
    const { post, filas } = entorno({ modulos: [...MODULOS].reverse() });
    expect(post({ campos }).ok).toBe(true);
    expect(filas).toHaveLength(2);
  });
});
