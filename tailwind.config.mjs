import { componentesRadiock } from './src/compartido/styles/componentes.mjs';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		// Breakpoints del sitio (de mayor a menor, porque son max-width).
		// Disponibles como variantes: `@apply tablet:hidden`, `theme('screens.movil.max')`.
		screens: {
			tablet: { max: '1199px' },
			movil: { max: '767px' },
			mini: { max: '359px' },
		},
		extend: {},
	},
	plugins: [componentesRadiock],
	// "static" aparece en el TypeScript (static montar) y generaría una utilidad que nadie usa.
	blocklist: ['static'],
}
