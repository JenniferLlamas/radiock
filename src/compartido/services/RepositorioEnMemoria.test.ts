import { describe, expect, it } from 'vitest';
import { RepositorioEnMemoria } from './RepositorioEnMemoria';

describe('RepositorioEnMemoria', () => {
  const repositorio = new RepositorioEnMemoria([{ id: 'a', n: 1 }, { id: 'b', n: 2 }]);

  it('devuelve todos los elementos y busca por id', () => {
    expect(repositorio.todos()).toHaveLength(2);
    expect(repositorio.porId('b')).toEqual({ id: 'b', n: 2 });
    expect(repositorio.porId('z')).toBeUndefined();
  });

  it('no permite modificar la colección', () => {
    expect(Object.isFrozen(repositorio.todos())).toBe(true);
  });

  it('falla al compilar si hay ids repetidos', () => {
    expect(() => new RepositorioEnMemoria([{ id: 'a' }, { id: 'a' }])).toThrow(/duplicado.*"a"/);
  });
});
