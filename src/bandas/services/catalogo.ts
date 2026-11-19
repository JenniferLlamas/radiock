// Raíz de composición de Bandas. Para otra fuente de datos, sustituir solo el repositorio.
import { RepositorioEnMemoria, type Repositorio } from '@/compartido';
import type { Banda } from '../domain/Banda';
import { bandas } from '../data/bandas';

export const catalogoBandas: Repositorio<Banda> = new RepositorioEnMemoria(bandas);
