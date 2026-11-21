import type { Evento } from '../domain/Evento';

// Todos los eventos, pasados y futuros, en una sola lista.
// La agenda decide si un evento es próximo o anterior según su fecha (zona horaria en
// `compartido/constants/sitio.ts`) y cada uno obtiene su página en /eventos/<id>.
// El sitio es estático: la clasificación se calcula al compilar, así que hay que
// volver a publicar después de un evento para que pase al archivo.
// Datos recuperados de los carteles y de las secciones originales del proyecto.
export const eventos: readonly Evento[] = [
  {
    id: 'radiock-fest-vol-1',
    titulo: 'Radiock Fest Vol. 1',
    fecha: '2024-08-10',
    hora: '19:00',
    venue: 'República de Hops · Pasaje Revolución',
    ciudad: 'Tijuana, B.C.',
    cartel: '/eventos/cartel-radiock-fest-vol-1.webp',
    miniatura: '/eventos/radiock-fest-vol-1.jpg',
    bandas: ['Bluesfire', 'Bailarina Sin Cabeza', 'Jumping Beans', 'Oblivion', 'Infortunio', 'Stridulus'],
  },
  {
    id: 'radiock-fest-vol-2',
    titulo: 'Radiock Fest Vol. 2',
    fecha: '2024-12-14',
    hora: '19:00',
    venue: 'Evolution Club · Entre 6ta y 7ma Calle Revolución',
    ciudad: 'Tijuana, B.C.',
    cartel: '/eventos/cartel-radiock-fest-vol-2.webp',
    miniatura: '/eventos/radiock-fest-vol-2.webp',
    bandas: ['Antarex', 'Eternika', 'Stridulus', 'Oblivion', 'Bluesfire', 'Bisonz'],
  },
  {
    id: 'radiock-fest-vol-3',
    titulo: 'Radiock Fest Vol. 3',
    fecha: '2025-04-05',
    hora: '20:00',
    venue: 'Ranas Bar · Plaza del Zapato',
    ciudad: 'Tijuana, B.C.',
    cartel: '/eventos/cartel-radiock-fest-vol-3.webp',
    miniatura: '/eventos/radiock-fest-vol-3.webp',
    bandas: ['5to Tripulante', 'Eternika', 'Volka', 'Oblivion', 'Bluesfire', 'Bailarina sin cabeza', 'WestWolf', 'Voces sin rostro'],
  },
  {
    id: 'radiock-fest-vol-4',
    titulo: 'Radiock Fest Vol. 4',
    fecha: '2025-06-28',
    hora: '19:00',
    venue: 'República de Hops · Pasaje Revolución',
    ciudad: 'Tijuana, B.C.',
    cartel: '/eventos/cartel-radiock-fest-vol-4.webp',
    miniatura: '/eventos/radiock-fest-vol-4.webp',
    bandas: ['Instinto Animal', 'Eternika', 'Oblivion', 'Jumping Beans', 'Voces sin Rostro', 'The Aprils', 'Euphoric Forms', 'Inside Joke'],
  },
  {
    id: 'radiock-fest-vol-5',
    titulo: 'Radiock Fest Vol. 5',
    fecha: '2025-08-30',
    hora: '17:00',
    venue: 'Border Psycho Brewery · Av. Revolución 821, Zona Centro',
    ciudad: 'Tijuana, B.C.',
    cartel: '/eventos/cartel-radiock-fest-vol-5.webp',
    miniatura: '/eventos/radiock-fest-vol-5.webp',
    bandas: ['Morfina', 'Cadejo', 'Infortunio', 'Inside Joke', 'Antarex', 'Daire', 'Westwolf', 'Oblivion'],
  },
  {
    id: 'radiock-fest-vol-6',
    titulo: 'Radiock Fest Vol. 6',
    fecha: '2026-12-05',
    hora: '17:00',
    venue: 'Border Psycho Cantina · Av. Revolución 821, Zona Centro',
    ciudad: 'Tijuana, B.C.',
    cartel: '/eventos/cartel-radiock-fest-vol-6.webp',
    cartelMedidas: { ancho: 1080, alto: 1080 },
    miniatura: '/eventos/radiock-fest-vol-6.webp',
    bandas: ['Daz Fontana', 'Efecto Espiral', 'Cuarta Coordenada', 'Oblivion', 'Querida Hayley', 'Rick Hartbroke'],
  },
];
