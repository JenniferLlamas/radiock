// Raíz de composición: conecta las abstracciones con sus implementaciones concretas.
// Para leer eventos desde un CMS, se cambia solo el repositorio en este archivo.
import { RepositorioEnMemoria, fechaIsoEn, esFechaIso, sitio } from '@/compartido';
import { AgendaEventos } from '../domain/AgendaEventos';
import { eventos } from '../data/eventos';

for (const evento of eventos) {
  if (!esFechaIso(evento.fecha)) {
    throw new Error(`Fecha inválida en "${evento.id}": "${evento.fecha}". Usa el formato YYYY-MM-DD.`);
  }
}

export const agendaEventos = new AgendaEventos(
  new RepositorioEnMemoria(eventos),
  () => fechaIsoEn(new Date(), sitio.zonaHoraria),
);
