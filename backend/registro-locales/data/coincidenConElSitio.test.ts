/** Los campos del backend de locales coinciden con los del sitio: si cambias uno y olvidas el otro, falla. */
import { runInContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { camposLocal } from '@/contacto/data/camposLocal';
import { entorno, plano } from '../pruebas/entorno';

describe('backend de locales y sitio usan los mismos campos', () => {
  it('nombre, obligatorio y máximo, en el mismo orden', () => {
    const { contexto } = entorno();
    const CAMPOS = plano(runInContext('CAMPOS', contexto)) as { nombre: string; obligatorio: boolean; maximo: number }[];
    expect(CAMPOS.map(({ nombre, obligatorio, maximo }) => ({ nombre, obligatorio, maximo })))
      .toEqual(camposLocal.map(({ nombre, obligatorio, maximo }) => ({ nombre, obligatorio, maximo })));
  });
});
