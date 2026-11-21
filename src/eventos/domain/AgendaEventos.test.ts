import { describe, expect, it } from 'vitest';
import { RepositorioEnMemoria } from '@/compartido';
import { eventos } from '../data/eventos';
import { AgendaEventos } from './AgendaEventos';
import { estadoEvento, imagenArchivo, medidasCartel, rutaEvento, yaPaso } from './Evento';

const agendaEl = (hoy: string) => new AgendaEventos(new RepositorioEnMemoria(eventos), () => hoy);
const ids = (lista: { id: string }[]) => lista.map((e) => e.id);

describe('AgendaEventos', () => {
  it('antes de Vol. 6, solo Vol. 6 es próximo', () => {
    const agenda = agendaEl('2026-11-20');
    expect(ids(agenda.proximos())).toEqual(['radiock-fest-vol-6']);
    expect(ids(agenda.anteriores())).toEqual(['radiock-fest-vol-1', 'radiock-fest-vol-2', 'radiock-fest-vol-3', 'radiock-fest-vol-4', 'radiock-fest-vol-5']);
  });

  it('el día del evento todavía cuenta como próximo', () => {
    const agenda = agendaEl('2025-04-05');
    expect(ids(agenda.proximos())).toEqual(['radiock-fest-vol-3', 'radiock-fest-vol-4', 'radiock-fest-vol-5', 'radiock-fest-vol-6']);
    expect(ids(agenda.anteriores())).toEqual(['radiock-fest-vol-1', 'radiock-fest-vol-2']);
  });

  it('consulta el reloj en cada llamada (no guarda la fecha)', () => {
    let hoy = '2024-01-01';
    const agenda = new AgendaEventos(new RepositorioEnMemoria(eventos), () => hoy);
    expect(agenda.proximos()).toHaveLength(eventos.length);
    hoy = '2030-01-01';
    expect(agenda.proximos()).toHaveLength(0);
  });
});

describe('Evento', () => {
  it('yaPaso: el día del evento todavía no ha pasado; al día siguiente sí', () => {
    expect(yaPaso('2026-12-05', '2026-12-04')).toBe(false);
    expect(yaPaso('2026-12-05', '2026-12-05')).toBe(false);
    expect(yaPaso('2026-12-05', '2026-12-06')).toBe(true);
  });

  it('medidasCartel: usa las del evento o 1000×1545 por defecto', () => {
    const [vol1] = eventos;
    expect(medidasCartel(vol1)).toEqual({ ancho: 1000, alto: 1545 });
    expect(medidasCartel({ ...vol1, cartelMedidas: { ancho: 1080, alto: 1080 } })).toEqual({ ancho: 1080, alto: 1080 });
  });

  const [vol1] = eventos;
  it('calcula estado, ruta e imagen del archivo', () => {
    expect(estadoEvento(vol1, '2024-08-10')).toBe('proximo');
    expect(estadoEvento(vol1, '2024-08-11')).toBe('finalizado');
    expect(rutaEvento(vol1)).toBe('/eventos/radiock-fest-vol-1');
    expect(imagenArchivo(vol1)).toBe(vol1.miniatura);
    expect(imagenArchivo({ ...vol1, miniatura: undefined })).toBe(vol1.cartel);
  });
});

describe('datos de eventos', () => {
  it('tienen ids únicos, fechas ISO y al menos una banda', () => {
    expect(new Set(ids([...eventos])).size).toBe(eventos.length);
    for (const evento of eventos) {
      expect(evento.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(evento.bandas.length).toBeGreaterThan(0);
    }
  });
});
