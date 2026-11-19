import { defineConfig } from 'astro/config';

import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  // El preflight se importa a mano en una capa de cascada: src/compartido/styles/tailwind.css
  integrations: [tailwind({ applyBaseStyles: false })],
  // La antigua ruta única del festival sigue funcionando para enlaces ya compartidos.
  redirects: {
    '/evento': '/eventos/radiock-fest-vol-1',
  },
});
