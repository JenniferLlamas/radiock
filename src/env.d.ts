/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  /** URL del Web App de registro; sustituye a sitio.urlRegistro si se define. */
  readonly PUBLIC_REGISTRO_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
