import type { IdRedSocial } from './redesSociales';

export const sitio = {
  nombre: 'Radiock',
  titulo: 'Radiock | Música local. Escenarios reales.',
  descripcion: 'Radiock impulsa bandas locales con música original creando eventos, escenarios y conexiones para llevar nuestra escena de aquí para el mundo.',
  // URL de la vista privada. Sustituir por el dominio oficial cuando esté disponible.
  url: 'https://radiock-escena.j3nny153000.chatgpt.site',
  correo: '',
  // URL del Web App de Apps Script que guarda los registros en Drive (backend/registro-bandas).
  // Vacía: el formulario prepara un mensaje para enviarlo por redes, sin backend.
  // La variable PUBLIC_REGISTRO_URL, si existe al compilar, tiene prioridad (útil para pruebas).
  urlRegistro: import.meta.env?.PUBLIC_REGISTRO_URL || '',
  // Igual, para el registro de locales que prestan su espacio (backend/registro-locales).
  // Es otro Web App, con su propia hoja: los registros de bandas y de locales no se mezclan.
  urlRegistroLocales: import.meta.env?.PUBLIC_REGISTRO_LOCALES_URL || '',
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
