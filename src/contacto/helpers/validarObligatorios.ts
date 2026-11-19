import { MENSAJE_OBLIGATORIO } from '../constants/mensajes';

/** Rechaza campos obligatorios que solo contienen espacios, con un mensaje en español. */
export function validarObligatorios(formulario: HTMLFormElement): void {
  formulario.querySelectorAll<HTMLInputElement>('input[required]:not([type="file"])').forEach((entrada) => {
    entrada.addEventListener('input', () => entrada.setCustomValidity(entrada.value.trim() ? '' : MENSAJE_OBLIGATORIO));
  });
}
