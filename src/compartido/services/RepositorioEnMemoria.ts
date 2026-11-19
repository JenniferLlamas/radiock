import type { Identificable, Repositorio } from '../domain/Repositorio';

/** Repositorio respaldado por un arreglo estático definido en el código (data/). */
export class RepositorioEnMemoria<T extends Identificable> implements Repositorio<T> {
  private readonly elementos: readonly T[];
  private readonly indice: ReadonlyMap<string, T>;

  constructor(elementos: readonly T[]) {
    const indice = new Map<string, T>();
    for (const elemento of elementos) {
      if (indice.has(elemento.id)) {
        throw new Error(`Identificador duplicado en el repositorio: "${elemento.id}"`);
      }
      indice.set(elemento.id, elemento);
    }
    this.elementos = Object.freeze([...elementos]);
    this.indice = indice;
  }

  todos(): readonly T[] {
    return this.elementos;
  }

  porId(id: string): T | undefined {
    return this.indice.get(id);
  }
}
