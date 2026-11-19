import { MENSAJES_COPIA } from '../constants/mensajes';
import type { Portapapeles } from '../domain/Portapapeles';
import { componerPresentacion } from '../helpers/componerPresentacion';
import { validarObligatorios } from '../helpers/validarObligatorios';
import { portapapelesNavegador } from '../services/portapapeles';

/** Activa el formulario sin backend (mensaje para redes) dentro de `raiz`. */
export const useFormularioPresentacion = (raiz: HTMLElement | null, portapapeles?: Portapapeles): FormularioPresentacion | null =>
  FormularioPresentacion.montar(raiz, portapapeles);

/**
 * Controlador del formulario sin backend: valida, muestra la vista previa y copia el
 * mensaje para enviarlo por redes. Se usa mientras no haya URL de registro configurada
 * (ver FormularioRegistro). No envía ni guarda datos.
 */
export class FormularioPresentacion {
  private constructor(
    private readonly formulario: HTMLFormElement,
    private readonly vistaPrevia: HTMLElement,
    private readonly encabezadoVista: HTMLElement | null,
    private readonly mensaje: HTMLTextAreaElement,
    private readonly botonCopiar: HTMLButtonElement | null,
    private readonly estado: HTMLElement | null,
    private readonly portapapeles: Portapapeles,
  ) {}

  static montar(raiz: HTMLElement | null, portapapeles: Portapapeles = portapapelesNavegador): FormularioPresentacion | null {
    const buscar = <T extends Element>(selector: string) => raiz?.querySelector<T>(selector) ?? null;
    const formulario = buscar<HTMLFormElement>('[data-presentacion-formulario]');
    const campos = buscar<HTMLFieldSetElement>('[data-presentacion-campos]');
    const vistaPrevia = buscar<HTMLElement>('[data-presentacion-vista]');
    const mensaje = buscar<HTMLTextAreaElement>('[data-presentacion-mensaje]');
    if (!formulario || !campos || !vistaPrevia || !mensaje) return null;

    const instancia = new FormularioPresentacion(
      formulario, vistaPrevia,
      buscar('[data-presentacion-encabezado]'), mensaje,
      buscar('[data-presentacion-copiar]'), buscar('[data-presentacion-estado]'),
      portapapeles,
    );
    instancia.escuchar();
    // Sin JavaScript los campos quedan desactivados: no habría forma de usar el mensaje.
    campos.disabled = false;
    return instancia;
  }

  private escuchar(): void {
    validarObligatorios(this.formulario);
    this.formulario.addEventListener('submit', (evento) => {
      evento.preventDefault();
      this.prepararMensaje();
    });
    // Evita mostrar una presentación desactualizada cuando se editan los datos.
    this.formulario.addEventListener('input', () => { this.vistaPrevia.hidden = true; });
    this.botonCopiar?.addEventListener('click', () => this.copiar());
  }

  private prepararMensaje(): void {
    const datos = new FormData(this.formulario);
    this.mensaje.value = componerPresentacion((nombre) => datos.get(nombre)?.toString());
    this.vistaPrevia.hidden = false;
    this.informar('');
    this.encabezadoVista?.focus();
  }

  private async copiar(): Promise<void> {
    try {
      await this.portapapeles.copiar(this.mensaje.value);
      this.informar(MENSAJES_COPIA.copiado);
    } catch {
      this.mensaje.focus();
      this.mensaje.select();
      this.informar(MENSAJES_COPIA.seleccionado);
    }
  }

  private informar(texto: string): void {
    if (this.estado) this.estado.textContent = texto;
  }
}
