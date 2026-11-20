import { FOTOS_INICIALES, TEXTOS_GALERIA } from '../constants/galeria';

/** Activa la galería de bandas dentro de `raiz`: filtro por banda, "Ver más" y visor ampliado. */
export const useGaleria = (raiz: HTMLElement | null): Galeria | null => Galeria.montar(raiz);

/**
 * Sin JavaScript se ven todas las fotos y cada una abre su versión grande en otra pestaña.
 * Con JavaScript se muestran las primeras FOTOS_INICIALES, se puede filtrar por banda y cada
 * foto se abre en un <dialog> con flechas para recorrer las fotos visibles.
 *
 * Marcado esperado (GaleriaBandas.astro):
 *   [data-galeria] > [data-galeria-filtros] button[data-banda]
 *                  > [data-galeria-conteo]
 *                  > [data-galeria-lista] > li[data-banda] > a[data-galeria-foto] > img
 *                  > button[data-galeria-mas]
 *                  > dialog[data-galeria-visor] > img, [data-visor-titulo], [data-visor-posicion],
 *                                                 button[data-visor-cerrar], button[data-visor-paso]
 */
export class Galeria {
  private filtro = '';
  private expandida = false;
  private actual = 0;

  private constructor(
    private readonly items: HTMLLIElement[],
    private readonly filtros: HTMLButtonElement[],
    private readonly conteo: HTMLElement | null,
    private readonly mas: HTMLButtonElement | null,
    private readonly visor: HTMLDialogElement | null,
  ) {}

  static montar(raiz: HTMLElement | null): Galeria | null {
    if (!raiz) return null;
    const items = Array.from(raiz.querySelectorAll<HTMLLIElement>('[data-galeria-lista] > li'));
    if (!items.length) return null;
    const instancia = new Galeria(
      items,
      Array.from(raiz.querySelectorAll<HTMLButtonElement>('[data-galeria-filtros] button')),
      raiz.querySelector('[data-galeria-conteo]'),
      raiz.querySelector('[data-galeria-mas]'),
      raiz.querySelector('dialog[data-galeria-visor]'),
    );
    instancia.escuchar();
    instancia.aplicar();
    raiz.querySelector<HTMLElement>('[data-galeria-filtros]')?.removeAttribute('hidden');
    return instancia;
  }

  private escuchar(): void {
    this.filtros.forEach((boton) => boton.addEventListener('click', () => {
      this.filtro = boton.dataset.banda ?? '';
      this.aplicar();
    }));
    this.mas?.addEventListener('click', () => {
      const primeraNueva = this.visibles().length;
      this.expandida = true;
      this.aplicar();
      // El foco pasa a la primera foto nueva para seguir recorriendo con el teclado.
      this.visibles()[primeraNueva]?.querySelector<HTMLElement>('a')?.focus();
    });
    const visor = this.visor;
    if (!visor || typeof visor.showModal !== 'function') return;
    this.items.forEach((item) => item.querySelector('a')?.addEventListener('click', (evento) => {
      evento.preventDefault();
      this.abrir(this.visibles().indexOf(item));
    }));
    visor.querySelector('[data-visor-cerrar]')?.addEventListener('click', () => visor.close());
    visor.querySelectorAll<HTMLButtonElement>('[data-visor-paso]').forEach((boton) =>
      boton.addEventListener('click', () => this.mover(Number(boton.dataset.visorPaso))));
    visor.addEventListener('keydown', (evento) => {
      if (evento.key === 'ArrowRight') this.mover(1);
      if (evento.key === 'ArrowLeft') this.mover(-1);
    });
    // Clic en el fondo (fuera de la foto) cierra el visor.
    visor.addEventListener('click', (evento) => { if (evento.target === visor) visor.close(); });
  }

  /** Fotos que coinciden con el filtro, sin contar el límite de "Ver más". */
  private delFiltro(): HTMLLIElement[] {
    return this.items.filter((item) => !this.filtro || item.dataset.banda === this.filtro);
  }

  private visibles(): HTMLLIElement[] {
    return this.items.filter((item) => !item.hidden);
  }

  private aplicar(): void {
    const coinciden = this.delFiltro();
    const limite = this.filtro || this.expandida ? coinciden.length : FOTOS_INICIALES;
    this.items.forEach((item) => { item.hidden = true; });
    coinciden.slice(0, limite).forEach((item) => { item.hidden = false; });

    this.filtros.forEach((boton) => boton.setAttribute('aria-pressed', String((boton.dataset.banda ?? '') === this.filtro)));
    if (this.mas) {
      const restantes = coinciden.length - limite;
      this.mas.hidden = restantes <= 0;
      this.mas.textContent = TEXTOS_GALERIA.verMas(restantes);
    }
    if (this.conteo) {
      const bandas = new Set(this.items.map((item) => item.dataset.banda)).size;
      const nombre = this.filtros.find((b) => b.dataset.banda === this.filtro)?.textContent?.trim() ?? '';
      this.conteo.textContent = this.filtro
        ? TEXTOS_GALERIA.conteoBanda(coinciden.length, nombre)
        : TEXTOS_GALERIA.conteo(this.items.length, bandas);
    }
  }

  private abrir(indice: number): void {
    if (!this.visor || indice < 0) return;
    this.actual = indice;
    this.mostrar();
    this.visor.showModal();
  }

  private mover(paso: number): void {
    const total = this.visibles().length;
    this.actual = (this.actual + paso + total) % total;
    this.mostrar();
  }

  private mostrar(): void {
    const visibles = this.visibles();
    const enlace = visibles[this.actual]?.querySelector<HTMLAnchorElement>('a');
    const miniatura = enlace?.querySelector('img');
    if (!this.visor || !enlace || !miniatura) return;
    const imagen = this.visor.querySelector<HTMLImageElement>('img');
    if (imagen) {
      imagen.src = enlace.href;
      imagen.alt = miniatura.alt;
      imagen.width = Number(enlace.dataset.ancho) || miniatura.width;
      imagen.height = Number(enlace.dataset.alto) || miniatura.height;
    }
    const titulo = this.visor.querySelector('[data-visor-titulo]');
    if (titulo) titulo.textContent = enlace.dataset.titulo ?? '';
    const posicion = this.visor.querySelector('[data-visor-posicion]');
    if (posicion) posicion.textContent = TEXTOS_GALERIA.posicion(this.actual + 1, visibles.length);
  }
}
