export interface Evento {
  id: string;
  titulo: string;
  fecha: string;
  hora?: string;
  venue: string;
  ciudad: string;
  cartel: string;
  miniatura?: string;
  bandas: string[];
  detalles: string;
}
// Sin próximos eventos confirmados. Agregar aquí los datos reales al anunciarlos.
// Fecha ISO YYYY-MM-DD; detalles debe ser una ruta existente o una URL oficial.
export const proximosEventos: Evento[] = [];
// Datos recuperados del cartel y de las secciones originales del proyecto.
export const primerFest: Evento = {
  id: 'radiock-fest-vol-1', titulo: 'Radiock Fest Vol. 1', fecha: '2024-08-10',
  hora: '19:00', venue: 'República de Hops · Pasaje Revolución', ciudad: 'Tijuana, B.C.',
  cartel: '/eventos/cartel-radiock-fest-vol-1.webp',
  miniatura: '/eventos/radiock-fest-vol-1.jpg',
  bandas: ['Bluesfire', 'Bailarina Sin Cabeza', 'Jumping Beans', 'Oblivion', 'Infortunio', 'Stridulus'],
  detalles: '/evento',
};
export const eventosAnteriores: Evento[] = [primerFest];
export const fechaEvento = (fecha: string) => new Intl.DateTimeFormat('es-MX', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
}).format(new Date(fecha + 'T12:00:00Z'));
