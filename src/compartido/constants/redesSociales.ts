/**
 * Registro de redes conocidas y su nombre visible. Para admitir una red nueva
 * basta con añadirla aquí y en `sitio.redes`; ningún componente cambia.
 * El orden de este registro es el orden en el que se muestran.
 */
export const nombresRedes = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  twitch: 'Twitch',
} as const;

export type IdRedSocial = keyof typeof nombresRedes;
