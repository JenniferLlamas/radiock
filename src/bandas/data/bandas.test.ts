import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bandas } from './bandas';

describe('datos de bandas', () => {
  it('tienen ids únicos', () => {
    expect(new Set(bandas.map((b) => b.id)).size).toBe(bandas.length);
  });

  it('cada logo existe en public/', () => {
    for (const banda of bandas) expect(existsSync(`public${banda.logo}`), banda.logo).toBe(true);
  });

  it('las redes son URLs https', () => {
    for (const red of bandas.flatMap((b) => b.redes)) expect(red.url).toMatch(/^https:\/\//);
  });
});
