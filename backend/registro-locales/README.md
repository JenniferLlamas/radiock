# Backend del registro de locales (Google Apps Script)

Recibe el formulario "Cuéntanos de tu espacio" del sitio (sección `#espacios`) y guarda una **fila por local** en una hoja de cálculo de **tu** Google Drive: fecha, nombre del local, responsable, ubicación y contacto.

Es un proyecto de Apps Script **aparte** del de bandas ([`../registro-bandas`](../registro-bandas/README.md)): tiene su propia hoja, su propia URL `/exec` y sus propios límites, así que los registros de locales y de bandas nunca se mezclan. No recibe archivos, por eso solo pide permiso para Hojas de cálculo (no para Drive).

## Instalación (una sola vez, unos 5 minutos)

1. **Hoja.** Crea una hoja de cálculo, por ejemplo `Registros de locales`, y copia su ID: `https://docs.google.com/spreadsheets/d/`**`ESTE_ES_EL_ID`**`/edit`. La pestaña `Locales` y sus encabezados se crean solos con el primer envío.
2. **Proyecto.** Ve a <https://script.google.com> y crea un **Proyecto nuevo** (no uses el de bandas). Llámalo `Radiock – registro de locales`.
3. **Código.** Súbelo con `clasp` (ver abajo) o a mano: en el editor, crea con **＋ → Secuencia de comandos** un archivo por cada `.js`, con su ruta y sin extensión (`constants/configuracion`, `api/webApp`, …), y pega su contenido. Borra el `Código.gs` vacío. En [`constants/configuracion.js`](constants/configuracion.js), reemplaza `PEGAR_AQUI_EL_ID_DE_LA_HOJA` por el ID del paso 1.
4. **Manifiesto (recomendado).** En ⚙️ *Configuración del proyecto*, activa *Mostrar el archivo de manifiesto "appsscript.json"* y reemplaza su contenido por [`appsscript.json`](appsscript.json).
5. **Publicar.** *Implementar → Nueva implementación → ⚙️ Aplicación web*, con *Ejecutar como:* **Yo** y *Quién tiene acceso:* **Cualquier usuario**. Autoriza los permisos y copia la **URL de la aplicación web** (termina en `/exec`).
6. **Probar.** Abre la URL en el navegador. Debe responder `{"ok":true,"servicio":"registro-locales"}`.
7. **Conectar el sitio.** Agrega la URL al `.env` de la raíz del proyecto, junto a la de bandas:

   ```
   PUBLIC_REGISTRO_LOCALES_URL=https://script.google.com/macros/s/…/exec
   ```

   Vuelve a compilar (`npm run build`) y publica. Mientras la variable esté vacía, el formulario de locales prepara un mensaje para redes en lugar de enviar.

## Estructura

Mismas capas y reglas que el backend de bandas:

```text
backend/registro-locales/
  constants/
    configuracion.js   ID de la hoja, pestaña, zona horaria, límites contra spam, pausa
    mensajes.js        Respuestas generales
  data/
    campos.js          Campos (= src/contacto/data/camposLocal.ts)
  domain/
    validacion.js      Obligatorios y longitudes; rechaza archivos
    cupo.js            Límites de envíos por hora y por día
  helpers/
    texto.js           Textos sin fórmulas
  services/
    hoja.js            Hojas de cálculo (fila)
    propiedades.js     Propiedades del script: pausa y contadores
    bloqueo.js         LockService para envíos simultáneos
  api/
    webApp.js          doPost y doGet: campo trampa → pausa → validación → cupo → guardado
  pruebas/
    entorno.ts         Carga los módulos con las imitaciones de Google de backend/pruebas/
```

Si cambias un campo, cámbialo aquí (`data/campos.js`) y en el sitio (`src/contacto/data/camposLocal.ts`); una prueba falla si no coinciden. Si agregas un `.js`, regístralo en `MODULOS` de `pruebas/entorno.ts`.

## Subir con clasp

Igual que en el backend de bandas (ver [Subir con clasp](../registro-bandas/README.md#subir-con-clasp)), pero con el ID de **este** proyecto en `backend/registro-locales/.clasp.json` (git lo ignora):

```json
{ "scriptId": "PEGA_AQUI_EL_ID_DEL_PROYECTO_DE_LOCALES", "rootDir": "." }
```

Luego, desde `backend/registro-locales/`, ejecuta `clasp push`. Cuida de no cruzar los IDs: `clasp push` reemplaza todos los archivos del proyecto en línea.

Para actualizar sin cambiar la URL: *Implementar → Gestionar implementaciones → ✏️ → Versión: Nueva versión → Implementar*.

## Seguridad

- **Campo trampa:** los bots que lo rellenan reciben "ok" y no se guarda nada.
- **Validación en el servidor:** obligatorios, longitudes máximas y ningún archivo.
- **Sin fórmulas:** si un texto empieza con `=`, `+`, `-` o `@`, se le antepone `'` para que no se ejecute en la hoja.
- **Límites de envío** (`CONFIG.LIMITES`): 10 por hora y 40 por día, globales y separados de los de bandas. Solo cuentan los registros válidos.
- **Interruptor de pausa:** en *Propiedades del script*, `REGISTRO_PAUSADO` = `si` rechaza todos los envíos; bórrala para reanudar.
- **Errores genéricos:** los errores internos quedan en *Ejecuciones* y el local ve un mensaje general.
