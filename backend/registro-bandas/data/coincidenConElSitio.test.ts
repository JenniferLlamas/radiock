/** Los datos y el tope del backend coinciden con los del sitio: si cambias uno y olvidas el otro, falla. */
import { runInContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { MAX_BYTES_TOTAL } from '@/contacto/constants/archivos';
import { archivosPresentacion } from '@/contacto/data/archivosPresentacion';
import { camposPresentacion } from '@/contacto/data/camposPresentacion';
import { entorno, plano } from '../pruebas/entornoAppsScript';

describe('backend y sitio usan los mismos límites', () => {
  const { contexto } = entorno();
  const config = plano(runInContext('reglasRegistro_()', contexto)) as {
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
