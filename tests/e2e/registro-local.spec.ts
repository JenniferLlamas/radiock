import type { Page } from '@playwright/test';
import { simularAppsScript } from './soporte/appsScriptFalso';
import { expect, test } from './soporte/prueba';
import { URL_APPS_SCRIPT, URL_APPS_SCRIPT_LOCALES, URL_REGISTRO, URL_SITIO } from './soporte/urls';

/** Registro de locales: sección propia, con su propio Web App (separado del de bandas). */

async function llenarLocal(page: Page) {
  await page.getByLabel('Nombre del local *').fill('El Foro');
  await page.getByLabel('Responsable *').fill('Ana López');
  await page.getByLabel('Ubicación *').fill('Av. Revolución 123, Centro, Tijuana');
  await page.getByLabel('Teléfono o correo *').fill('664 123 4567');
}

test.describe('registro de locales con envío', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${URL_REGISTRO}/#registro-local`);
  });

  test('está en su propia sección, sin archivos, y los botones de espacios llevan ahí', async ({ page }) => {
    const local = page.locator('#espacios #registro-local');
    await expect(local).toBeVisible();
    await expect(local.locator('input[type="file"]')).toHaveCount(0);
    await expect(page.locator('#contacto #registro-local')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Quiero sumar mi espacio/ })).toHaveAttribute('href', '#registro-local');
  });

  test('envía los datos solo al Web App de locales', async ({ page }) => {
    const locales = await simularAppsScript(page, { url: URL_APPS_SCRIPT_LOCALES });
    const bandas = await simularAppsScript(page, { url: URL_APPS_SCRIPT });
    await llenarLocal(page);
    await page.getByRole('button', { name: /Sumar mi espacio/ }).click();

    const local = page.locator('#registro-local');
    await expect(local.locator('[data-registro-exito]')).toBeVisible();
    await expect(local.locator('[data-registro-nombre]')).toHaveText('El Foro');
    expect(bandas).toHaveLength(0);
    expect(locales).toHaveLength(1);
    expect(locales[0]).toMatchObject({
      tipo: 'local',
      campos: { local: 'El Foro', responsable: 'Ana López', ubicacion: 'Av. Revolución 123, Centro, Tijuana', contacto: '664 123 4567' },
      sitioWeb: '',
      archivos: [],
    });
    expect(locales[0].tipoContenido).toMatch(/^text\/plain/);

    await page.getByRole('button', { name: 'Registrar otro local' }).click();
    await expect(page.getByLabel('Nombre del local *')).toHaveValue('');
  });

  test('no envía si falta un obligatorio, y muestra el error del backend', async ({ page }) => {
    const locales = await simularAppsScript(page, { url: URL_APPS_SCRIPT_LOCALES, responder: () => ({ ok: false, error: 'Falta el campo Ubicación.' }) });
    await page.getByRole('button', { name: /Sumar mi espacio/ }).click();
    expect(locales).toHaveLength(0);

    await llenarLocal(page);
    await page.getByRole('button', { name: /Sumar mi espacio/ }).click();
    await expect(page.locator('#registro-local [data-registro-estado]')).toHaveText('Falta el campo Ubicación.');
  });
});

test.describe('registro de locales sin backend', () => {
  test('prepara un mensaje con los datos del local', async ({ page }) => {
    await page.goto(`${URL_SITIO}/#registro-local`);
    await llenarLocal(page);
    await page.getByRole('button', { name: /Preparar mi mensaje/ }).click();
    await expect(page.locator('#registro-local [data-presentacion-mensaje]')).toHaveValue(
      '¡Hola, Radiock! Tenemos un espacio y nos gustaría recibir eventos de música original.\n\nLocal: El Foro\nResponsable: Ana López\nUbicación: Av. Revolución 123, Centro, Tijuana\nContacto: 664 123 4567',
    );
    await expect(page.locator('#encabezado-local')).toBeFocused();
    // El formulario de bandas sigue intacto.
    await expect(page.locator('#registro-banda [data-presentacion-vista]')).toBeHidden();
  });
});
