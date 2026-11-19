/** Formato mm:ss; "--:--" si la duración aún no se conoce. */
export const formatoTiempo = (segundos: number): string => {
  if (!Number.isFinite(segundos)) return '--:--';
  const s = Math.floor(segundos);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
