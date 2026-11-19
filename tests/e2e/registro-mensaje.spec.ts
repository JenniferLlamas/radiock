import { expect, test } from './soporte/prueba';
import { URL_SITIO } from './soporte/urls';

/** Modo sin backend (urlRegistro vacía): el formulario prepara un mensaje para redes. */
test.describe('formulario sin backend', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(`${URL_SITIO}/#registro-banda`);
  });

  test('no muestra campos de archivos', async ({ page }) => {
    await expect(page.locator('#registro-banda input[type="file"]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Preparar mi presentación/ })).toBeEnabled();
  });

  test('los obligatorios no aceptan solo espacios', async ({ page }) => {
    await page.getByLabel('Nombre de la banda *').fill('   ');
    await page.getByRole('button', { name: /Preparar mi presentación/ }).click();
    await expect(page.locator('[data-presentacion-vista]')).toBeHidden();
    expect(await page.getByLabel('Nombre de la banda *').evaluate((e: HTMLInputElement) => e.validationMessage)).toBe('Completa este campo.');
  });

  test('prepara el mensaje, lo copia y lo oculta si se editan los datos', async ({ page }) => {
    await page.getByLabel('Nombre de la banda *').fill('Oblivion');
    await page.getByLabel('Ciudad *').fill('Tijuana');
    await page.getByLabel('Género *').fill('Rock');
    await page.getByLabel('Contacto *').fill('oblivion@ejemplo.com');
    await page.getByRole('button', { name: /Preparar mi presentación/ }).click();

    const mensaje = page.locator('[data-presentacion-mensaje]');
    await expect(mensaje).toHaveValue('¡Hola, Radiock! Queremos compartir nuestra música original con ustedes.\n\nBanda: Oblivion\nCiudad: Tijuana\nGénero: Rock\nContacto: oblivion@ejemplo.com');
    await expect(page.locator('#preview-heading')).toBeFocused();

    await page.getByRole('button', { name: 'Copiar mensaje' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Mensaje copiado' })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('Banda: Oblivion');

    await page.getByLabel('Ciudad *').fill('Ensenada');
    await expect(page.locator('[data-presentacion-vista]')).toBeHidden();
  });
});
