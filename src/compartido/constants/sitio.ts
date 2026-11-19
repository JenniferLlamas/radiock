import type { IdRedSocial } from './redesSociales';

export const sitio = {
  nombre: 'Radiock',
  titulo: 'Radiock | Música local. Escenarios reales.',
  descripcion: 'Radiock impulsa bandas locales con música original creando eventos, escenarios y conexiones para llevar nuestra escena de aquí para el mundo.',
  // URL de la vista privada. Sustituir por el dominio oficial cuando esté disponible.
  url: 'https://radiock-escena.j3nny153000.chatgpt.site',
  correo: '',
  // Determina qué eventos son próximos y cuáles ya pasaron.
  zonaHoraria: 'America/Tijuana',
  // Una red sin URL no se muestra en el sitio.
  redes: {
    instagram: 'https://www.instagram.com/radiock_tj/',
    facebook: 'https://www.facebook.com/profile.php?id=61554851962868',
    youtube: '',
    tiktok: '',
    twitch: 'https://www.twitch.tv/radiock_tj',
  } satisfies Record<IdRedSocial, string>,
};
