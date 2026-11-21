// API pública de la funcionalidad Eventos. Otras funcionalidades y las rutas importan solo desde aquí.
export type { Evento, EstadoEvento } from './domain/Evento';
export { rutaEvento } from './domain/Evento';
export { agendaEventos } from './services/agenda';

export { default as EventosOrganizados } from './ui/EventosOrganizados.astro';
export { default as PaginaEvento } from './ui/PaginaEvento.astro';
export { default as AvisoProximoEvento } from './ui/AvisoProximoEvento.astro';
export { default as BoletoProximoEvento } from './ui/BoletoProximoEvento.astro';
