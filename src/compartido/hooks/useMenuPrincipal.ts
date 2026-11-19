import { CONSULTA_ESCRITORIO, DESPLAZAMIENTO_COMPACTO_PX } from '../constants/interfaz';

/** Activa el menú principal dentro del encabezado indicado. */
export const useMenuPrincipal = (encabezado: HTMLElement | null): MenuPrincipal | null =>
  MenuPrincipal.montar(encabezado);

/**
 * Comportamiento del encabezado: menú móvil accesible y estado compacto al desplazarse.
 * Se cierra con Escape, al elegir un enlace, al hacer clic fuera o al pasar a escritorio.
 */
export class MenuPrincipal {
  private constructor(
    private readonly encabezado: HTMLElement,
    private readonly boton: HTMLButtonElement,
    private readonly menu: HTMLElement,
  ) {}

  static montar(encabezado: HTMLElement | null): MenuPrincipal | null {
    const boton = encabezado?.querySelector<HTMLButtonElement>('[data-menu-boton]');
    const menu = encabezado?.querySelector<HTMLElement>('[data-menu-enlaces]');
    if (!encabezado || !boton || !menu) return null;
    const instancia = new MenuPrincipal(encabezado, boton, menu);
    instancia.escuchar();
    return instancia;
  }

  get abierto(): boolean {
    return this.boton.getAttribute('aria-expanded') === 'true';
  }

  alternar(abrir = !this.abierto): void {
    this.boton.setAttribute('aria-expanded', String(abrir));
    this.boton.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
    this.encabezado.classList.toggle('menu-open', abrir);
  }

  cerrar(): void {
    this.alternar(false);
  }

  private escuchar(): void {
    this.boton.addEventListener('click', () => this.alternar());
    this.menu.querySelectorAll('a').forEach((enlace) => enlace.addEventListener('click', () => this.cerrar()));
    document.addEventListener('keydown', (evento) => {
      if (evento.key !== 'Escape' || !this.abierto) return;
      this.cerrar();
      this.boton.focus();
    });
    document.addEventListener('click', (evento) => {
      if (evento.target instanceof Node && !this.encabezado.contains(evento.target)) this.cerrar();
    });
    window.matchMedia(CONSULTA_ESCRITORIO).addEventListener('change', () => this.cerrar());

    const compactar = () =>
      this.encabezado.classList.toggle('scrolled', window.scrollY > DESPLAZAMIENTO_COMPACTO_PX);
    window.addEventListener('scroll', compactar, { passive: true });
    compactar();
  }
}
