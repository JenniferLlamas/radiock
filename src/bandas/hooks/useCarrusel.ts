import { comportamientoDesplazamiento, consultaMovimientoReducido } from '@/compartido';
import { AvanceAutomatico } from '../helpers/AvanceAutomatico';
import { ESPERA_DESPLAZAMIENTO_MS, TOLERANCIA_PX, UMBRAL_VISIBILIDAD } from '../constants/carrusel';

/** Activa el carrusel dentro de `raiz`. Sin JavaScript queda como lista desplazable. */
export const useCarrusel = (raiz: HTMLElement | null, etiquetas: EtiquetasCarrusel): Carrusel | null =>
  Carrusel.montar(raiz, etiquetas);

export interface EtiquetasCarrusel {
  singular: string;
  plural: string;
}

/**
 * Carrusel horizontal accesible: flechas, teclado, estado anunciado y avance automático.
 * Funciona con cualquier lista de elementos dentro de `[data-carrusel-pista]`.
 *
 * Marcado esperado:
 *   [data-carrusel]
 *     [data-carrusel-pista]            elementos hijos = diapositivas
 *     [data-carrusel-controles] hidden
 *       [data-carrusel-estado]
 *       [data-direccion="-1"] / [data-direccion="1"]
 */
export class Carrusel {
  private readonly elementos: HTMLElement[];
  private readonly anterior: HTMLButtonElement | null;
  private readonly siguiente: HTMLButtonElement | null;
  private readonly estado: HTMLElement | null;
  private readonly avance: AvanceAutomatico;
  private pausado = consultaMovimientoReducido().matches;
  private sobrevolado = false;
  private enPantalla = false;

  private constructor(
    private readonly raiz: HTMLElement,
    private readonly pista: HTMLElement,
    controles: HTMLElement,
    private readonly etiquetas: EtiquetasCarrusel,
  ) {
    this.elementos = Array.from(pista.children) as HTMLElement[];
    this.anterior = controles.querySelector('[data-direccion="-1"]');
    this.siguiente = controles.querySelector('[data-direccion="1"]');
    this.estado = controles.querySelector('[data-carrusel-estado]');
    this.avance = new AvanceAutomatico(() => this.avanzarCiclico(), () => this.puedeAvanzar());
  }

  /** Activa el carrusel si el marcado está completo. Sin JavaScript queda como lista desplazable. */
  static montar(raiz: HTMLElement | null, etiquetas: EtiquetasCarrusel): Carrusel | null {
    const pista = raiz?.querySelector<HTMLElement>('[data-carrusel-pista]');
    const controles = raiz?.querySelector<HTMLElement>('[data-carrusel-controles]');
    if (!raiz || !pista || !controles) return null;
    const carrusel = new Carrusel(raiz, pista, controles, etiquetas);
    carrusel.escuchar();
    controles.hidden = false;
    carrusel.actualizarEstado();
    return carrusel;
  }

  mover(direccion: 1 | -1): void {
    const [primero, segundo] = this.elementos;
    const paso = primero && segundo ? segundo.offsetLeft - primero.offsetLeft : this.pista.clientWidth;
    this.pista.scrollBy({ left: direccion * paso, behavior: comportamientoDesplazamiento() });
  }

  private get desplazamientoMaximo(): number {
    return Math.max(0, this.pista.scrollWidth - this.pista.clientWidth);
  }

  private avanzarCiclico(): void {
    if (this.pista.scrollLeft >= this.desplazamientoMaximo - TOLERANCIA_PX) {
      this.pista.scrollTo({ left: 0, behavior: comportamientoDesplazamiento() });
    } else {
      this.mover(1);
    }
  }

  private puedeAvanzar(): boolean {
    return !this.pausado && !this.sobrevolado && !this.raiz.contains(document.activeElement)
      && !document.hidden && this.enPantalla && this.desplazamientoMaximo > TOLERANCIA_PX;
  }

  private sincronizarAvance(): void {
    this.avance.sincronizar();
    // Mientras avanza solo, no se anuncia cada cambio a los lectores de pantalla.
    this.estado?.setAttribute('aria-live', this.avance.activo ? 'off' : 'polite');
  }

  private actualizarEstado(): void {
    const izquierda = this.pista.scrollLeft;
    if (this.anterior) this.anterior.disabled = izquierda <= TOLERANCIA_PX;
    if (this.siguiente) this.siguiente.disabled = izquierda >= this.desplazamientoMaximo - TOLERANCIA_PX;
    if (!this.estado) return;

    const limites = this.pista.getBoundingClientRect();
    const visibles = this.elementos
      .map((elemento, indice) => ({ caja: elemento.getBoundingClientRect(), indice }))
      .filter(({ caja }) => caja.left >= limites.left - TOLERANCIA_PX && caja.right <= limites.right + TOLERANCIA_PX);
    if (!visibles.length) return;

    const total = this.elementos.length;
    const primero = visibles[0].indice + 1;
    const ultimo = visibles[visibles.length - 1].indice + 1;
    const texto = primero === ultimo
      ? `${this.etiquetas.singular} ${primero} de ${total}`
      : `${this.etiquetas.plural} ${primero}–${ultimo} de ${total}`;
    if (this.estado.textContent !== texto) this.estado.textContent = texto;
  }

  private escuchar(): void {
    const sincronizar = () => this.sincronizarAvance();
    const movimientoReducido = consultaMovimientoReducido();

    this.anterior?.addEventListener('click', () => { this.mover(-1); sincronizar(); });
    this.siguiente?.addEventListener('click', () => { this.mover(1); sincronizar(); });
    this.raiz.addEventListener('mouseenter', () => { this.sobrevolado = true; sincronizar(); });
    this.raiz.addEventListener('mouseleave', () => { this.sobrevolado = false; sincronizar(); });
    this.raiz.addEventListener('focusin', sincronizar);
    this.raiz.addEventListener('focusout', () => setTimeout(sincronizar, 0));
    document.addEventListener('visibilitychange', sincronizar);
    movimientoReducido.addEventListener('change', () => { this.pausado = movimientoReducido.matches; sincronizar(); });

    new IntersectionObserver(([entrada]) => {
      this.enPantalla = entrada.isIntersecting;
      sincronizar();
    }, { threshold: UMBRAL_VISIBILIDAD }).observe(this.raiz);

    this.pista.addEventListener('keydown', (evento) => {
      if (evento.target !== this.pista) return;
      if (evento.key !== 'ArrowLeft' && evento.key !== 'ArrowRight') return;
      evento.preventDefault();
      this.mover(evento.key === 'ArrowLeft' ? -1 : 1);
    });

    let espera: ReturnType<typeof setTimeout> | undefined;
    this.pista.addEventListener('scroll', () => {
      clearTimeout(espera);
      espera = setTimeout(() => this.actualizarEstado(), ESPERA_DESPLAZAMIENTO_MS);
    }, { passive: true });

    new ResizeObserver(() => { this.actualizarEstado(); sincronizar(); }).observe(this.pista);
  }
}
