import type { Banda } from '../domain/Banda';

// Nombres y participación respaldados por el cartel Radiock Fest Vol. 1.
// Completar ciudad, género y redes con información confirmada de cada banda.
export const bandas: readonly Banda[] = [
  { id: 'bailarina', nombre: 'Bailarina Sin Cabeza', logo: '/bandas/bailarina/logo2.png', redes: [
    { nombre: 'Facebook', url: 'https://www.facebook.com/bailarina.sin.cabeza' },
    { nombre: 'Instagram', url: 'https://www.instagram.com/bailarina.sin.cabeza/' },
  ] },
  { id: 'infortunio', nombre: 'Infortunio', logo: '/bandas/infortunio/logo.png', redes: [] },
  { id: 'bluesfire', nombre: 'Bluesfire', logo: '/bandas/bluesfire/logo.png', redes: [] },
  { id: 'jumpingbeans', nombre: 'Jumping Beans', logo: '/bandas/jumpingbeans/logo.png', redes: [
    { nombre: 'Instagram', url: 'https://www.instagram.com/losjumpingbeans/' },
  ] },
  { id: 'oblivion', nombre: 'Oblivion', logo: '/bandas/oblivion/logo.png', redes: [
    { nombre: 'Facebook', url: 'https://www.facebook.com/OblivionTj' },
    { nombre: 'Instagram', url: 'https://www.instagram.com/oblivion_tj/' },
  ] },
  { id: 'stridulus', nombre: 'Stridulus', logo: '/bandas/stridulus/logo.png', redes: [
    { nombre: 'Facebook', url: 'https://www.facebook.com/Stridulus' },
    { nombre: 'Instagram', url: 'https://www.instagram.com/stridulustj/' },
  ] },
];
