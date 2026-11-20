/** Fotos visibles antes de pulsar "Ver más" (con el filtro "Todas"). */
export const FOTOS_INICIALES = 12;

export const TEXTOS_GALERIA = {
  todas: 'Todas',
  verMas: (restantes: number) => `Ver ${restantes} fotos más`,
  conteo: (fotos: number, bandas: number) => `${fotos} fotos de ${bandas} bandas`,
  conteoBanda: (fotos: number, banda: string) => `${fotos} ${fotos === 1 ? 'foto' : 'fotos'} de ${banda}`,
  posicion: (actual: number, total: number) => `${actual} de ${total}`,
} as const;
