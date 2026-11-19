import type { FechaIso, Repositorio } from '@/compartido';
import { estadoEvento, ordenarPorFecha, type EstadoEvento, type Evento } from './Evento';

/** Fuente del día actual. Se inyecta para poder fijar la fecha en pruebas o vistas previas. */
export type Reloj = () => FechaIso;

/**
 * Servicio de consulta de eventos. Depende de abstracciones (Repositorio y Reloj),
 * no de un archivo ni de la fecha del sistema, de modo que cualquiera de ellos
 * puede sustituirse sin tocar esta clase ni la interfaz de usuario.
 */
export class AgendaEventos {
  constructor(
    private readonly repositorio: Repositorio<Evento>,
    private readonly hoy: Reloj,
  ) {}

  todos(): readonly Evento[] {
    return this.repositorio.todos();
  }

  porId(id: string): Evento | undefined {
    return this.repositorio.porId(id);
  }

  estado(evento: Evento): EstadoEvento {
    return estadoEvento(evento, this.hoy());
  }

  /** Eventos de hoy en adelante, del más cercano al más lejano. */
  proximos(): Evento[] {
    return this.filtrar('proximo');
  }

  /** Eventos ya realizados, en orden cronológico. */
  anteriores(): Evento[] {
    return this.filtrar('finalizado');
  }

  private filtrar(estado: EstadoEvento): Evento[] {
    const hoy = this.hoy();
    return ordenarPorFecha(this.todos().filter((evento) => estadoEvento(evento, hoy) === estado));
  }
}
