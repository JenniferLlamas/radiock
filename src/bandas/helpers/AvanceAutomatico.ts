import { INTERVALO_AVANCE_MS } from '../constants/carrusel';

/**
 * Temporizador que avanza solo mientras la condición lo permite.
 * No conoce el DOM: recibe qué hacer y cuándo puede hacerlo.
 */
export class AvanceAutomatico {
  private temporizador: ReturnType<typeof setInterval> | undefined;

  constructor(
    private readonly avanzar: () => void,
    private readonly puedeAvanzar: () => boolean,
    private readonly intervaloMs = INTERVALO_AVANCE_MS,
  ) {}

  get activo(): boolean {
    return this.temporizador !== undefined;
  }

  /** Reevalúa la condición; reinicia el intervalo si puede avanzar y lo detiene si no. */
  sincronizar(): void {
    clearInterval(this.temporizador);
    this.temporizador = this.puedeAvanzar() ? setInterval(this.avanzar, this.intervaloMs) : undefined;
  }
}
