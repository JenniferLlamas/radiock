import type { Page } from '@playwright/test';
import { simularAppsScript } from './soporte/appsScriptFalso';
import { fotos, logos, relleno, rutasFotos, wav, type ArchivoPrueba } from './soporte/archivos';
import { expect, test } from './soporte/prueba';
import { URL_REGISTRO } from './soporte/urls';

/** Modo con backend: fotos, logos y canciones con vistas previas, enviados al Apps Script (simulado). */

const seccion = (page: Page, nombre: 'fotos' | 'logos' | 'canciones') =>
  page.locator('[data-selector-archivos]').filter({ has: page.locator(`input[name="${nombre}"]`) });

/** Igual que elegir archivos en el diálogo del sistema: reemplaza la selección del input. */
const elegir = (page: Page, nombre: 'fotos' | 'logos' | 'canciones', archivos: ArchivoPrueba[]) =>
  page.locator(`input[name="${nombre}"]`).setInputFiles(archivos);

const enInput = (page: Page, nombre: string) =>
  page.locator(`input[name="${nombre}"]`).evaluate((e: HTMLInputElement) => [...(e.files ?? [])].map((f) => f.name));

async function llenarDatos(page: Page, banda = 'Los Prueba') {
  await page.getByLabel('Nombre de la banda *').fill(banda);
  await page.getByLabel('Ciudad *').fill('Tijuana');
  await page.getByLabel('Género *').fill('Rock alternativo');
  await page.getByLabel('Contacto *').fill('losprueba@ejemplo.com');
}

test.describe('registro con archivos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${URL_REGISTRO}/#registro-banda`);
  });

  test('muestra tres secciones con zona para arrastrar, contador y medidor del total', async ({ page }) => {
    await expect(page.locator('.file-section.is-enhanced')).toHaveCount(3);
    await expect(page.locator('.file-section legend')).toHaveText([/Fotos/, /Logos/, /Canciones/]);
    await expect(seccion(page, 'fotos').locator('[data-contador]')).toHaveText('0 de 3');
    await expect(seccion(page, 'logos').locator('[data-contador]')).toHaveText('0 de 2');
    await expect(seccion(page, 'canciones').locator('[data-contador]')).toHaveText('0 de 3');
    await expect(page.locator('#registro-banda [data-registro-medidor-texto]')).toHaveText('0 MB de 30 MB');
    await expect(seccion(page, 'fotos').getByText('Arrastra tus fotos aquí')).toBeVisible();
  });

  test('fotos: se suman por tandas, sin duplicados, hasta 3, y se pueden quitar', async ({ page }) => {
    const fotosSeccion = seccion(page, 'fotos');
    const entrada = page.locator('input[name="fotos"]');
    await entrada.setInputFiles([rutasFotos.bailarina, rutasFotos.jumping]);
    await expect(fotosSeccion.locator('.file-card')).toHaveCount(2);
    await expect(fotosSeccion.locator('[data-contador]')).toHaveText('2 de 3');
    // Las miniaturas cargan la imagen real
    for (const img of await fotosSeccion.locator('.file-card-thumb img').all()) {
      await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
    }

    // Segunda tanda: incluye de nuevo bailarina (duplicada, se ignora sin aviso) y una cuarta que no cabe
    await entrada.setInputFiles([rutasFotos.bailarina, rutasFotos.stridulus, rutasFotos.bluesfire]);
    expect(await enInput(page, 'fotos')).toEqual(['bailarina-en-vivo.webp', 'jumping-beans-en-vivo.webp', 'stridulus-ensayo.webp']);
    await expect(fotosSeccion.locator('[data-mensaje]')).toHaveText('Fotos: máximo 3; "bluesfire-en-vivo.webp" no se agregó.');
    await expect(fotosSeccion).toHaveClass(/is-full/);
    await expect(fotosSeccion.getByText('Llegaste al máximo. Quita uno para cambiarlo.')).toBeVisible();

    await page.getByRole('button', { name: 'Quitar jumping-beans-en-vivo.webp' }).click();
    expect(await enInput(page, 'fotos')).toEqual(['bailarina-en-vivo.webp', 'stridulus-ensayo.webp']);
    await expect(fotosSeccion.locator('[data-contador]')).toHaveText('2 de 3');
    await expect(page.getByRole('button', { name: 'Quitar stridulus-ensayo.webp' })).toBeFocused();
  });

  test('rechaza al agregar: foto de más de 4 MB y SVG como foto', async ({ page }) => {
    await elegir(page, 'fotos', [relleno('enorme.jpg', 'image/jpeg', 5), logos.svg]);
    expect(await enInput(page, 'fotos')).toEqual([]);
    await expect(seccion(page, 'fotos').locator('[data-mensaje]'))
      .toHaveText('"enorme.jpg" pesa más de 4 MB. "logo.svg" no tiene un formato permitido.');
  });

  test('arrastrar y soltar agrega la foto y resalta la zona', async ({ page }) => {
    const zona = seccion(page, 'fotos').locator('[data-zona]');
    const transferencia = await page.evaluateHandle(async () => {
      const blob = await (await fetch('/comunidad/bluesfire-en-vivo.webp')).blob();
      const dt = new DataTransfer();
      dt.items.add(new File([blob], 'arrastrada.webp', { type: 'image/webp' }));
      return dt;
    });
    await zona.dispatchEvent('dragenter', { dataTransfer: transferencia });
    await expect(zona).toHaveClass(/is-dragging/);
    await zona.dispatchEvent('drop', { dataTransfer: transferencia });
    await expect(zona).not.toHaveClass(/is-dragging/);
    expect(await enInput(page, 'fotos')).toEqual(['arrastrada.webp']);
  });

  test('logos: SVG y PNG con vista previa completa, máximo 2', async ({ page }) => {
    await elegir(page, 'logos', [logos.svg, logos.oblivion, logos.stridulus]);
    const logosSeccion = seccion(page, 'logos');
    expect(await enInput(page, 'logos')).toEqual(['logo.svg', 'logo-oblivion.png']);
    await expect(logosSeccion.locator('.file-card--logo')).toHaveCount(2);
    await expect(logosSeccion.locator('[data-mensaje]')).toContainText('Logos: máximo 2');
    for (const img of await logosSeccion.locator('img').all()) {
      await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.naturalWidth > 0)).toBe(true);
    }
  });

  test('canciones: reproductor con duración, reproducir y pausar, máximo 3', async ({ page }) => {
    await elegir(page, 'canciones', [wav('demo.wav'), wav('ensayo.wav', 2), wav('vivo.wav', 2), wav('extra.wav', 1)]);
    const canciones = seccion(page, 'canciones');
    expect(await enInput(page, 'canciones')).toEqual(['demo.wav', 'ensayo.wav', 'vivo.wav']);
    await expect(canciones.locator('[data-mensaje]')).toContainText('Canciones: máximo 3; "extra.wav" no se agregó.');

    const reproductor = canciones.locator('.player').first();
    await expect(reproductor.locator('.player-time')).toHaveText('0:00 / 0:03');
    await page.getByRole('button', { name: 'Escuchar demo.wav' }).click();
    await expect(reproductor).toHaveClass(/is-playing/);
    await expect(reproductor.locator('.player-time')).toHaveText(/^0:0[1-3] \/ 0:03$/, { timeout: 5000 });
    await page.getByRole('button', { name: 'Escuchar demo.wav' }).click();
    await expect(reproductor).not.toHaveClass(/is-playing/);

    // Solo suena una canción a la vez
    await page.getByRole('button', { name: 'Escuchar demo.wav' }).click();
    await page.getByRole('button', { name: 'Escuchar ensayo.wav' }).click();
    await expect(canciones.locator('.player.is-playing')).toHaveCount(1);
    await expect(canciones.locator('.player').nth(1)).toHaveClass(/is-playing/);
  });

  test('no envía si el total pasa de 30 MB', async ({ page }) => {
    const recibidas = await simularAppsScript(page);
    await llenarDatos(page);
    await elegir(page, 'canciones', [1, 2, 3].map((i) => relleno(`grande${i}.mp3`, 'audio/mpeg', 12)));
    await expect(page.locator('#registro-banda [data-registro-medidor]')).toHaveAttribute('data-nivel', 'excedido');
    await page.getByRole('button', { name: /Enviar registro/ }).click();
    await expect(page.locator('#registro-banda [data-registro-estado]')).toHaveText('Entre todos, los archivos pesan más de 30 MB.');
    expect(recibidas).toHaveLength(0);
  });

  test('envía datos y archivos al backend tal como se ven en pantalla', async ({ page }) => {
    const recibidas = await simularAppsScript(page);
    await llenarDatos(page);
    const material = { fotos: [fotos.bailarina, fotos.stridulus], logos: [logos.svg], canciones: [wav('demo.wav'), wav('ensayo.wav', 2)] };
    for (const [nombre, archivos] of Object.entries(material)) await elegir(page, nombre as keyof typeof material, archivos);
    await expect(page.locator('#registro-banda [data-registro-medidor-texto]')).toHaveText(/ de 30 MB$/);

    await page.getByRole('button', { name: /Enviar registro/ }).click();
    await expect(page.locator('#registro-banda [data-registro-exito]')).toBeVisible();
    await expect(page.locator('#registro-banda [data-registro-nombre]')).toHaveText('Los Prueba');

    expect(recibidas).toHaveLength(1);
    const [solicitud] = recibidas;
    expect(solicitud.tipoContenido).toMatch(/^text\/plain/); // petición CORS simple, sin preflight
    expect(solicitud.campos).toEqual({ banda: 'Los Prueba', ciudad: 'Tijuana', genero: 'Rock alternativo', instagram: '', youtube: '', contacto: 'losprueba@ejemplo.com' });
    expect(solicitud.sitioWeb).toBe('');
    expect(solicitud.tipo).toBe('banda');
    const enviados = Object.entries(material).flatMap(([campo, archivos]) => archivos.map((a) => ({ campo, ...a })));
    expect(solicitud.archivos.map((a) => `${a.campo}:${a.nombre}:${a.tipo}`)).toEqual(enviados.map((a) => `${a.campo}:${a.name}:${a.mimeType}`));
    solicitud.archivos.forEach((archivo, i) => expect(archivo.bytes.equals(enviados[i].buffer), archivo.nombre).toBe(true));

    // "Registrar otra banda" deja el formulario limpio
    await page.getByRole('button', { name: 'Registrar otra banda' }).click();
    await expect(page.locator('#registro-banda [data-registro-formulario]')).toBeVisible();
    await expect(page.locator('.file-card')).toHaveCount(0);
    await expect(page.getByLabel('Nombre de la banda *')).toHaveValue('');
    await expect(page.locator('#registro-banda [data-registro-medidor-texto]')).toHaveText('0 MB de 30 MB');
  });

  test('si el backend rechaza el registro, muestra el motivo y permite reintentar', async ({ page }) => {
    let intentos = 0;
    await simularAppsScript(page, { responder: () => (++intentos === 1 ? { ok: false, error: 'Falta el campo Ciudad.' } : { ok: true }) });
    await llenarDatos(page);
    const boton = page.getByRole('button', { name: /Enviar registro/ });
    await boton.click();
    await expect(page.locator('#registro-banda [data-registro-estado]')).toHaveText('Falta el campo Ciudad.');
    await expect(boton).toBeEnabled();
    await boton.click();
    await expect(page.locator('#registro-banda [data-registro-exito]')).toBeVisible();
  });

  test('un bot que llena el campo trampa no ve diferencia, pero se marca', async ({ page }) => {
    const recibidas = await simularAppsScript(page);
    await llenarDatos(page);
    await page.locator('#registro-banda input[name="sitioWeb"]').evaluate((e: HTMLInputElement) => { e.value = 'http://spam'; });
    await page.getByRole('button', { name: /Enviar registro/ }).click();
    await expect(page.locator('#registro-banda [data-registro-exito]')).toBeVisible();
    expect(recibidas[0].sitioWeb).toBe('http://spam');
  });
});
