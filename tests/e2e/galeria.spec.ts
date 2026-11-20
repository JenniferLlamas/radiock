import { expect, test } from './soporte/prueba';
import { URL_SITIO } from './soporte/urls';

/** Galería de fotos de las bandas (sección Comunidad). */
test.describe('galería de bandas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${URL_SITIO}/#galeria`);
  });

  test('muestra 12 fotos, "Ver más" muestra el resto y las miniaturas cargan', async ({ page }) => {
    const galeria = page.locator('#galeria');
    const visibles = galeria.locator('li:not([hidden])');
    const total = await galeria.locator('li').count();
    await expect(visibles).toHaveCount(12);
    await galeria.getByRole('button', { name: `Ver ${total - 12} fotos más` }).click();
    await expect(visibles).toHaveCount(total);
    await expect(galeria.locator('[data-galeria-mas]')).toBeHidden();
    const primera = visibles.first().locator('img');
    await primera.scrollIntoViewIfNeeded();
    await expect.poll(() => primera.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
  });

  test('filtra por banda y vuelve a todas', async ({ page }) => {
    const galeria = page.locator('#galeria');
    await galeria.getByRole('button', { name: 'Morfina', exact: true }).click();
    await expect(galeria.locator('li:not([hidden])')).toHaveCount(3);
    await expect(galeria.locator('li:not([hidden]) .band-gallery-name')).toHaveText(['Morfina', 'Morfina', 'Morfina']);
    await expect(galeria.locator('[data-galeria-conteo]')).toHaveText('3 fotos de Morfina');
    await expect(galeria.getByRole('button', { name: 'Morfina', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await galeria.getByRole('button', { name: 'Todas' }).click();
    await expect(galeria.locator('li:not([hidden])')).toHaveCount(12);
  });

  test('abre la foto en el visor, la recorre con flechas y se cierra con Escape', async ({ page }) => {
    const galeria = page.locator('#galeria');
    await galeria.getByRole('button', { name: 'Bluesfire', exact: true }).click();
    await galeria.locator('li:not([hidden]) a').first().click();
    const visor = page.locator('dialog[data-galeria-visor]');
    await expect(visor).toBeVisible();
    await expect(visor.locator('[data-visor-titulo]')).toHaveText('Bluesfire');
    await expect(visor.locator('[data-visor-posicion]')).toHaveText('1 de 4');
    await expect.poll(() => visor.locator('img').evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
    await page.keyboard.press('ArrowRight');
    await expect(visor.locator('[data-visor-posicion]')).toHaveText('2 de 4');
    await page.getByRole('button', { name: 'Foto anterior' }).click();
    await page.getByRole('button', { name: 'Foto anterior' }).click();
    await expect(visor.locator('[data-visor-posicion]')).toHaveText('4 de 4');
    await page.keyboard.press('Escape');
    await expect(visor).toBeHidden();
  });
});
