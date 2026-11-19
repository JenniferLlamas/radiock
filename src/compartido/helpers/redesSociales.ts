import { nombresRedes, type IdRedSocial } from '../constants/redesSociales';
import { sitio } from '../constants/sitio';
import type { EnlaceExterno } from '../domain/EnlaceExterno';

/** Redes de Radiock que tienen una URL configurada, en el orden del registro. */
export const redesRadiock = (
  redes: Partial<Record<IdRedSocial, string>> = sitio.redes,
): EnlaceExterno[] =>
  (Object.keys(nombresRedes) as IdRedSocial[])
    .filter((id) => Boolean(redes[id]))
    .map((id) => ({ nombre: nombresRedes[id], url: redes[id]! }));
