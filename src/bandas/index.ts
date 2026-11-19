// API pública de la funcionalidad Bandas.
export type { Banda } from './domain/Banda';
export { catalogoBandas } from './services/catalogo';

export { default as BandasLocales } from './ui/BandasLocales.astro';
export { default as ConvocatoriaBandas } from './ui/ConvocatoriaBandas.astro';
