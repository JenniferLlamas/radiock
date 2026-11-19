import plugin from 'tailwindcss/plugin';

/**
 * Componentes base registrados en Tailwind. Al ser clases de Tailwind se pueden componer
 * con `@apply` desde el CSS de cualquier funcionalidad, para que el marcado lleve una sola
 * clase con significado:
 *
 *   .about { @apply section shell; … }      →  <section class="about">
 *   .button-primary { @apply button; … }    →  <a class="button-primary">
 *
 * `@apply` copia también los :hover y los @media del componente. Las declaraciones propias
 * de la clase van después, así que pueden sobrescribir lo que heredan.
 * Si una clase se usa tal cual en el marcado (`class="shell"`), Tailwind la emite en
 * `@layer global` (ver tailwind.css).
 */
export const componentesRadiock = plugin(({ addComponents, theme }) => {
  const tablet = `@media (max-width: ${theme('screens.tablet.max')})`;
  const movil = `@media (max-width: ${theme('screens.movil.max')})`;

  addComponents({
    /** Contenedor centrado con márgenes laterales. */
    '.shell': {
      width: 'min(1320px,calc(100% - 112px))',
      marginInline: 'auto',
      [tablet]: { width: 'calc(100% - 64px)' },
      [movil]: { width: 'calc(100% - 40px)' },
    },
    /** Espaciado vertical de una sección de la página. */
    '.section': {
      paddingBlock: '110px',
      [tablet]: { paddingBlock: '80px' },
      [movil]: { paddingBlock: '66px' },
    },
    /** Forma y movimiento de un botón; el color lo pone cada variante (.button-primary…). */
    '.button': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '28px',
      minHeight: '52px',
      padding: '14px 22px',
      fontSize: '.875rem',
      fontWeight: '700',
      border: '1px solid transparent',
      lineHeight: '1.4',
      transition: 'background .2s,transform .2s',
      '&:hover': { transform: 'translateY(-3px)' },
      '@media (prefers-reduced-motion: reduce)': { '&:hover': { transform: 'none' } },
    },
  });
});
