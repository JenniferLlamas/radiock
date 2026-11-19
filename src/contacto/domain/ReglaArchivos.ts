/** Regla de un tipo de material que la banda puede adjuntar (fotos, logos, canciones). */
export interface ReglaArchivos {
  /** Nombre del campo del formulario y clave que recibe el backend. */
  readonly nombre: 'fotos' | 'logos' | 'canciones';
  /** Título de la sección en el formulario; también nombra la subcarpeta en Drive. */
  readonly etiqueta: string;
  readonly ayuda: string;
  /** Cómo se previsualiza: miniatura recortada, imagen completa sobre cuadrícula o reproductor. */
  readonly vista: 'foto' | 'logo' | 'audio';
  /** Texto principal de la zona para arrastrar archivos. */
  readonly textoZona: string;
  readonly obligatorio: boolean;
  readonly maximo: number;
  readonly maxBytes: number;
  /** Tipos MIME aceptados. */
  readonly tipos: readonly string[];
  /** Extensiones para el selector de archivos del sistema operativo. */
  readonly extensiones: readonly string[];
}

/** Datos de un archivo necesarios para validarlo, sin depender de la API File del navegador. */
export interface ArchivoAdjunto {
  readonly campo: string;
  readonly nombre: string;
  readonly tipo: string;
  readonly tamano: number;
}
