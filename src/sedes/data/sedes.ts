import type { Sede } from '../domain/Sede';

const logo = (id: string) => `/sedes/${id}/logo.webp`;

/** En orden del primer Radiock Fest que recibieron. Los logos originales están en originales/sedes. */
export const sedes: readonly Sede[] = [
  {
    id: 'republica-de-hops',
    nombre: 'República de Hops',
    ubicacion: 'Pasaje Revolución, Zona Centro',
    logo: logo('republica-de-hops'),
    eventos: ['radiock-fest-vol-1', 'radiock-fest-vol-4'],
  },
  {
    id: 'evolution-club',
    nombre: 'Evolution Club',
    ubicacion: 'Entre 6ta y 7ma, Calle Revolución',
    logo: logo('evolution-club'),
    eventos: ['radiock-fest-vol-2'],
  },
  {
    id: 'ranas-bar',
    nombre: 'Ranas Bar',
    ubicacion: 'Plaza del Zapato',
    logo: logo('ranas-bar'),
    eventos: ['radiock-fest-vol-3'],
  },
  {
    id: 'border-psycho',
    nombre: 'Border Psycho Brewery',
    ubicacion: 'Av. Revolución 821, Zona Centro',
    logo: logo('border-psycho'),
    eventos: ['radiock-fest-vol-5'],
  },
];
