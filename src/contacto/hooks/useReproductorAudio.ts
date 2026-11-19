import { MENSAJES_REPRODUCTOR } from '../constants/mensajes';
import { formatoTiempo } from '../helpers/tiempo';

/** Crea un reproductor para la vista previa de una canción; su `elemento` se inserta en la tarjeta. */
export const useReproductorAudio = (url: string, nombre: string): ReproductorAudio => new ReproductorAudio(url, nombre);

/**
 * Reproductor mínimo para escuchar una canción antes de enviarla: reproducir o pausar,
 * barra de avance (también con teclado) y tiempo. Solo suena uno a la vez en la página.
 */
export class ReproductorAudio {
  private static sonando: ReproductorAudio | null = null;

  readonly elemento: HTMLElement;
  private readonly audio: HTMLAudioElement;
  private readonly boton: HTMLButtonElement;
  private readonly barra: HTMLInputElement;
  private readonly reloj: HTMLElement;

  constructor(url: string, nombre: string) {
    this.audio = new Audio();
    this.audio.preload = 'metadata';
    this.audio.src = url;

    this.boton = document.createElement('button');
    this.boton.type = 'button';
    this.boton.className = 'player-toggle';
    this.boton.setAttribute('aria-label', MENSAJES_REPRODUCTOR.escuchar(nombre));

    this.barra = document.createElement('input');
    this.barra.type = 'range';
    this.barra.className = 'player-progress';
    this.barra.min = '0';
    this.barra.max = '1000';
    this.barra.value = '0';
    this.barra.setAttribute('aria-label', MENSAJES_REPRODUCTOR.avance(nombre));

    this.reloj = document.createElement('span');
    this.reloj.className = 'player-time';

    this.elemento = document.createElement('div');
    this.elemento.className = 'player';
    this.elemento.append(this.boton, this.barra, this.reloj);

    this.escuchar();
    this.pintar();
  }

  detener(): void {
    this.audio.pause();
  }

  destruir(): void {
    this.detener();
    this.audio.removeAttribute('src');
    this.audio.load();
    if (ReproductorAudio.sonando === this) ReproductorAudio.sonando = null;
  }

  private escuchar(): void {
    this.boton.addEventListener('click', () => {
      if (this.audio.paused) {
        if (ReproductorAudio.sonando && ReproductorAudio.sonando !== this) ReproductorAudio.sonando.detener();
        ReproductorAudio.sonando = this;
        void this.audio.play().catch(() => this.marcarError());
      } else {
        this.audio.pause();
      }
    });
    this.barra.addEventListener('input', () => {
      if (Number.isFinite(this.audio.duration)) this.audio.currentTime = (Number(this.barra.value) / 1000) * this.audio.duration;
    });
    for (const evento of ['play', 'pause', 'ended', 'timeupdate', 'loadedmetadata']) {
      this.audio.addEventListener(evento, () => this.pintar());
    }
    this.audio.addEventListener('error', () => this.marcarError());
  }

  private pintar(): void {
    const sonando = !this.audio.paused && !this.audio.ended;
    this.boton.textContent = sonando ? '❚❚' : '▶';
    this.boton.setAttribute('aria-pressed', String(sonando));
    this.elemento.classList.toggle('is-playing', sonando);
    const duracion = this.audio.duration;
    if (Number.isFinite(duracion) && duracion > 0) {
      this.barra.value = String(Math.round((this.audio.currentTime / duracion) * 1000));
      this.barra.style.setProperty('--avance', `${(this.audio.currentTime / duracion) * 100}%`);
    }
    this.reloj.textContent = `${formatoTiempo(this.audio.currentTime)} / ${formatoTiempo(duracion)}`;
  }

  /** Archivo que el navegador no puede reproducir (formato o archivo dañado): se puede enviar igual. */
  private marcarError(): void {
    this.elemento.classList.add('is-unplayable');
    this.boton.disabled = true;
    this.barra.disabled = true;
    this.reloj.textContent = MENSAJES_REPRODUCTOR.sinVistaPrevia;
  }
}
