import type { EnlaceExterno, Identificable } from '@/compartido';

export interface Banda extends Identificable {
  readonly nombre: string;
  readonly logo: string;
  readonly ciudad?: string;
  readonly genero?: string;
  readonly redes: readonly EnlaceExterno[];
}
