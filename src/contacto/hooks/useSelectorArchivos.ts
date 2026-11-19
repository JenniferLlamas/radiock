import { archivosPresentacion } from '../data/archivosPresentacion';
import type { ReglaArchivos } from '../domain/ReglaArchivos';
import { validarArchivo } from '../domain/validacionArchivos';
import { huellaArchivo, pesoLegible } from '../helpers/archivos';
import { useReproductorAudio, type ReproductorAudio } from './useReproductorAudio';

interface Elegido {
  readonly archivo: File;
  readonly url: string;
  readonly reproductor?: ReproductorAudio;
}

/** Mejora cada sección de material dentro de `contenedor`. Se llama antes que useFormularioRegistro. */
export const useSelectoresArchivos = (contenedor: ParentNode): SelectorArchivos[] => SelectorArchivos.montarTodos(contenedor);

/**
 * Mejora un <input type="file"> con zona para arrastrar, vistas previas y botón para quitar.
 * La lista de archivos se mantiene aquí y se copia al input real con DataTransfer, así que el
 * formulario y el envío siguen leyendo `input.files` sin saber que existe este componente.
 * Los archivos inválidos o por encima del máximo se rechazan al agregarlos, con un aviso.
 *
 * Marcado esperado (CampoArchivo.astro):
 *   [data-selector-archivos]  > [data-zona] > input[type=file]
 *                             > [data-contador]  [data-mensaje]  [data-lista]
 */
export class SelectorArchivos {
  private elegidos: Elegido[] = [];
  private sincronizando = false;

  private constructor(
    private readonly raiz: HTMLElement,
    private readonly entrada: HTMLInputElement,
    private readonly zona: HTMLElement,
    private readonly lista: HTMLElement,
    private readonly contador: HTMLElement | null,
    private readonly mensaje: HTMLElement | null,
    private readonly regla: ReglaArchivos,
  ) {}

  /** Monta un selector por cada sección. Si el navegador no permite editar la lista, deja el input nativo. */
  static montarTodos(contenedor: ParentNode): SelectorArchivos[] {
    if (!SelectorArchivos.compatible()) return [];
    return Array.from(contenedor.querySelectorAll<HTMLElement>('[data-selector-archivos]'))
      .map((raiz) => SelectorArchivos.montar(raiz))
      .filter((selector): selector is SelectorArchivos => selector !== null);
  }

  static montar(raiz: HTMLElement): SelectorArchivos | null {
    const entrada = raiz.querySelector<HTMLInputElement>('input[type="file"]');
    const zona = raiz.querySelector<HTMLElement>('[data-zona]');
    const lista = raiz.querySelector<HTMLElement>('[data-lista]');
    const regla = archivosPresentacion.find((r) => r.nombre === entrada?.name);
    if (!entrada || !zona || !lista || !regla) return null;
    const selector = new SelectorArchivos(raiz, entrada, zona, lista,
      raiz.querySelector('[data-contador]'), raiz.querySelector('[data-mensaje]'), regla);
    selector.escuchar();
    raiz.classList.add('is-enhanced');
    selector.pintarContador();
    return selector;
  }

  private static compatible(): boolean {
    try {
      new DataTransfer().items.add(new File([''], 'prueba.txt'));
      return true;
    } catch {
      return false;
    }
  }

  private escuchar(): void {
    // Se registra antes que el controlador del formulario: detiene el "change" nativo (que trae
    // solo la nueva selección) y emite uno propio cuando la lista combinada ya está en el input.
    this.entrada.addEventListener('change', (evento) => {
      if (this.sincronizando) return;
      evento.stopImmediatePropagation();
      this.agregar(Array.from(this.entrada.files ?? []));
    });

    for (const tipo of ['dragenter', 'dragover']) {
      this.zona.addEventListener(tipo, (evento) => {
        evento.preventDefault();
        this.zona.classList.add('is-dragging');
      });
    }
    for (const tipo of ['dragleave', 'dragend']) {
      this.zona.addEventListener(tipo, (evento) => {
        if (evento instanceof DragEvent && this.zona.contains(evento.relatedTarget as Node | null)) return;
        this.zona.classList.remove('is-dragging');
      });
    }
    this.zona.addEventListener('drop', (evento) => {
      evento.preventDefault();
      this.zona.classList.remove('is-dragging');
      this.agregar(Array.from(evento.dataTransfer?.files ?? []));
    });

    // form.reset() (tras un envío correcto) vacía el input; aquí se vacía la lista.
    this.entrada.form?.addEventListener('reset', () => {
      this.elegidos.forEach((elegido) => this.liberar(elegido));
      this.elegidos = [];
      this.lista.replaceChildren();
      this.avisar('');
      queueMicrotask(() => this.pintarContador());
    });
  }

  private agregar(nuevos: File[]): void {
    const avisos: string[] = [];
    const yaEstan = new Set(this.elegidos.map(({ archivo }) => huellaArchivo(archivo)));
    for (const archivo of nuevos) {
      if (yaEstan.has(huellaArchivo(archivo))) continue;
      const error = validarArchivo({ nombre: archivo.name, tipo: archivo.type, tamano: archivo.size }, this.regla);
      if (error) { avisos.push(error); continue; }
      if (this.elegidos.length >= this.regla.maximo) {
        avisos.push(`${this.regla.etiqueta}: máximo ${this.regla.maximo}; "${archivo.name}" no se agregó.`);
        continue;
      }
      const elegido = this.crear(archivo);
      this.elegidos.push(elegido);
      yaEstan.add(huellaArchivo(archivo));
      this.lista.append(this.tarjeta(elegido));
    }
    this.avisar(avisos.join(' '));
    this.sincronizar();
  }

  private quitar(elegido: Elegido, tarjeta: HTMLElement): void {
    const indice = this.elegidos.indexOf(elegido);
    this.elegidos = this.elegidos.filter((e) => e !== elegido);
    this.liberar(elegido);
    tarjeta.remove();
    this.avisar(`Se quitó "${elegido.archivo.name}".`);
    this.sincronizar();
    // El foco pasa al botón "quitar" vecino, o a la zona si ya no quedan archivos.
    const siguiente = this.lista.querySelectorAll<HTMLButtonElement>('.file-remove')[Math.min(indice, this.elegidos.length - 1)];
    (siguiente ?? this.entrada).focus();
  }

  /** Copia la lista al input real y avisa al resto del formulario con un "change". */
  private sincronizar(): void {
    const transferencia = new DataTransfer();
    this.elegidos.forEach(({ archivo }) => transferencia.items.add(archivo));
    this.sincronizando = true;
    this.entrada.files = transferencia.files;
    this.entrada.dispatchEvent(new Event('change', { bubbles: true }));
    this.sincronizando = false;
    this.pintarContador();
  }

  private crear(archivo: File): Elegido {
    const url = URL.createObjectURL(archivo);
    return this.regla.vista === 'audio'
      ? { archivo, url, reproductor: useReproductorAudio(url, archivo.name) }
      : { archivo, url };
  }

  private liberar(elegido: Elegido): void {
    elegido.reproductor?.destruir();
    URL.revokeObjectURL(elegido.url);
  }

  private tarjeta(elegido: Elegido): HTMLElement {
    const { archivo } = elegido;
    const tarjeta = document.createElement('li');
    tarjeta.className = `file-card file-card--${this.regla.vista}`;

    if (this.regla.vista === 'audio') {
      const icono = document.createElement('span');
      icono.className = 'file-card-icon';
      icono.setAttribute('aria-hidden', 'true');
      icono.textContent = '♪';
      tarjeta.append(icono);
    } else {
      const marco = document.createElement('div');
      marco.className = 'file-card-thumb';
      const imagen = document.createElement('img');
      imagen.src = elegido.url;
      imagen.alt = `Vista previa de ${archivo.name}`;
      imagen.decoding = 'async';
      marco.append(imagen);
      tarjeta.append(marco);
    }

    const info = document.createElement('div');
    info.className = 'file-card-info';
    const nombre = document.createElement('span');
    nombre.className = 'file-card-name';
    nombre.textContent = archivo.name;
    nombre.title = archivo.name;
    const peso = document.createElement('span');
    peso.className = 'file-card-size';
    peso.textContent = pesoLegible(archivo.size);
    info.append(nombre, peso);
    if (elegido.reproductor) info.append(elegido.reproductor.elemento);
    tarjeta.append(info);

    const quitar = document.createElement('button');
    quitar.type = 'button';
    quitar.className = 'file-remove';
    quitar.setAttribute('aria-label', `Quitar ${archivo.name}`);
    quitar.textContent = '×';
    quitar.addEventListener('click', () => this.quitar(elegido, tarjeta));
    tarjeta.append(quitar);
    return tarjeta;
  }

  private pintarContador(): void {
    const lleno = this.elegidos.length >= this.regla.maximo;
    this.raiz.classList.toggle('is-full', lleno);
    this.raiz.classList.toggle('has-files', this.elegidos.length > 0);
    if (this.contador) this.contador.textContent = `${this.elegidos.length} de ${this.regla.maximo}`;
  }

  private avisar(texto: string): void {
    if (this.mensaje) this.mensaje.textContent = texto;
  }
}
