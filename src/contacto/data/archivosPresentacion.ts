import { MB } from '../constants/archivos';
import type { ReglaArchivos } from '../domain/ReglaArchivos';

/**
 * Material que una banda puede adjuntar al registro, una sección por tipo.
 * Debe coincidir con ARCHIVOS de backend/registro-bandas/data/archivos.js,
 * que vuelve a validar los archivos al recibirlos.
 */
export const archivosPresentacion: readonly ReglaArchivos[] = [
  {
    nombre: 'fotos',
    vista: 'foto',
    textoZona: 'Arrastra tus fotos aquí',
    etiqueta: 'Fotos',
    ayuda: 'Hasta 3 fotos de la banda (en vivo, promocionales o de grupo). JPG, PNG o WebP de 4 MB cada una.',
    obligatorio: false,
    maximo: 3,
    maxBytes: 4 * MB,
    tipos: ['image/jpeg', 'image/png', 'image/webp'],
    extensiones: ['.jpg', '.jpeg', '.png', '.webp'],
  },
  {
    nombre: 'logos',
    vista: 'logo',
    textoZona: 'Arrastra tus logos aquí',
    etiqueta: 'Logos',
    ayuda: 'Hasta 2 versiones del logo (por ejemplo, clara y oscura). PNG con fondo transparente o SVG de preferencia; también JPG o WebP. 4 MB cada uno.',
    obligatorio: false,
    maximo: 2,
    maxBytes: 4 * MB,
    tipos: ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp'],
    extensiones: ['.png', '.svg', '.jpg', '.jpeg', '.webp'],
  },
  {
    nombre: 'canciones',
    vista: 'audio',
    textoZona: 'Arrastra tus canciones aquí',
    etiqueta: 'Canciones',
    ayuda: 'Hasta 3 canciones MP3, M4A, WAV u OGG de 15 MB cada una. Recomendamos MP3.',
    obligatorio: false,
    maximo: 3,
    maxBytes: 15 * MB,
    tipos: ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/ogg'],
    extensiones: ['.mp3', '.m4a', '.aac', '.wav', '.ogg'],
  },
];
