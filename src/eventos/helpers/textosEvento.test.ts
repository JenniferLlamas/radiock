import { describe, expect, it } from 'vitest';
import { eventos } from '../data/eventos';
import { lugarCorto, textosEvento } from './textosEvento';

const [vol1, , vol3] = eventos;

describe('textosEvento', () => {
  it('genera los textos de un evento finalizado a partir de sus datos', () => {
    const textos = textosEvento(vol1, 'finalizado');
    expect(textos.tituloPagina).toBe('Radiock Fest Vol. 1 | Radiock');
    expect(textos.descripcion).toBe('El archivo de Radiock Fest Vol. 1: seis bandas de música original reunidas el 10 de agosto de 2024 en República de Hops, Tijuana, B.C.');
    expect(textos.lema).toBe('Seis propuestas originales. Un mismo escenario.');
    expect(textos.estado).toBe('EVENTO FINALIZADO');
    expect(textos.altCartel).toBe('Cartel original de Radiock Fest Vol. 1 con sus seis bandas participantes');
  });

  it('cuenta las bandas de cada cartel y cambia los textos si es próximo', () => {
    const textos = textosEvento(vol3, 'proximo');
    expect(textos.lema.startsWith('Ocho')).toBe(true);
    expect(textos.estado).toBe('PRÓXIMO EVENTO');
    expect(textos.descripcion.startsWith('Radiock Fest Vol. 3: ocho bandas')).toBe(true);
  });

  it('acorta el lugar sin duplicar el punto final', () => {
    expect(lugarCorto({ venue: 'Ranas Bar · Plaza del Zapato', ciudad: 'Tijuana, B.C.' })).toBe('Ranas Bar, Tijuana, B.C');
  });
});
