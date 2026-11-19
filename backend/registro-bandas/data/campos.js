/**
 * Campos de texto del registro, en el orden de las columnas de la hoja.
 * Deben coincidir con src/contacto/data/camposPresentacion.ts del sitio.
 */
const CAMPOS = [
  { nombre: 'banda', etiqueta: 'Banda', obligatorio: true, maximo: 120 },
  { nombre: 'ciudad', etiqueta: 'Ciudad', obligatorio: true, maximo: 120 },
  { nombre: 'genero', etiqueta: 'Género', obligatorio: true, maximo: 120 },
  { nombre: 'instagram', etiqueta: 'Instagram', obligatorio: false, maximo: 300 },
  { nombre: 'youtube', etiqueta: 'YouTube', obligatorio: false, maximo: 300 },
  { nombre: 'contacto', etiqueta: 'Contacto', obligatorio: true, maximo: 200 },
];
