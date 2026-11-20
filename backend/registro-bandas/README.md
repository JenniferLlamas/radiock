# Backend del registro de bandas (Google Apps Script)

Recibe el formulario "Cuéntanos de tu banda" del sitio y guarda todo en **tu** Google Drive:

- Una **carpeta por registro** (`2026-11-18 20.00 — Nombre de la banda`) con una subcarpeta por tipo de material: `Fotos/`, `Logos/` y `Canciones/`. Solo se crean las subcarpetas de lo que la banda envió. Cada archivo se guarda con el nombre de la banda, su tipo y un número dentro de su sección, en lugar del nombre original: `Oblivion - Foto 1.jpg`, `Oblivion - Logo 1.png`, `Oblivion - Canción 2.mp3`. La extensión sale del formato del archivo.
- Una **fila por registro** en una hoja de cálculo: fecha, datos de la banda, una columna de enlaces por tipo (Fotos, Logos, Canciones) y el enlace a la carpeta.

El script se ejecuta con tu cuenta, así que no hace falta servidor ni pagar hosting. El sitio sigue siendo estático.

## Instalación (una sola vez, unos 10 minutos)

1. **Carpeta.** En Google Drive crea una carpeta, por ejemplo `Radiock / Registros de bandas`. Ábrela y copia el ID de la URL: `https://drive.google.com/drive/folders/`**`ESTE_ES_EL_ID`**.
2. **Hoja.** Crea una hoja de cálculo, por ejemplo `Registros de bandas`, y copia su ID: `https://docs.google.com/spreadsheets/d/`**`ESTE_ES_EL_ID`**`/edit`. La pestaña `Registros` y sus encabezados se crean solos con el primer envío.
3. **Proyecto.** Ve a <https://script.google.com>, crea un **Proyecto nuevo** y llámalo `Radiock – registro de bandas`.
4. **Código.** El backend está dividido en capas y archivos (ver [Estructura](#estructura)). Súbelos con `clasp` (ver [Subir con clasp](#subir-con-clasp), recomendado) o a mano: en el editor, crea con **＋ → Secuencia de comandos** un archivo por cada `.js`, con su ruta y sin extensión (`constants/configuracion`, `api/webApp`, …), y pega su contenido. Borra el `Código.gs` vacío. En [`constants/configuracion.js`](constants/configuracion.js), reemplaza `PEGAR_AQUI_EL_ID_DE_LA_CARPETA` y `PEGAR_AQUI_EL_ID_DE_LA_HOJA` por los IDs de los pasos 1 y 2.
5. **Manifiesto (recomendado).** En ⚙️ *Configuración del proyecto*, activa *Mostrar el archivo de manifiesto "appsscript.json"* y reemplaza su contenido por [`appsscript.json`](appsscript.json). Así el script pide solo los permisos necesarios (Drive y Hojas de cálculo) y usa la zona horaria de Tijuana.
6. **Publicar.** Menú *Implementar → Nueva implementación → ⚙️ Aplicación web*:
   - *Ejecutar como:* **Yo**.
   - *Quién tiene acceso:* **Cualquier usuario**. Es necesario para que el sitio pueda enviar sin que la banda inicie sesión.
   - Pulsa *Implementar*, autoriza los permisos con tu cuenta y copia la **URL de la aplicación web**, que termina en `/exec`.

   Google mostrará "Google no verificó esta app" porque el script es tuyo y privado. Elige *Configuración avanzada → Ir a Radiock – registro de bandas (no seguro)* y luego *Permitir*.
7. **Probar.** Abre la URL `/exec` en el navegador. Debe responder `{"ok":true,"servicio":"registro-bandas"}`.
8. **Conectar el sitio.** Pega la URL en `src/compartido/constants/sitio.ts`:

   ```ts
   urlRegistro: import.meta.env?.PUBLIC_REGISTRO_URL || 'https://script.google.com/macros/s/…/exec',
   ```

   Compila (`npm run build`) y publica. El formulario cambiará solo al modo con envío y archivos. Mientras la URL esté vacía, sigue preparando un mensaje para redes, como hasta ahora.

## Estructura

Igual que el sitio, el backend se organiza por **capas**, con los mismos nombres:

```text
backend/registro-bandas/
  constants/
    configuracion.js        IDs de carpeta y hoja, zona horaria, tope por envío, límites contra spam, pausa
    mensajes.js             Respuestas generales para la banda
    formatos.js             Variantes de tipos MIME, extensión de cada formato y referencias permitidas en SVG
  data/
    campos.js               Campos de texto (= src/contacto/data/camposPresentacion.ts)
    archivos.js             Fotos, logos y canciones (= src/contacto/data/archivosPresentacion.ts)
  domain/                   Reglas puras, sin servicios de Google
    validacion.js           Obligatorios, longitudes, formatos, tamaños, cantidades y total
    contenidoArchivos.js    Firma real de cada archivo y revisión de logos SVG
    cupo.js                 Límites de envíos por hora y por día
  helpers/
    texto.js                Nombres seguros, textos sin fórmulas, megas
    bytes.js                Bytes → texto, tipo canónico
    nombresArchivo.js       "Banda - Foto 1.jpg": nombre de cada archivo en Drive
  services/                 Adaptadores de Google
    almacenamiento.js       Drive (carpetas y archivos) y Hojas de cálculo (fila)
    propiedades.js          Propiedades del script: pausa y contadores
    bloqueo.js              LockService para envíos simultáneos
  api/
    webApp.js               doPost y doGet: campo trampa → pausa → validación → cupo → guardado
  pruebas/
    entornoAppsScript.ts    Imitaciones de los servicios de Google para las pruebas
  appsscript.json           Manifiesto: permisos, zona horaria, acceso del Web App
```

| Capa | Puede usar |
| --- | --- |
| `constants/`, `data/` | Nada: solo valores |
| `helpers/` | `constants/` |
| `domain/` | `constants/`, `data/`, `helpers/` y otras reglas de `domain/` |
| `services/` | Lo anterior y los servicios de Google |
| `api/` | Todo. Es la única capa que une las reglas con Google |

Lo que normalmente se edita es `constants/configuracion.js` (IDs y límites) y `data/` (campos y archivos, junto con su par del sitio).

En Apps Script todos los archivos de un proyecto comparten el ámbito global: no hay `import`, y una función de un archivo puede llamar a la de otro. Apps Script no garantiza el orden de carga, así que ningún archivo usa otro al cargarse. Por ejemplo, las reglas de validación se arman al recibir cada envío (`reglasRegistro_()`), no al cargar. Una prueba carga los módulos en orden inverso para comprobarlo.

Las pruebas viven junto a su módulo (`domain/cupo.test.ts`, `api/webApp.test.ts`…) y cargan todos los `.js` juntos, como hace Apps Script. Si agregas un archivo `.js`, regístralo en `MODULOS` de `pruebas/entornoAppsScript.ts`; una prueba falla si se te olvida.

## Subir con clasp

[`clasp`](https://github.com/google/clasp) es la herramienta oficial de Google para subir un proyecto de Apps Script desde tu computadora. Evita copiar y pegar cada archivo en cada cambio.

1. Instálalo e inicia sesión con la cuenta dueña del script (se abre el navegador):

   ```bash
   npm install -g @google/clasp
   clasp login
   ```

2. Activa la API en <https://script.google.com/home/usersettings> (*API de Google Apps Script → Activada*).
3. Copia el ID del proyecto: en el editor, ⚙️ *Configuración del proyecto → ID de la secuencia de comandos*.
4. Crea `backend/registro-bandas/.clasp.json` (git lo ignora, porque es de tu cuenta):

   ```json
   { "scriptId": "PEGA_AQUI_EL_ID_DEL_PROYECTO", "rootDir": "." }
   ```

5. Desde `backend/registro-bandas/`, sube el código:

   ```bash
   clasp push
   ```

   Sube todos los `.js` de las capas (como `.gs`, con su carpeta en el nombre: `constants/configuracion`) y `appsscript.json`; [`.claspignore`](.claspignore) deja fuera las pruebas y este README. **`clasp push` reemplaza todos los archivos del proyecto en línea**, así que cualquier cambio hecho solo en el editor web se pierde. Haz los cambios aquí.

## Actualizar el script

Si cambias algún módulo, súbelo de nuevo (`clasp push`, o pegando ese archivo en el editor) y ve a *Implementar → Gestionar implementaciones → ✏️ → Versión: Nueva versión → Implementar*. Así **la URL no cambia**. Si creas una *Nueva implementación*, se genera otra URL y tendrías que actualizar `sitio.ts`.

## Límites y reglas

| | Límite |
| --- | --- |
| Fotos | Hasta 3; JPG, PNG o WebP; 4 MB cada una |
| Logos | Hasta 2; PNG, SVG, JPG o WebP; 4 MB cada uno |
| Canciones | Hasta 3; MP3, M4A, AAC, WAV u OGG; 15 MB cada una |
| Total por envío | 30 MB entre fotos, logos y canciones. Apps Script admite unos 50 MB por petición y el base64 añade un 33 % |

Para cambiar un límite o añadir un tipo de material, edita la misma entrada en `data/archivos.js` y en `archivosPresentacion.ts`. La subcarpeta y la columna de la hoja toman su nombre de `etiqueta`.

**Si ya tienes una hoja con registros de una versión anterior** (con columnas "Imágenes" y "Audio"), renombra o borra la pestaña `Registros` antes de publicar esta versión. El script creará una nueva con los encabezados correctos; si no, las columnas quedarían desalineadas.

Con 3 audios de 15 MB se superaría el total. En ese caso la banda ve el aviso antes de enviar y conviene que comprima a MP3 (una canción de 4 minutos a 192 kbps pesa unos 6 MB).

Los mismos límites están en el sitio (`src/contacto/data/archivosPresentacion.ts` y `src/contacto/constants/archivos.ts`) y en `data/archivos.js` y `constants/configuracion.js` de este script. **Si cambias uno, cambia el otro.** Lo mismo con los campos de texto (`src/contacto/data/camposPresentacion.ts` ↔ `data/campos.js`). El navegador valida para avisar rápido a la banda, y el script vuelve a validar todo porque cualquiera puede llamar a la URL directamente.

Para audios más grandes (WAV largos, varias canciones) el siguiente paso es la subida reanudable directa a Drive. Es más compleja; mientras tanto conviene pedir MP3 o un enlace de SoundCloud o Drive en el campo de contacto.

## Seguridad

- La URL `/exec` es pública (va en el código del sitio). Se protege así:
  - **Campo trampa:** los bots que lo rellenan reciben "ok" y no se guarda nada.
  - **Validación en el servidor:** campos obligatorios, longitudes, tipos y tamaños de archivo, y número de archivos.
  - **Contenido real de cada archivo:** el formato que declara el navegador se puede falsificar, así que el script lee los primeros bytes (la "firma") y comprueba que sea de verdad JPG, PNG, WebP, SVG, MP3, M4A, AAC, WAV u OGG, y de un formato permitido en su sección. Un ejecutable renombrado a `.mp3` o una imagen subida como canción se rechazan. Un PNG con extensión `.jpg` se acepta, porque sigue siendo una imagen permitida.
  - **Logos SVG revisados:** un SVG es texto y puede llevar código que se ejecuta al abrirlo en el navegador. Se rechaza si contiene scripts, eventos (`onload`, `onclick`…), contenido incrustado (`foreignObject`, `iframe`…), enlaces `javascript:`, animaciones que cambian enlaces, entidades XML, estilos importados o cualquier enlace o recurso externo. Se aceptan formas, colores, degradados, texto, estilos internos e imágenes incrustadas en base64, que es lo que exportan Illustrator, Inkscape o Figma para un logo. La banda ve el motivo y la sugerencia de exportarlo como SVG simple o en PNG.
  - **Nombres limpios:** se quitan barras, rutas y caracteres de control de los nombres de archivos y carpetas.
  - **Sin fórmulas:** si un texto empieza con `=`, `+`, `-` o `@`, se le antepone `'` para que no se ejecute en la hoja.
  - **Errores genéricos:** los errores internos se registran en *Ejecuciones* del proyecto y la banda solo ve un mensaje genérico.
  - **Límites de envío** (`CONFIG.LIMITES`), para que nadie llene tu Drive enviando en bucle:

    | Límite | Valor | Por qué |
    | --- | --- | --- |
    | `ENVIOS_POR_HORA` | 15 | Frena ráfagas automáticas |
    | `ENVIOS_POR_DIA` | 60 | Frena el spam lento (también el de registros sin archivos) |
    | `MEGAS_POR_DIA` | 500 | En el peor caso, un ataque sostenido tardaría un mes en llenar 15 GB, y lo notarías antes |

    Son **globales**: Apps Script no conoce la IP de quien envía, así que cuentan todos los envíos juntos. Solo cuentan los registros válidos que se guardan; los rechazados y los del campo trampa no gastan cupo. Al pasar un límite, la banda ve "Recibimos muchos registros en este momento…" y el aviso queda en *Ejecuciones*. Los contadores se guardan en las *Propiedades del script* (claves `limite:…`) y los de horas y días anteriores se borran solos. Si tu convocatoria recibe más registros legítimos, sube los valores y vuelve a implementar.
  - **Interruptor de pausa:** en ⚙️ *Configuración del proyecto → Propiedades del script*, añade `REGISTRO_PAUSADO` con el valor `si`. Desde ese momento se rechazan todos los envíos con un mensaje que invita a escribir por redes. Para reanudar, borra la propiedad. No hace falta volver a implementar.
- Si llega spam: pausa el registro, revisa *Ejecuciones*, borra las filas y carpetas, y considera un captcha (por ejemplo, Cloudflare Turnstile).
- Los archivos quedan **privados** en tu Drive; los enlaces de la hoja solo los abre quien tenga acceso a la carpeta.

## Probar sin desplegar

El sitio admite la variable `PUBLIC_REGISTRO_URL`, que tiene prioridad sobre `sitio.ts`, para apuntar a otro backend sin editar código:

```bash
PUBLIC_REGISTRO_URL=https://script.google.com/macros/s/…/exec npm run dev
```
