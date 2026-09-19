# Plantillas de Oblivion

Estas secciones proceden de la antigua carpeta `src/sections`. Ninguna de las dos rutas de Radiock las importaba. Se conservan como referencia fuera de `src` para distinguirlas de las funcionalidades activas.

No son componentes listos para integrar: las referencias originales `@components/Evento.astro`, `@components/CardImage.astro`, `@components/Integrantes/card.astro`, `@components/Carouselitem.astro` y `@components/CardHover.astro` apuntan a archivos que no existían. Tampoco estaba configurado el alias `@components`. La antigua tarjeta `Card.astro` ahora está en `src/bandas/TarjetaBanda.astro` y tiene un propósito específico para Radiock. Varias imágenes, audios y dependencias de los carruseles también están ausentes.

Antes de reutilizar una plantilla, trasladarla a la funcionalidad correspondiente en `src/bandas`, proporcionar sus componentes y recursos, actualizar sus imports y verificar su comportamiento. No importar directamente desde este archivo.
