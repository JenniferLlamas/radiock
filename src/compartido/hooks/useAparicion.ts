import { CLASE_APARECIDO, SELECTOR_APARICION, UMBRAL_APARICION } from '../constants/interfaz';
import { prefiereMovimientoReducido } from '../helpers/preferencias';

/**
 * Añade la clase `revealed` a cada `[data-reveal]` cuando entra en pantalla.
 * Si no hay soporte o se pide menos movimiento, el contenido sigue visible sin animación.
 */
export function useAparicion(selector = SELECTOR_APARICION, umbral = UMBRAL_APARICION): void {
  if (prefiereMovimientoReducido() || !('IntersectionObserver' in window)) return;
  const observador = new IntersectionObserver((entradas) => {
    for (const entrada of entradas) {
      if (!entrada.isIntersecting) continue;
      entrada.target.classList.add(CLASE_APARECIDO);
      observador.unobserve(entrada.target);
    }
  }, { threshold: umbral });
  document.querySelectorAll(selector).forEach((elemento) => observador.observe(elemento));
}
