/** Límites contra spam por hora y por día, limpieza de contadores y pausa (Limites.js). */
import { runInContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { adjunto, campos, entorno, propiedadesFalsas } from '../pruebas/entornoAppsScript';

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
