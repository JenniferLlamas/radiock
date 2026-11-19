# Radiock

Landing de Radiock: un proyecto independiente que crea escenarios para bandas locales con música original.

## Análisis y arquitectura

Se conservan Astro 4.15.8 y Tailwind CSS 3. El sitio es estático y no requiere React ni servicios de backend. Las rutas en `src/pages` son adaptadores delgados: `/` y `/eventos/<id>` (una página por evento). `/evento` redirige a Radiock Fest Vol. 1 para conservar los enlaces ya compartidos.

La identidad existente combinaba negro, violeta, Montserrat y JetBrains Mono. Había un logo de Radiock, carteles de Radiock Fest, fotografías y logos de seis bandas, vídeos y material de Twitch. Se reutilizaron el logo, las fotografías y los carteles. Las fotos genéricas de la antigua galería no se atribuyen a eventos reales.

### Screaming Architecture

El primer nivel de `src/` nombra lo que hace el sitio (eventos, bandas, comunidad…), no la tecnología; esas carpetas están en español. Dentro, cada funcionalidad se divide en **capas técnicas en inglés** y solo crea las que necesita:

```text
src/
  eventos/                       # Agenda y archivo de Radiock Fest
    constants/eventos.ts         #   Ruta base /eventos y textos fijos por estado
    data/eventos.ts              #   Lista única de eventos pasados y futuros
    domain/                      #   Evento (estado, ruta) y AgendaEventos
    helpers/textosEvento.ts      #   Títulos, descripción y textos derivados de cada evento
    services/agenda.ts           #   Composición: repositorio + reloj → agendaEventos
    styles/  ui/  index.ts
  bandas/                        # Catálogo, tarjetas, carrusel y convocatoria
    constants/carrusel.ts        #   Intervalo, tolerancias y etiquetas del carrusel
    data/bandas.ts  domain/Banda.ts
    helpers/AvanceAutomatico.ts  #   Temporizador reutilizable
    hooks/useCarrusel.ts         #   Carrusel accesible
    services/catalogo.ts         #   Composición: repositorio de bandas
    styles/  ui/  index.ts
  contacto/                      # Participación, contacto y registro de bandas
    constants/                   #   archivos.ts (límites en MB), mensajes.ts (textos fijos)
    data/                        #   camposPresentacion.ts, archivosPresentacion.ts
    domain/                      #   CampoPresentacion, ReglaArchivos, validacionArchivos, EnvioRegistro, Portapapeles
    helpers/                     #   archivos (peso, base64), componerPresentacion, tiempo, validarObligatorios
    hooks/                       #   useFormularioRegistro, useFormularioPresentacion, useSelectorArchivos, useReproductorAudio
    services/                    #   envioAppsScript, portapapeles
    styles/  ui/  index.ts
  comunidad/                     # Momentos de la escena: data/ domain/ styles/ ui/ index.ts
  radiock/                       # Historia y propósito: data/ domain/ helpers/ styles/ ui/ index.ts
  inicio/                        # Hero y composición de la landing: styles/ ui/ index.ts
  compartido/                    # Núcleo común
    constants/                   #   sitio.ts (SEO, redes, zona horaria, urlRegistro), redesSociales, interfaz, fechas
    data/navegacion.ts           #   Enlaces del menú
    domain/                      #   Repositorio, EnlaceExterno, EnlaceNavegacion, FechaIso
    helpers/                     #   fechas, numeros, redesSociales, rutas, preferencias
    hooks/                       #   useMenuPrincipal, useAparicion
    services/                    #   RepositorioEnMemoria
    styles/                      #   tailwind.css, componentes.mjs (shell, section, button), base.css, encabezado, pie y redes
    ui/                          #   Documento, navegación, footer, lista de redes
    index.ts                     #   API pública en TypeScript puro (sin componentes)
  pages/                         # Rutas de Astro: / y /eventos/[id]
archivo/oblivion/                # Plantillas preexistentes incompletas, fuera del sitio activo
```

| Capa | Qué va ahí | Puede depender de |
| --- | --- | --- |
| `constants/` | Valores fijos: configuración, límites, tiempos, textos fijos | — |
| `domain/` | Tipos, interfaces (puertos) y reglas de negocio puras, sin Astro ni DOM | `constants/`, `data/`, `helpers/`, `@/compartido` |
| `data/` | Contenido y listas editables (arreglos tipados) | `domain/` (tipos), `constants/` |
| `helpers/` | Funciones utilitarias sin estado: formatos, cálculos, utilidades del navegador | `constants/`, `domain/` (tipos) |
| `services/` | Composición e implementaciones concretas: repositorios y adaptadores (Apps Script, portapapeles) | todo lo anterior |
| `hooks/` | `useX()`: conectan comportamiento a un elemento de la página; los llaman los `<script>` | todo lo anterior y `@/compartido/hooks` |
| `ui/` y `styles/` | Componentes `.astro` y su CSS | todo lo anterior y `@/compartido/ui` |
| `index.ts` | API pública de la funcionalidad | — |

**Hooks.** Astro no usa React, así que aquí un *hook* es una función `useX(elemento, …)` que activa un comportamiento sobre el marcado ya renderizado y devuelve su controlador, o `null` si falta el marcado. La lógica vive en una clase dentro del mismo archivo (por ejemplo, `useCarrusel` → `Carrusel`). Las dependencias se inyectan: `useFormularioRegistro(raiz, envioAppsScript(url))`.

### Estilos por funcionalidad

Cada funcionalidad guarda su CSS en su carpeta `styles/`, con un archivo por componente, y cada componente importa el suyo (`import '../styles/tarjeta-banda.css'`). No hay un CSS global de todo el sitio: si una sección se elimina, sus estilos se eliminan con ella.

| Archivo | Contenido |
| --- | --- |
| `compartido/styles/tailwind.css` | Preflight de Tailwind (en capa), componentes y utilidades como `sr-only` |
| `compartido/styles/componentes.mjs` | Plugin de Tailwind con los componentes `shell`, `section` y `button` |
| `compartido/styles/base.css` | Tokens (`--accent`, `--line`…), reset, tipografía y utilidades: `.section-heading`, `.eyebrow`, `.lead`, `.actions`, `.button-primary`/`-outline`/`-dark`/`-dark-outline`, `.text-link`, `.status`, animación de aparición |
| `compartido/styles/{marca,navegacion,pie,redes-sociales}.css` | Encabezado, menú, pie y lista de redes |
| `<funcionalidad>/styles/*.css` | Estilos de cada sección: `bandas/styles/tarjeta-banda.css`, `eventos/styles/detalle-evento.css`, etc. |

El orden lo fijan **capas de cascada**, declaradas en línea en `EstructuraSitio` antes de cualquier `<link>`:

```css
@layer preflight, global, compartido, funcionalidades;
```

Una regla de una capa posterior gana siempre a una anterior, con independencia de la especificidad y del orden en que Vite empaquete los archivos (que no está garantizado entre páginas). Así, una funcionalidad puede ajustar una utilidad global (por ejemplo, el `padding` de `.section`) sin trucos de especificidad.

- Todo archivo nuevo de `styles/` debe ir dentro de `@layer funcionalidades { … }`, o `@layer compartido` si está en `compartido`.
- **Una clase por elemento.** El contenedor (`shell`), el espaciado de sección (`section`) y la forma de botón (`button`) son componentes registrados en Tailwind (`componentes.mjs`). Cada clase propia los compone con `@apply` en lugar de repetirlos en el marcado:

  ```css
  .about { @apply section shell; display:grid; … }   /* <section class="about"> */
  .button-primary { @apply button; background:var(--accent); }   /* <a class="button-primary"> */
  ```

  `@apply` copia también los `:hover` y los `@media` del componente. Las declaraciones propias van después y pueden sobrescribirlos. Para un contenedor sin estilos propios se puede usar `class="shell"` directamente. Los selectores contextuales nombran la variante concreta (`.hero :is(.button-primary,.button-outline)`), porque la clase `button` ya no aparece en el marcado.
- Los breakpoints están en `theme.screens` (`tablet` ≤1199px, `movil` ≤767px, `mini` ≤359px). Se pueden usar como variantes en `@apply` (`@apply movil:hidden`) o con `theme('screens.movil.max')`.
- Cada archivo tiene primero las reglas de escritorio y después sus `@media` en orden descendente: 1199px, 767px y 359px.
- Los tokens de color y tipografía viven solo en `base.css`. Las funcionalidades usan `var(--…)` en lugar de repetir valores.
- No se pueden usar los nombres `base`, `components` ni `utilities` en `@layer`, porque Tailwind los reserva. Tailwind se carga con `applyBaseStyles: false` para poder meter su preflight en una capa; sin capa, ganaría a todos los estilos del sitio.

**Reglas de dependencia.** Entre funcionalidades solo se importa desde `index.ts` (`import { BandasLocales } from '@/bandas'`), nunca archivos internos. `compartido` no importa ninguna funcionalidad. El alias `@/` apunta a `src/` (`tsconfig.json`). Componentes en PascalCase y español.

### SOLID y patrones aplicados

- **Responsabilidad única.** Los datos (`data/`), los valores fijos (`constants/`), las reglas (`domain/`), las utilidades (`helpers/`), las implementaciones (`services/`), el marcado (`ui/`) y el comportamiento (`hooks/`) están separados. El carrusel se divide en `Carrusel` (navegación y estado) y `AvanceAutomatico` (temporizador). El formulario se divide en `componerPresentacion` (texto) y `FormularioPresentacion` (DOM).
- **Abierto/cerrado.** Una red social nueva se añade al registro `nombresRedes`. Un campo del formulario se añade en `camposPresentacion`, que genera tanto el formulario como el mensaje. Un evento se añade a `data/eventos.ts` y obtiene su página y su clasificación sin tocar componentes.
- **Sustitución de Liskov.** Cualquier implementación de `Repositorio<T>` (en memoria hoy; un CMS o Content Collections mañana) funciona igual en `AgendaEventos` y en las bandas.
- **Segregación de interfaces.** Los componentes piden solo lo que muestran (`TarjetaBanda` recibe `Pick<Banda, 'nombre' | 'logo'>`). El núcleo `@/compartido`, la UI `@/compartido/ui` y los hooks `@/compartido/hooks` se importan por separado.
- **Inversión de dependencias.** `AgendaEventos` recibe un `Repositorio` y un `Reloj`. `FormularioPresentacion` recibe un `Portapapeles`. Las implementaciones concretas se conectan solo en las raíces de composición.

Patrones: **Repository** (`RepositorioEnMemoria`), **Facade/API pública** (`index.ts` por funcionalidad), **Composition Root** (`services/agenda.ts`, `services/catalogo.ts`), **Adapter** (`portapapelesNavegador`), **Registry** (redes y campos del formulario) y **Controller** detrás de cada hook `useX()`, que no hace nada si falta el marcado.

## Diseño y comportamiento

- Composición oscura y editorial, acento violeta, títulos grandes y detalles de entradas de conciertos.
- Trece secciones de contenido, más contacto y footer. Historia positiva, centrada en transformación y alianzas.
- Logo original conservado; imágenes locales derivadas a WebP para reducir peso sin reemplazar los originales.
- Navegación móvil con estado expandido accesible, cierre con Escape, al navegar y al hacer clic fuera.
- Estilos para móvil, tablet y escritorio, grids adaptables, estados focus y enlace para saltar al contenido.
- Animaciones de aparición moderadas y respeto de `prefers-reduced-motion`. El contenido sigue visible sin animaciones.
- Documento en español, un H1 por ruta, descripción y Open Graph propios. Canonical y `og:url` usan la URL configurada.
- Próximos eventos sin datos ficticios. Radiock Fest Vol. 1 aparece como evento pasado.
- YouTube y TikTok solo aparecen al configurar una URL real. Se conservan Instagram, Facebook y Twitch existentes.

## Editar información

| Archivo | Contenido editable |
| --- | --- |
| `src/compartido/constants/sitio.ts` | Nombre, SEO, dominio, correo, zona horaria y redes de Radiock |
| `src/compartido/data/navegacion.ts` | Enlaces del menú principal |
| `src/radiock/data/contenido.ts` | Pilares, actividades y pasos del proceso |
| `src/eventos/data/eventos.ts` | Todos los eventos: fecha ISO, hora, venue, ciudad, bandas, cartel y miniatura |
| `src/bandas/data/bandas.ts` | Nombre, logo, ciudad, género y redes de cada banda |
| `src/comunidad/data/momentos.ts` | Fotografías, textos alternativos y pies de foto |
| `src/contacto/data/camposPresentacion.ts` | Campos del formulario de presentación de bandas |
| `src/contacto/data/archivosPresentacion.ts` | Fotos, logos y canciones que se pueden adjuntar: cantidad, formatos y tamaños |
| `src/contacto/constants/archivos.ts` | Límite total por envío (30 MB) |
| `src/contacto/constants/mensajes.ts` | Textos fijos del formulario (saludo, estados del envío, avisos) |

Los eventos pasados y futuros van en la misma lista. La agenda los separa en próximos o anteriores al comparar su fecha con el día actual en `America/Tijuana`; el día del evento todavía cuenta como próximo. Cada evento genera `/eventos/<id>`, con título, descripción y textos derivados de sus datos. Como el sitio es estático, la clasificación se calcula al compilar: después de un evento hay que volver a publicar para que pase al archivo. La compilación falla si una fecha no tiene formato `YYYY-MM-DD` o si un `id` está repetido. Las fechas se formatean en UTC para evitar que cambien de día según la zona horaria. `miniatura` es opcional; si falta, se utiliza el cartel. Las ciudades y géneros de bandas no confirmados se omiten. La participación en el primer festival proviene del cartel existente; las redes de Oblivion proceden de las plantillas originales.

## Registro de bandas

El formulario tiene dos modos y elige uno según `urlRegistro` en `src/compartido/constants/sitio.ts`:

- **Con backend (URL configurada):** la banda llena sus datos y adjunta su material en tres secciones: **Fotos** (hasta 3), **Logos** (hasta 2) y **Canciones** (hasta 3). Todo se envía a un **Google Apps Script** que guarda los archivos en tu Drive, en una carpeta por banda con subcarpetas `Fotos/`, `Logos/` y `Canciones/`, y añade una fila a una hoja de cálculo. Instalación y publicación: [`backend/registro-bandas/README.md`](backend/registro-bandas/README.md).
- **Sin backend (URL vacía):** prepara un mensaje para copiarlo y enviarlo por Instagram o Facebook. No envía ni guarda datos.

En ambos modos, sin JavaScript los campos permanecen desactivados y las redes siguen disponibles.

| Pieza | Archivo |
| --- | --- |
| Campos y material (data) | `src/contacto/data/camposPresentacion.ts`, `archivosPresentacion.ts` |
| Tipos y reglas (domain) | `src/contacto/domain/CampoPresentacion.ts`, `ReglaArchivos.ts`, `validacionArchivos.ts` |
| Puertos y adaptadores | `domain/EnvioRegistro.ts` → `services/envioAppsScript.ts`; `domain/Portapapeles.ts` → `services/portapapeles.ts` |
| Hooks | `hooks/useFormularioRegistro.ts` (con backend), `hooks/useFormularioPresentacion.ts` (mensaje) |
| Zonas de arrastre y vistas previas | `hooks/useSelectorArchivos.ts` (agrega, quita y valida cada archivo, y lo copia al `<input type="file">` real), `hooks/useReproductorAudio.ts` |
| Componentes | `RegistroBanda.astro`, `PresentacionPorMensaje.astro`, `CampoArchivo.astro` (+ `styles/material-banda.css`) |
| Backend | `backend/registro-bandas/Codigo.js`, `appsscript.json` |

El adaptador envía JSON como `text/plain`. Así es una petición CORS "simple", sin preflight, que Apps Script no admite. Para cambiar de backend (por ejemplo, a una función serverless) basta con otro adaptador que implemente `EnvioRegistro`; el formulario no cambia.

## Desarrollo y validación

| Comando | Uso |
| --- | --- |
| `npm install` | Instalar las dependencias del proyecto |
| `npm run dev` | Servidor local de Astro |
| `npm run check` | Diagnósticos y tipos de los componentes Astro y TypeScript |
| `npm run build` | Compilar la landing y una página por evento en `dist/` |
| `npm run preview` | Revisar la compilación localmente |
| `npm test` | Pruebas unitarias (Vitest): lógica, backend y arquitectura; unos 5 s |
| `npm run test:watch` | Pruebas unitarias en modo vigilancia mientras se programa |
| `npm run test:ui` | Pruebas de interfaz (Playwright) en Chrome, escritorio y móvil; unos 3 min |
| `npm run test:ui:reporte` | Abrir el reporte HTML de la última ejecución de `test:ui` |
| `npm run test:todo` | `check` + `test` + `test:ui`: lo recomendado antes de publicar |

Herramientas de desarrollo: `@astrojs/check`, TypeScript 5.6.2 (modo estricto), Vitest 2.1.9 (la línea compatible con Vite 5 de Astro 4), Playwright 1.49.1 y `@types/node` 20. El override del servidor de lenguaje mantiene la comprobación compatible con Node 20.12.0. `npm run check` revisa también los tipos de las pruebas. No existe un script de lint en el proyecto.

### Pruebas

**Unitarias (`npm test`)**: cada prueba vive junto al archivo que prueba (`*.test.ts`), dentro de su funcionalidad. Las pruebas no forman parte del sitio y Tailwind las ignora.

| Archivo | Qué comprueba |
| --- | --- |
| `src/**/*.test.ts` | Agenda de eventos (próximos y anteriores según la fecha), textos de cada evento, fechas y zona horaria, repositorio, validación de fotos, logos y canciones, mensaje para redes y helpers |
| `src/bandas/data/bandas.test.ts` | Ids únicos, logos que existen en `public/`, redes con `https` |
| `backend/registro-bandas/Codigo.test.ts` | El Apps Script ejecutado en Node con imitaciones de Drive y Hojas de cálculo: subcarpetas, filas, validaciones, contenido real de cada archivo (firmas), SVG con código o enlaces externos, campo trampa, límites de envío por hora y por día, pausa, fórmulas y nombres peligrosos. También comprueba que **sus límites coinciden con los del sitio**: si cambias uno y olvidas el otro, falla |
| `tests/unit/arquitectura.test.ts` | Las reglas de capas y funcionalidades de este README. Si un import las rompe, indica el archivo y el import |

**De interfaz (`npm run test:ui`)**: en `tests/e2e/`. Compilan dos versiones del sitio en `.e2e/`, una sin backend y otra con una URL de Apps Script ficticia, y las sirven con `astro preview`. Así se prueba lo mismo que se publica. Usan el Chrome instalado (no descargan navegadores) en dos tamaños: escritorio (1440 px) y móvil (Pixel 7). Una prueba también falla si la página lanza cualquier error de JavaScript.

| Archivo | Qué comprueba |
| --- | --- |
| `navegacion.spec.ts` | Secciones y un solo H1, sin desbordamiento horizontal, menú móvil (Escape, foco, cerrar al navegar), carrusel, página de cada evento con sus textos, redirección `/evento` |
| `registro-mensaje.spec.ts` | Formulario sin backend: obligatorios, mensaje generado, copiar al portapapeles, ocultar al editar |
| `registro-envio.spec.ts` | Registro con archivos: tres secciones, agregar por tandas, duplicados, máximos, quitar con foco, rechazos al agregar, arrastrar y soltar, vista previa de logos SVG y PNG, reproductor, tope de 30 MB, envío con los archivos byte a byte, error del backend con reintento, campo trampa, limpieza al registrar otra banda |

El Apps Script se simula interceptando la red (`tests/e2e/soporte/appsScriptFalso.ts`), así que **las pruebas nunca escriben en tu Drive**. La simulación responde directamente con `200` en lugar de la redirección `302` del servicio real, porque Chrome no sigue una redirección simulada por Playwright entre dominios. Seguir la redirección lo hace el navegador; el formato del envío, el CORS y el manejo de errores sí quedan probados.

Si una prueba de interfaz falla, el reporte (`npm run test:ui:reporte`) incluye una captura y una traza paso a paso. Las pruebas no reemplazan una revisión visual antes de publicar a 320, 768, 1024 y 1920 px, con zoom al 200 % y con movimiento reducido.

## Información pendiente

- Dominio y correo oficiales. La configuración incluye la URL de la vista privada de Sites.
- URLs oficiales de YouTube/TikTok si existen, y confirmar las redes heredadas.
- Fechas, carteles, venues y carteles de bandas para próximos eventos.
- Ciudad, género y redes confirmadas de cada banda.
- Fotografías de cada evento con autorización de uso y créditos. Las fotos actuales se presentan como archivo de bandas, sin atribuirlas a una fecha específica.
- Publicar el Apps Script del registro y pegar su URL en `sitio.urlRegistro` (ver `backend/registro-bandas/README.md`).

## Archivos de esta adaptación

Modificados:

- `src/inicio/PaginaInicio.astro`, `PresentacionRadiock.astro`.
- `src/compartido/EstructuraSitio.astro`, `NavegacionSitio.astro`, `PieSitio.astro`.
- `src/bandas/BandasLocales.astro`, `TarjetaBanda.astro`.
- `src/contacto/FormularioContacto.astro`, `RedesSocialesRadiock.astro`.
- `src/eventos/EventosOrganizados.astro`, `PaginaRadiockFest.astro`, `PortadaRadiockFest.astro`, `GaleriaEvento.astro`.
- `package.json`, `package-lock.json`, `tsconfig.json` y este README.

Creados:

- `src/radiock/QueEsRadiock.astro`, `HistoriaRadiock.astro`, `PropositoRadiock.astro`, `RaicesRadiock.astro`, `ActividadesRadiock.astro`, `ProcesoRadiock.astro` y `contenido.ts`.
- `src/bandas/ConvocatoriaBandas.astro` y `bandas.ts`.
- `src/contacto/InvitacionColaboradores.astro` y `LlamadoFinal.astro`.
- `src/comunidad/ComunidadRadiock.astro` y `momentos.ts`.
- `src/compartido/configuracion.ts` y `estilos.css`.
- `src/eventos/eventos.ts`.
- `public/marca/radiock.webp`, `public/marca/favicon.png`.
- `public/comunidad/bluesfire-en-vivo.webp`, `bailarina-en-vivo.webp`, `jumping-beans-en-vivo.webp`, `stridulus-ensayo.webp`.
- `public/eventos/cartel-radiock-fest-vol-1.webp`.
- `.openai/hosting.json`, configuración de la vista privada de Sites.

Eliminado: `src/transmisiones/InvitacionTwitch.astro`, cuyo horario de streaming dejó de ser el foco del sitio. El enlace a Twitch se conserva en las redes. No se eliminaron imágenes originales ni plantillas de Oblivion.
