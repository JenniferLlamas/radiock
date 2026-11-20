import { BYTES_AVISO_ENVIO_LENTO, MAX_BYTES_TOTAL, UMBRAL_MEDIDOR_ALTO } from '../constants/archivos';
import { MENSAJES_REGISTRO } from '../constants/mensajes';
import { registroBanda } from '../data/registros';
import { ErrorRegistro, type ArchivoParaEnviar, type EnvioRegistro } from '../domain/EnvioRegistro';
import type { Registro } from '../domain/Registro';
import type { ArchivoAdjunto } from '../domain/ReglaArchivos';
import { validarArchivos } from '../domain/validacionArchivos';
import { megas, pesoLegible } from '../helpers/archivos';
import { validarObligatorios } from '../helpers/validarObligatorios';

type Estado = 'inicial' | 'enviando' | 'error' | 'enviado';

/** Activa el registro con envío dentro de `raiz`, usando el servicio de envío indicado. */
export const useFormularioRegistro = (raiz: HTMLElement | null, envio: EnvioRegistro, registro: Registro = registroBanda): FormularioRegistro | null =>
  FormularioRegistro.montar(raiz, envio, registro);

/**
 * Controlador del registro con envío: valida datos y archivos, envía mediante el puerto
 * EnvioRegistro y muestra el resultado. No sabe nada de Google: el adaptador se inyecta.
 * Sirve para cualquier Registro (bandas, locales): campos y archivos vienen de `registro`.
 */
export class FormularioRegistro {
  private estadoActual: Estado = 'inicial';

  private constructor(
    private readonly formulario: HTMLFormElement,
    private readonly boton: HTMLButtonElement,
    private readonly estado: HTMLElement,
    private readonly exito: HTMLElement,
    private readonly envio: EnvioRegistro,
    private readonly medidor: HTMLElement | null,
    private readonly registro: Registro,
  ) {}

  static montar(raiz: HTMLElement | null, envio: EnvioRegistro, registro: Registro = registroBanda): FormularioRegistro | null {
    const buscar = <T extends Element>(selector: string) => raiz?.querySelector<T>(selector) ?? null;
    const formulario = buscar<HTMLFormElement>('[data-registro-formulario]');
    const campos = buscar<HTMLFieldSetElement>('[data-registro-campos]');
    const boton = buscar<HTMLButtonElement>('[data-registro-boton]');
    const estado = buscar<HTMLElement>('[data-registro-estado]');
    const exito = buscar<HTMLElement>('[data-registro-exito]');
    if (!formulario || !campos || !boton || !estado || !exito) return null;

    const instancia = new FormularioRegistro(formulario, boton, estado, exito, envio, buscar('[data-registro-medidor]'), registro);
    instancia.escuchar();
    instancia.actualizarMedidor();
    campos.disabled = false;
    return instancia;
  }

  private escuchar(): void {
    validarObligatorios(this.formulario);
    this.entradasArchivo().forEach((entrada) => {
      entrada.addEventListener('change', () => {
        this.validarArchivosDe(entrada);
        this.actualizarMedidor();
      });
    });
    this.formulario.addEventListener('reset', () => setTimeout(() => this.actualizarMedidor()));
    this.formulario.addEventListener('submit', (evento) => {
      evento.preventDefault();
      void this.enviar();
    });
    this.exito.querySelector('[data-registro-otro]')?.addEventListener('click', () => {
      this.exito.hidden = true;
      this.formulario.hidden = false;
      this.cambiarEstado('inicial');
      this.formulario.querySelector<HTMLInputElement>('input:not([tabindex="-1"])')?.focus();
    });
  }

  private entradasArchivo(): HTMLInputElement[] {
    return Array.from(this.formulario.querySelectorAll<HTMLInputElement>('input[type="file"]'));
  }

  private archivos(): ArchivoParaEnviar[] {
    return this.entradasArchivo().flatMap((entrada) =>
      Array.from(entrada.files ?? []).map((archivo) => ({ campo: entrada.name, archivo })));
  }

  private static adjunto({ campo, archivo }: ArchivoParaEnviar): ArchivoAdjunto {
    return { campo, nombre: archivo.name, tipo: archivo.type, tamano: archivo.size };
  }

  /** Marca el campo de archivos como inválido para que el navegador lo señale junto al campo. */
  private validarArchivosDe(entrada: HTMLInputElement, avisar = true): void {
    const regla = this.registro.archivos.filter((r) => r.nombre === entrada.name);
    const propios = this.archivos().filter((a) => a.campo === entrada.name).map(FormularioRegistro.adjunto);
    const [error] = validarArchivos(propios, regla, Number.POSITIVE_INFINITY);
    entrada.setCustomValidity(error ?? '');
    if (error && avisar) entrada.reportValidity();
  }

  private async enviar(): Promise<void> {
    if (this.estadoActual === 'enviando') return;
    this.entradasArchivo().forEach((entrada) => this.validarArchivosDe(entrada, false));
    if (!this.formulario.reportValidity()) return;

    const archivos = this.archivos();
    const errores = validarArchivos(archivos.map(FormularioRegistro.adjunto), this.registro.archivos);
    if (errores.length) {
      this.cambiarEstado('error', errores.join(' '));
      return;
    }

    const datos = new FormData(this.formulario);
    const campos = Object.fromEntries(this.registro.campos.map(({ nombre }) => [nombre, String(datos.get(nombre) ?? '').trim()]));
    const total = archivos.reduce((suma, { archivo }) => suma + archivo.size, 0);
    this.cambiarEstado('enviando', total > BYTES_AVISO_ENVIO_LENTO
      ? MENSAJES_REGISTRO.enviandoArchivos(archivos.length)
      : MENSAJES_REGISTRO.enviando);

    try {
      await this.envio.enviar({ tipo: this.registro.tipo, campos, archivos, sitioWeb: String(datos.get('sitioWeb') ?? '') });
    } catch (error) {
      this.cambiarEstado('error', error instanceof ErrorRegistro
        ? error.message
        : MENSAJES_REGISTRO.errorInesperado);
      return;
    }

    const nombre = this.exito.querySelector('[data-registro-nombre]');
    if (nombre) nombre.textContent = campos[this.registro.campoNombre] ?? '';
    this.formulario.reset();
    this.formulario.hidden = true;
    this.exito.hidden = false;
    this.cambiarEstado('enviado');
    this.exito.querySelector<HTMLElement>('[tabindex="-1"]')?.focus();
  }

  /** Barra "Material: 12.4 MB de 30 MB" para que la banda vea cuánto espacio le queda. */
  private actualizarMedidor(): void {
    if (!this.medidor) return;
    const total = this.archivos().reduce((suma, { archivo }) => suma + archivo.size, 0);
    const uso = Math.min(1, total / MAX_BYTES_TOTAL);
    this.medidor.style.setProperty('--uso', String(uso));
    this.medidor.dataset.nivel = total > MAX_BYTES_TOTAL ? 'excedido' : uso >= UMBRAL_MEDIDOR_ALTO ? 'alto' : 'normal';
    const texto = this.medidor.querySelector('[data-registro-medidor-texto]');
    if (texto) texto.textContent = `${total ? pesoLegible(total) : '0 MB'} de ${megas(MAX_BYTES_TOTAL)}`;
  }

  private cambiarEstado(estado: Estado, mensaje = ''): void {
    this.estadoActual = estado;
    const enviando = estado === 'enviando';
    this.boton.disabled = enviando;
    this.formulario.setAttribute('aria-busy', String(enviando));
    this.estado.dataset.estado = estado;
    this.estado.textContent = mensaje;
  }
}
