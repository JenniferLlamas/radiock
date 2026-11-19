/** Cualquier entidad del sitio que pueda localizarse por un identificador estable. */
export interface Identificable {
  readonly id: string;
}

/**
 * Contrato de lectura de una colección (patrón Repository).
 * Los componentes dependen de esta abstracción y no del origen de los datos,
 * así un archivo local puede sustituirse por un CMS o Content Collections
 * sin modificar la interfaz de usuario (principio de inversión de dependencias).
 * Implementación actual: services/RepositorioEnMemoria.ts.
 */
export interface Repositorio<T extends Identificable> {
  todos(): readonly T[];
  porId(id: string): T | undefined;
}
