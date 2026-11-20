import { existsSync, readdirSync } from 'node:fs';
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

  it('cada banda tiene su carpeta public/bandas/<id>/ con su logo', () => {
    for (const banda of bandas) expect(banda.logo, banda.nombre).toBe(`/bandas/${banda.id}/logo.png`);
  });

  it('cada foto existe en su carpeta, con miniatura, texto alternativo y medidas', () => {
    for (const banda of bandas) {
      for (const foto of banda.fotos) {
        expect(foto.imagen.startsWith(`/bandas/${banda.id}/fotos/`), foto.imagen).toBe(true);
        expect(existsSync(`public${foto.imagen}`), foto.imagen).toBe(true);
        expect(existsSync(`public${foto.miniatura}`), foto.miniatura).toBe(true);
        expect(foto.alt.length, foto.imagen).toBeGreaterThan(10);
        expect(foto.ancho * foto.alto, foto.imagen).toBeGreaterThan(0);
      }
    }
  });

  it('en public/bandas no hay carpetas ni archivos sueltos fuera de las bandas', () => {
    const ids = bandas.map((b) => b.id).sort();
    expect(readdirSync('public/bandas').sort()).toEqual(ids);
    for (const banda of bandas) {
      const fotos = existsSync(`public/bandas/${banda.id}/fotos`) ? readdirSync(`public/bandas/${banda.id}/fotos`) : [];
      expect(fotos.sort(), banda.id).toEqual(banda.fotos.flatMap((f) => [f.imagen, f.miniatura].map((r) => r.split('/').pop())).sort());
    }
  });
});
