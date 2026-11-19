# Backend del registro de bandas (Google Apps Script)

Recibe el formulario "Cuéntanos de tu banda" del sitio y guarda todo en **tu** Google Drive:

- Una **carpeta por registro** (`2026-11-18 20.00 — Nombre de la banda`) con una subcarpeta por tipo de material: `Fotos/`, `Logos/` y `Canciones/`. Solo se crean las subcarpetas de lo que la banda envió.
- Una **fila por registro** en una hoja de cálculo: fecha, datos de la banda, una columna de enlaces por tipo (Fotos, Logos, Canciones) y el enlace a la carpeta.

El script se ejecuta con tu cuenta, así que no hace falta servidor ni pagar hosting. El sitio sigue siendo estático.

## Instalación (una sola vez, unos 10 minutos)

1. **Carpeta.** En Google Drive crea una carpeta, por ejemplo `Radiock / Registros de bandas`. Ábrela y copia el ID de la URL: `https://drive.google.com/drive/folders/`**`ESTE_ES_EL_ID`**.
2. **Hoja.** Crea una hoja de cálculo, por ejemplo `Registros de bandas`, y copia su ID: `https://docs.google.com/spreadsheets/d/`**`ESTE_ES_EL_ID`**`/edit`. La pestaña `Registros` y sus encabezados se crean solos con el primer envío.
3. **Proyecto.** Ve a <https://script.google.com>, crea un **Proyecto nuevo** y llámalo `Radiock – registro de bandas`.
4. **Código.** Borra el contenido de `Código.gs` y pega todo [`Codigo.js`](Codigo.js). En `CONFIG`, reemplaza `PEGAR_AQUI_EL_ID_DE_LA_CARPETA` y `PEGAR_AQUI_EL_ID_DE_LA_HOJA` por los IDs de los pasos 1 y 2.
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

## Actualizar el script

Si cambias `Codigo.js`, pégalo de nuevo y ve a *Implementar → Gestionar implementaciones → ✏️ → Versión: Nueva versión → Implementar*. Así **la URL no cambia**. Si creas una *Nueva implementación*, se genera otra URL y tendrías que actualizar `sitio.ts`.

## Límites y reglas

| | Límite |
| --- | --- |
| Fotos | Hasta 3; JPG, PNG o WebP; 4 MB cada una |
| Logos | Hasta 2; PNG, SVG, JPG o WebP; 4 MB cada uno |
| Canciones | Hasta 3; MP3, M4A, AAC, WAV u OGG; 15 MB cada una |
| Total por envío | 30 MB entre fotos, logos y canciones. Apps Script admite unos 50 MB por petición y el base64 añade un 33 % |

Para cambiar un límite o añadir un tipo de material, edita la misma entrada en `CONFIG.ARCHIVOS` y en `archivosPresentacion.ts`. La subcarpeta y la columna de la hoja toman su nombre de `etiqueta`.

**Si ya tienes una hoja con registros de una versión anterior** (con columnas "Imágenes" y "Audio"), renombra o borra la pestaña `Registros` antes de publicar esta versión. El script creará una nueva con los encabezados correctos; si no, las columnas quedarían desalineadas.

Con 3 audios de 15 MB se superaría el total. En ese caso la banda ve el aviso antes de enviar y conviene que comprima a MP3 (una canción de 4 minutos a 192 kbps pesa unos 6 MB).

Los mismos límites están en el sitio (`src/contacto/data/archivosPresentacion.ts` y `src/contacto/constants/archivos.ts`) y en `CONFIG` de este script. **Si cambias uno, cambia el otro.** Lo mismo con los campos de texto (`src/contacto/data/camposPresentacion.ts` ↔ `CONFIG.CAMPOS`). El navegador valida para avisar rápido a la banda, y el script vuelve a validar todo porque cualquiera puede llamar a la URL directamente.

Para audios más grandes (WAV largos, varias canciones) el siguiente paso es la subida reanudable directa a Drive. Es más compleja; mientras tanto conviene pedir MP3 o un enlace de SoundCloud o Drive en el campo de contacto.

## Seguridad

- La URL `/exec` es pública (va en el código del sitio). Se protege así:
  - **Campo trampa:** los bots que lo rellenan reciben "ok" y no se guarda nada.
  - **Validación en el servidor:** campos obligatorios, longitudes, tipos y tamaños de archivo, y número de archivos.
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
