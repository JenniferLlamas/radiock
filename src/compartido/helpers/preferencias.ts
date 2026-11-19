import { CONSULTA_MOVIMIENTO_REDUCIDO } from '../constants/interfaz';

/** Preferencia del sistema de reducir el movimiento; se consulta en vivo porque puede cambiar. */
export const consultaMovimientoReducido = (): MediaQueryList =>
  window.matchMedia(CONSULTA_MOVIMIENTO_REDUCIDO);

export const prefiereMovimientoReducido = (): boolean => consultaMovimientoReducido().matches;

/** Desplazamiento instantáneo cuando se pide menos movimiento, suave en otro caso. */
export const comportamientoDesplazamiento = (): ScrollBehavior =>
  prefiereMovimientoReducido() ? 'instant' : 'smooth';
