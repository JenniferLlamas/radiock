import type { Page } from '@playwright/test';
import { expect, test } from './soporte/prueba';
import { URL_SITIO } from './soporte/urls';

/**
 * Aviso del próximo evento: barra arriba de todo, boleto en la portada (escritorio) y contador.
 * Se simula el reloj del navegador; las horas son de Tijuana.
 */

/** Primer evento próximo con el que se compiló el sitio (o null). */
async function proximoCompilado(page: Page) {
  await page.goto(URL_SITIO);
  const barra = page.locator('.event-bar');
  if (!(await barra.count())) return null;
  const inicio = await barra.locator('[data-cuenta-regresiva]').getAttribute('data-inicio');
  const fecha = await barra.getAttribute('data-fecha');
  return { inicio: Date.parse(inicio!), fecha: fecha! };
}

/** Fija el reloj del navegador en `instante` (pausado): solo avanza con page.clock.runFor. */
async function relojEn(page: Page, instante: number) {
  await page.clock.install({ time: instante - 1000 });
  await page.clock.pauseAt(instante);
}

const unidades = (page: Page, raiz: string) =>
  page.locator(`${raiz} [data-unidad]`).allTextContents();

test.describe('aviso y cuenta regresiva del próximo evento', () => {
  test('la barra y el boleto muestran cuánto falta y el contador avanza cada segundo', async ({ page, isMobile }) => {
    const proximo = await proximoCompilado(page);
    test.skip(!proximo, 'el sitio se compiló sin eventos próximos');
    const unDiaAntes = proximo!.inicio - ((24 + 2) * 3600 + 3 * 60 + 4) * 1000; // 1 d 02 h 03 m 04 s antes
    await relojEn(page, unDiaAntes);
    await page.goto(URL_SITIO);

    await expect(page.locator('.event-bar')).toBeVisible();
    await expect.poll(() => unidades(page, '.event-bar')).toEqual(['1', '02', '03', '04']);
    await expect(page.locator('.event-bar [data-cuenta-unidades]')).toHaveAttribute('aria-label', 'Faltan 1 día, 2 horas y 3 minutos');
    await page.clock.runFor(2000);
    await expect.poll(() => unidades(page, '.event-bar')).toEqual(['1', '02', '03', '02']);

    if (!isMobile) {
      await expect(page.locator('.hero-event-ticket')).toBeVisible();
      await expect.poll(() => unidades(page, '.hero-event-ticket')).toEqual(['1', '02', '03', '02']);
      await expect(page.locator('.hero-ticket')).toBeHidden();
    }
  });

  test('a la hora de inicio dice que ya empezó', async ({ page }) => {
    const proximo = await proximoCompilado(page);
    test.skip(!proximo, 'el sitio se compiló sin eventos próximos');
    await relojEn(page, proximo!.inicio - 3000);
    await page.goto(URL_SITIO);
    await expect.poll(() => unidades(page, '.event-bar')).toEqual(['0', '00', '00', '03']);
    await page.clock.runFor(4000);
    await expect(page.locator('.event-bar [data-cuenta-empezo]')).toBeVisible();
    await expect(page.locator('.event-bar [data-cuenta-empezo]')).toContainText('¡Ya empezó!');
    await expect(page.locator('.event-bar [data-cuenta-unidades]')).toBeHidden();
  });

  test('al día siguiente se ocultan la barra y el boleto, y vuelve el boleto de la escena', async ({ page, isMobile }) => {
    const proximo = await proximoCompilado(page);
    test.skip(!proximo, 'el sitio se compiló sin eventos próximos');
    await relojEn(page, new Date(`${proximo!.fecha}T12:00:00-08:00`).getTime() + 86_400_000);
    await page.goto(URL_SITIO);
    await expect(page.locator('.event-bar')).toBeHidden();
    await expect(page.locator('.hero-event-ticket')).toBeHidden();
    if (!isMobile) await expect(page.locator('.hero-ticket')).toBeVisible();
  });

  test('la página del evento tiene su contador y no repite la barra de ese mismo evento', async ({ page }) => {
    const proximo = await proximoCompilado(page);
    test.skip(!proximo, 'el sitio se compiló sin eventos próximos');
    const ruta = await page.locator('.event-bar-link').getAttribute('href');
    await relojEn(page, proximo!.inicio - 3 * 86_400_000);
    await page.goto(`${URL_SITIO}${ruta}`);
    await expect(page.locator('.event-bar')).toHaveCount(0);
    await expect.poll(() => unidades(page, '.event-detail-countdown')).toEqual(['3', '00', '00', '00']);
  });
});
