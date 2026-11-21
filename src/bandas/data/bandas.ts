import type { Banda, FotoBanda } from '../domain/Banda';

/** Foto de public/bandas/<id>/fotos/: versión grande y miniatura para la galería. */
const foto = (id: string, base: string, alt: string, ancho: number, alto: number): FotoBanda => ({
  imagen: `/bandas/${id}/fotos/${base}.webp`,
  miniatura: `/bandas/${id}/fotos/${base}-mini.webp`,
  alt, ancho, alto,
});

// Bandas que han tocado en Radiock Fest (Vol. 1 a Vol. 5), en orden de su primera participación.
// Cada una tiene su carpeta en public/bandas/<id>/ con logo.png y fotos/.
// Completar ciudad, género y redes con información confirmada de cada banda.
export const bandas: readonly Banda[] = [
  { id: 'bailarina', nombre: 'Bailarina Sin Cabeza', logo: '/bandas/bailarina/logo.png', redes: [
    { nombre: 'Facebook', url: 'https://www.facebook.com/bailarina.sin.cabeza' },
    { nombre: 'Instagram', url: 'https://www.instagram.com/bailarina.sin.cabeza/' },
  ], fotos: [
    foto('bailarina', 'bailarina-1', 'Integrantes de Bailarina Sin Cabeza posando en una azotea', 1600, 1200),
    foto('bailarina', 'bailarina-2', 'Bailarina Sin Cabeza en una escalera llena de carteles', 1600, 720),
  ] },
  { id: 'infortunio', nombre: 'Infortunio', logo: '/bandas/infortunio/logo.png', redes: [], fotos: [
    foto('infortunio', 'infortunio-1', 'Integrantes de Infortunio de pie en una calle industrial', 1600, 1087),
    foto('infortunio', 'infortunio-2', 'Retrato de Infortunio junto a un barandal', 1066, 1600),
  ] },
  { id: 'bluesfire', nombre: 'Bluesfire', logo: '/bandas/bluesfire/logo.png', redes: [], fotos: [
    foto('bluesfire', 'bluesfire-1', 'Bluesfire tocando en vivo bajo luces moradas', 1600, 1067),
    foto('bluesfire', 'bluesfire-2', 'Bluesfire en el escenario de República de Hops', 1600, 1067),
  ] },
  { id: 'jumpingbeans', nombre: 'Jumping Beans', logo: '/bandas/jumpingbeans/logo.png', redes: [
    { nombre: 'Instagram', url: 'https://www.instagram.com/losjumpingbeans/' },
  ], fotos: [
    foto('jumpingbeans', 'jumpingbeans-1', 'Jumping Beans posando en el desierto con sus instrumentos', 853, 1280),
    foto('jumpingbeans', 'jumpingbeans-2', 'Baterista de Jumping Beans durante una presentación', 1034, 1293),
  ] },
  { id: 'oblivion', nombre: 'Oblivion', logo: '/bandas/oblivion/logo.png', redes: [
    { nombre: 'Facebook', url: 'https://www.facebook.com/OblivionTj' },
    { nombre: 'Instagram', url: 'https://www.instagram.com/oblivion_tj/' },
  ], fotos: [
    foto('oblivion', 'oblivion-1', 'Oblivion tocando en vivo bajo luces verdes', 1600, 900),
    foto('oblivion', 'oblivion-2', 'Integrantes de Oblivion posando sobre fondo negro', 1600, 881),
  ] },
  { id: 'stridulus', nombre: 'Stridulus', logo: '/bandas/stridulus/logo.png', redes: [
    { nombre: 'Facebook', url: 'https://www.facebook.com/Stridulus' },
    { nombre: 'Instagram', url: 'https://www.instagram.com/stridulustj/' },
  ], fotos: [
    foto('stridulus', 'stridulus-1', 'Baterista de Stridulus en el escenario de República de Hops', 1066, 1600),
    foto('stridulus', 'stridulus-2', 'Vocalista de Stridulus cantando bajo luz azul', 1067, 1600),
  ] },
  { id: 'antarex', nombre: 'Antarex', logo: '/bandas/antarex/logo.png', redes: [], fotos: [
    foto('antarex', 'antarex-1', 'Integrantes de Antarex posando en un bar', 1600, 1200),
    foto('antarex', 'antarex-2', 'Antarex tocando en vivo bajo luces azules y rojas', 1351, 898),
  ] },
  { id: 'eternika', nombre: 'Eternika', logo: '/bandas/eternika/logo.png', redes: [], fotos: [
    foto('eternika', 'eternika-1', 'Eternika tocando en vivo en Sci-Hop Brewing', 960, 960),
    foto('eternika', 'eternika-2', 'Guitarristas de Eternika en el escenario con luz roja', 1600, 1066),
  ] },
  { id: 'volka', nombre: 'Volka', logo: '/bandas/volka/logo.png', redes: [], fotos: [
    foto('volka', 'volka-1', 'Integrantes de Volka posando en un bar', 1600, 1200),
  ] },
  { id: 'westwolf', nombre: 'WestWolf', logo: '/bandas/westwolf/logo.png', redes: [], fotos: [
    foto('westwolf', 'westwolf-1', 'WestWolf tocando en vivo en un bar lleno de bocinas', 1600, 1066),
    foto('westwolf', 'westwolf-2', 'WestWolf en el escenario bajo luz azul', 1600, 900),
  ] },
  { id: 'voces-sin-rostro', nombre: 'Voces Sin Rostro', logo: '/bandas/voces-sin-rostro/logo.png', redes: [], fotos: [
    foto('voces-sin-rostro', 'voces-sin-rostro-1', 'Baterista de Voces Sin Rostro en blanco y negro', 1273, 963),
    foto('voces-sin-rostro', 'voces-sin-rostro-2', 'Bajista de Voces Sin Rostro en blanco y negro', 1260, 1600),
  ] },
  { id: 'instinto-animal', nombre: 'Instinto Animal', logo: '/bandas/instinto-animal/logo.png', redes: [], fotos: [
    foto('instinto-animal', 'instinto-animal-1', 'Integrantes de Instinto Animal frente a una pared de guitarras', 1600, 1067),
    foto('instinto-animal', 'instinto-animal-2', 'Instinto Animal en una sesión de fotos con guitarras', 1595, 1600),
  ] },
  { id: 'the-aprils', nombre: 'The Aprils', logo: '/bandas/the-aprils/logo.png', redes: [], fotos: [
    foto('the-aprils', 'the-aprils-1', 'Integrantes de The Aprils en blanco y negro', 1280, 960),
    foto('the-aprils', 'the-aprils-2', 'The Aprils sentados junto a un amplificador', 1280, 960),
  ] },
  { id: 'euphoric-forms', nombre: 'Euphoric Forms', logo: '/bandas/euphoric-forms/logo.png', redes: [], fotos: [
    foto('euphoric-forms', 'euphoric-forms-1', 'Integrantes de Euphoric Forms en el desierto', 890, 1338),
  ] },
  { id: 'inside-joke', nombre: 'Inside Joke', logo: '/bandas/inside-joke/logo.png', redes: [], fotos: [
    foto('inside-joke', 'inside-joke-1', 'Integrantes de Inside Joke con lentes oscuros sobre fondo blanco', 1600, 1063),
  ] },
  { id: 'morfina', nombre: 'Morfina', logo: '/bandas/morfina/logo.png', redes: [], fotos: [
    foto('morfina', 'morfina-1', 'Morfina tocando en vivo bajo luces verdes', 1600, 900),
    foto('morfina', 'morfina-2', 'Integrantes de Morfina posando bajo luces de colores', 1500, 842),
  ] },
  { id: 'cadejo', nombre: 'Cadejo', logo: '/bandas/cadejo/logo.png', redes: [], fotos: [
    foto('cadejo', 'cadejo-1', 'Cadejo tocando en vivo frente a un mural', 1600, 1067),
  ] },
  { id: 'daire', nombre: 'Daire', logo: '/bandas/daire/logo.png', redes: [], fotos: [
    foto('daire', 'daire-1', 'Integrantes de Daire en un foro', 1080, 729),
  ] },
];
