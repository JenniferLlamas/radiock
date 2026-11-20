/**
 * Campos del registro de locales, en el orden de las columnas de la hoja.
 * Deben coincidir con src/contacto/data/camposLocal.ts del sitio.
 */
const CAMPOS = [
  { nombre: 'local', etiqueta: 'Local', obligatorio: true, maximo: 120 },
  { nombre: 'responsable', etiqueta: 'Responsable', obligatorio: true, maximo: 120 },
  { nombre: 'ubicacion', etiqueta: 'Ubicación', obligatorio: true, maximo: 300 },
  { nombre: 'contacto', etiqueta: 'Contacto', obligatorio: true, maximo: 200 },
];
