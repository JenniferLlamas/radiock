import type { Page } from '@playwright/test';
import { expect, test } from './soporte/prueba';
import { URL_SITIO } from './soporte/urls';

/**
 * Un evento próximo pasa solo a "Eventos anteriores" cuando su fecha ya pasó, aunque el sitio
 * se haya compilado antes. Se simula el reloj del navegador (hora de Tijuana, UTC-8 en diciembre).
 */
const abrirEn = async (page: Page, instante: string, ruta = '/') => {
  await page.clock.install({ time: new Date(instante) });
  await page.goto(`${URL_SITIO}${ruta}`);
};

/** Próximos con los que se compiló el sitio; si no hay, estas pruebas no aplican. */
const proximosCompilados = (page: Page) =>
  page.locator('[data-evento-proximo]').evaluateAll((tarjetas: HTMLElement[]) =>
    tarjetas.map((t) => ({ id: t.dataset.id!, fecha: t.dataset.fecha! })));

test.describe('agenda en vivo', () => {
  test('antes de la fecha, el evento sigue en próximos y no en el archivo', async ({ page }) => {
    await abrirEn(page, '2026-11-25T12:00:00-08:00');
    const [primero] = await proximosCompilados(page);
    test.skip(!primero || primero.fecha < '2026-11-25', 'el sitio se compiló sin eventos próximos a esa fecha');
    await expect(page.locator(`[data-evento-proximo][data-id="${primero.id}"]`)).toBeVisible();
    await expect(page.locator(`[data-evento-archivo][data-id="${primero.id}"]`)).toBeHidden();
    await expect(page.locator('[data-agenda-vacio]')).toBeHidden();
  });

  test('el mismo día del evento todavía es próximo', async ({ page }) => {
    await page.goto(URL_SITIO);
    const [primero] = await proximosCompilados(page);
    test.skip(!primero, 'el sitio se compiló sin eventos próximos');
    await abrirEn(page, `${primero.fecha}T23:30:00-08:00`);
    await expect(page.locator(`[data-evento-proximo][data-id="${primero.id}"]`)).toBeVisible();
  });

  test('al día siguiente pasa a "Eventos anteriores" y, sin más próximos, aparece el aviso', async ({ page }) => {
    await page.goto(URL_SITIO);
    const proximos = await proximosCompilados(page);
    test.skip(!proximos.length, 'el sitio se compiló sin eventos próximos');
    const ultimo = proximos[proximos.length - 1];
    const diaSiguiente = new Date(`${ultimo.fecha}T12:00:00-08:00`);
    diaSiguiente.setUTCDate(diaSiguiente.getUTCDate() + 1);
    await abrirEn(page, diaSiguiente.toISOString());

    for (const { id } of proximos) {
      await expect(page.locator(`[data-evento-proximo][data-id="${id}"]`)).toBeHidden();
      await expect(page.locator(`[data-evento-archivo][data-id="${id}"]`)).toBeVisible();
    }
    await expect(page.locator('[data-agenda-vacio]')).toBeVisible();
    await expect(page.getByText('La próxima fecha comienza a tomar forma.')).toBeVisible();
    // Queda al final del archivo, en orden cronológico.
    await expect(page.locator('[data-evento-archivo]:not([hidden])').last()).toHaveAttribute('data-id', ultimo.id);
    await expect(page.locator('[data-agenda-recorrido]')).toBeVisible();
  });

  test('la página del evento cambia a "Evento finalizado" y muestra el archivo de fotos', async ({ page }) => {
    await page.goto(URL_SITIO);
    const [primero] = await proximosCompilados(page);
    test.skip(!primero, 'el sitio se compiló sin eventos próximos');
    const ruta = `/eventos/${primero.id}`;

    await abrirEn(page, `${primero.fecha}T12:00:00-08:00`, ruta);
    await expect(page.getByText('PRÓXIMO EVENTO', { exact: true })).toBeVisible();
    await expect(page.locator('#galeria')).toBeHidden();

    const diaSiguiente = new Date(`${primero.fecha}T12:00:00-08:00`);
    diaSiguiente.setUTCDate(diaSiguiente.getUTCDate() + 1);
    await abrirEn(page, diaSiguiente.toISOString(), ruta);
    await expect(page.getByText('EVENTO FINALIZADO', { exact: true })).toBeVisible();
    await expect(page.getByText('NUESTRO RECORRIDO / EVENTO ANTERIOR')).toBeVisible();
    await expect(page.locator('#galeria')).toBeVisible();
  });
});
