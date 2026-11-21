// Raíz de composición de Sedes. Para otra fuente de datos, sustituir solo el repositorio.
import { RepositorioEnMemoria, type Repositorio } from '@/compartido';
import type { Sede } from '../domain/Sede';
import { sedes } from '../data/sedes';

export const directorioSedes: Repositorio<Sede> = new RepositorioEnMemoria(sedes);
