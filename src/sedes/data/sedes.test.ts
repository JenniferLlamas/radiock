import { existsSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { eventos } from '../../eventos/data/eventos';
import { sedes } from './sedes';

/** Para comparar nombres sin importar acentos ni mayúsculas. */
const normal = (texto: string) => texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

describe('datos de sedes', () => {
  it('tienen ids únicos', () => {
    expect(new Set(sedes.map((s) => s.id)).size).toBe(sedes.length);
  });

  it('cada sede tiene su logo en public/sedes/<id>/logo.webp', () => {
    for (const sede of sedes) {
      expect(sede.logo, sede.nombre).toBe(`/sedes/${sede.id}/logo.webp`);
      expect(existsSync(`public${sede.logo}`), sede.logo).toBe(true);
    }
  });

  it('en public/sedes solo hay carpetas de sedes', () => {
    expect(readdirSync('public/sedes').sort()).toEqual(sedes.map((s) => s.id).sort());
  });

  it('cada evento de una sede existe y se hizo en ese lugar', () => {
    for (const sede of sedes) {
      expect(sede.eventos.length, sede.nombre).toBeGreaterThan(0);
      for (const id of sede.eventos) {
        const evento = eventos.find((e) => e.id === id);
        expect(evento, `${sede.nombre}: ${id}`).toBeDefined();
        expect(normal(evento!.venue), id).toContain(normal(sede.nombre.split(' ')[0]));
      }
    }
  });

  it('todo evento ya realizado tiene su sede (sin repetirse)', () => {
    const conSede = sedes.flatMap((s) => s.eventos);
    expect(new Set(conSede).size).toBe(conSede.length);
    const realizados = eventos.filter((e) => e.fecha < '2026-01-01').map((e) => e.id);
    expect(realizados.filter((id) => !conSede.includes(id))).toEqual([]);
  });
});
