# Radiock

Landing de Radiock: un proyecto independiente que crea escenarios para bandas locales con música original.

## Análisis y arquitectura

Se conservan Astro 4.15.8, Tailwind CSS 3 y la arquitectura por funcionalidades. Las rutas `/` y `/evento` siguen siendo adaptadores delgados en `src/pages`. El sitio es estático y no requiere React ni servicios de backend.

La identidad existente combinaba negro, violeta, Montserrat y JetBrains Mono. Había un logo de Radiock, carteles de Radiock Fest, fotografías y logos de seis bandas, vídeos y material de Twitch. Se reutilizaron el logo, las fotografías y los carteles. Las fotos genéricas de la antigua galería no se atribuyen a eventos reales.

```text
src/
  radiock/       # Historia, propósito, raíces, actividades y proceso
  inicio/        # Hero y composición de la landing
  bandas/        # Catálogo, tarjeta y convocatoria
  eventos/       # Agenda, datos y archivo de Radiock Fest
  comunidad/     # Fotografías y momentos de la escena
  contacto/      # Colaboraciones, CTA final y presentación de bandas
  compartido/    # Documento, navegación, footer, estilos y configuración
  pages/         # Rutas de Astro: / y /evento
archivo/oblivion/ # Plantillas preexistentes incompletas, fuera del sitio activo
```

Componentes en PascalCase y español; carpetas por funcionalidad. Datos junto a la funcionalidad que los utiliza. `compartido` conserva la estructura general y la configuración del sitio. No se crean capas vacías ni dependencias entre funcionalidades sin necesidad.

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
| `src/compartido/configuracion.ts` | Nombre, SEO, dominio, correo y redes de Radiock |
| `src/radiock/contenido.ts` | Pilares, actividades y pasos del proceso |
| `src/eventos/eventos.ts` | Próximos eventos, eventos anteriores, fecha ISO, venue, ciudad, bandas, cartel y ruta de detalles |
| `src/bandas/bandas.ts` | Nombre, logo, ciudad, género y redes de cada banda |
| `src/comunidad/momentos.ts` | Fotografías, textos alternativos y pies de foto |

Al agregar un evento, proporcionar una URL de detalles oficial o crear su ruta. Las fechas se formatean en UTC para evitar que cambien de día según la zona horaria. `miniatura` es opcional; si falta, se utiliza el cartel. Las ciudades y géneros de bandas no confirmados se omiten. La participación en el primer festival proviene del cartel existente; las redes de Oblivion proceden de las plantillas originales.

## Contacto sin backend

El formulario recoge banda, ciudad, género, Instagram, Spotify, YouTube y contacto. Valida los campos, prepara un mensaje, permite revisarlo y copiarlo, y ofrece enlaces a Instagram y Facebook. No envía datos, no los guarda y no utiliza localStorage. Cuando el navegador no permite copiar, selecciona el texto para copiarlo manualmente. Sin JavaScript los campos permanecen desactivados y las redes siguen disponibles.

Para recibir solicitudes dentro del sitio en el futuro hará falta integrar un servicio de recepción. No mostrar confirmaciones de envío hasta contar con ese servicio.

## Desarrollo y validación

| Comando | Uso |
| --- | --- |
| `npm install` | Instalar las dependencias del proyecto |
| `npm run dev` | Servidor local de Astro |
| `npm run check` | Diagnósticos y tipos de los componentes Astro y TypeScript |
| `npm run build` | Compilar las dos rutas en `dist/` |
| `npm run preview` | Revisar la compilación localmente |

Se incorporaron únicamente herramientas de desarrollo: `@astrojs/check` y una declaración explícita de TypeScript 5.6.2, que ya estaba instalado. El override del servidor de lenguaje mantiene la comprobación compatible con Node 20.12.0. TypeScript tiene modo estricto y excluye `archivo`, `dist` y dependencias. No existe un script de lint en el proyecto.

Validación de esta entrega: `astro check` sin errores, advertencias ni hints; build de `/` y `/evento`; revisión de 61 referencias locales, IDs únicos, anclas, H1, metadatos, imágenes y enlaces externos. Se revisaron los breakpoints y movimiento reducido por código. **La inspección visual y las interacciones en navegadores desktop/mobile están pendientes: no había navegador conectado a las herramientas de la sesión.**

Antes de la publicación oficial conviene comprobar a 320, 390, 768, 1024, 1440 y 1920 px: ausencia de scroll horizontal, legibilidad, menú con teclado, cierre con Escape, recorrido de CTA, campos obligatorios, generación/copia de mensajes, zoom al 200% y movimiento reducido.

## Información pendiente

- Dominio y correo oficiales. La configuración incluye la URL de la vista privada de Sites.
- URLs oficiales de YouTube/TikTok si existen, y confirmar las redes heredadas.
- Fechas, carteles, venues y carteles de bandas para próximos eventos.
- Ciudad, género y redes confirmadas de cada banda.
- Fotografías de cada evento con autorización de uso y créditos. Las fotos actuales se presentan como archivo de bandas, sin atribuirlas a una fecha específica.
- Servicio de recepción si se desea enviar formularios directamente.

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
