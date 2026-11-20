import { SALUDO_LOCAL, SALUDO_PRESENTACION } from '../constants/mensajes';
import type { Registro, TipoRegistro } from '../domain/Registro';
import { archivosPresentacion } from './archivosPresentacion';
import { camposLocal } from './camposLocal';
import { camposPresentacion } from './camposPresentacion';

/** Bandas: datos de la banda con fotos, logos y canciones. */
export const registroBanda: Registro = {
  tipo: 'banda',
  campos: camposPresentacion,
  archivos: archivosPresentacion,
  campoNombre: 'banda',
  saludo: SALUDO_PRESENTACION,
};

/** Locales que prestan su espacio para eventos: solo datos de texto. */
export const registroLocal: Registro = {
  tipo: 'local',
  campos: camposLocal,
  archivos: [],
  campoNombre: 'local',
  saludo: SALUDO_LOCAL,
};

export const registros: Readonly<Record<TipoRegistro, Registro>> = { banda: registroBanda, local: registroLocal };
