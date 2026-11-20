import { expect, test } from './soporte/prueba';
import { URL_SITIO } from './soporte/urls';

test.describe('página de inicio', () => {
  test('carga con su título, todas las secciones y sin desbordar la pantalla', async ({ page }) => {
    await page.goto(URL_SITIO);
    await expect(page).toHaveTitle('Radiock | Música local. Escenarios reales.');
    await expect(page.locator('h1')).toHaveCount(1);
    for (const id of ['inicio', 'radiock', 'eventos', 'bandas', 'comunidad', 'contacto']) {
      await expect(page.locator(`#${id}`), `sección #${id}`).toBeAttached();
    }
    const desborde = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(desborde).toBeLessThanOrEqual(0);
  });

  test('los botones para registrar una banda o un espacio llevan a su formulario', async ({ page }) => {
    await page.goto(URL_SITIO);
    const destinos = await page.locator('main a').evaluateAll((enlaces: HTMLAnchorElement[]) => enlaces
      .map((a) => ({ texto: a.textContent!.replace(/\s+/g, ' ').trim(), href: a.getAttribute('href') ?? '' }))
      .filter(({ texto }) => /tocar|soy una banda|espacio|colaborar/i.test(texto)));
    const esperado = (texto: string) => (/tocar|banda/i.test(texto) ? '#registro-banda' : '#registro-local');
    expect(destinos.length).toBeGreaterThanOrEqual(5);
    for (const { texto, href } of destinos) expect(href, texto).toBe(esperado(texto));

    // Al pulsar, la página llega al formulario.
    await page.getByRole('link', { name: /Tengo un espacio \/ Quiero colaborar/ }).click();
    await expect(page.locator('#registro-local')).toBeInViewport();
    await page.getByRole('link', { name: /Quiero tocar con Radiock/ }).first().click();
    await expect(page.locator('#registro-banda')).toBeInViewport();
  });

  test('menú móvil: abre, cierra con Escape y devuelve el foco', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'el menú desplegable solo existe en pantallas pequeñas');
    await page.goto(URL_SITIO);
    const boton = page.getByRole('button', { name: 'Abrir menú' });
    await boton.click();
    await expect(page.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#menu-principal')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(boton).toHaveAttribute('aria-expanded', 'false');
    await expect(boton).toBeFocused();
  });

  test('menú móvil: se cierra al elegir un enlace', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'el menú desplegable solo existe en pantallas pequeñas');
    await page.goto(URL_SITIO);
    await page.getByRole('button', { name: 'Abrir menú' }).click();
    await page.locator('#menu-principal').getByRole('link', { name: 'Bandas' }).click();
    await expect(page.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute('aria-expanded', 'false');
    await expect(page).toHaveURL(/#bandas$/);
  });

  test('carrusel de bandas: flechas, estado anunciado y límite final', async ({ page, isMobile }) => {
    test.skip(isMobile, 'en escritorio se ven 3 tarjetas a la vez y el estado es predecible');
    await page.goto(URL_SITIO);
    const carrusel = page.locator('#bandas [data-carrusel]');
    await carrusel.scrollIntoViewIfNeeded();
    const estado = carrusel.locator('[data-carrusel-estado]');
    // El total sale de las tarjetas: la prueba sigue valiendo al agregar o quitar bandas.
    const total = await carrusel.locator('.artist').count();
    expect(total).toBeGreaterThan(3);
    await expect(estado).toHaveText(`Bandas 1–3 de ${total}`);
    await expect(page.getByRole('button', { name: 'Ver bandas anteriores' })).toBeDisabled();
    const siguientes = page.getByRole('button', { name: 'Ver bandas siguientes' });
    for (let primera = 2; primera <= total - 2; primera++) {
      await siguientes.click();
      await expect(estado).toHaveText(`Bandas ${primera}–${primera + 2} de ${total}`);
    }
    await expect(siguientes).toBeDisabled();
  });
});

test.describe('eventos', () => {
  test('cada evento del archivo enlaza a su propia página', async ({ page }) => {
    await page.goto(URL_SITIO);
    const enlaces = page.locator('#eventos-anteriores').getByRole('link', { name: 'Ver el evento' });
    await expect(enlaces).toHaveCount(5);
    await expect(enlaces.last()).toHaveAttribute('href', '/eventos/radiock-fest-vol-5');
    await expect(enlaces.nth(2)).toHaveAttribute('href', '/eventos/radiock-fest-vol-3');
    await enlaces.nth(2).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Radiock Fest Vol. 3');
    await expect(page.getByText('Ocho propuestas originales. Un mismo escenario.')).toBeVisible();
    await expect(page.getByText('EVENTO FINALIZADO')).toBeVisible();
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /ocho bandas de música original reunidas el 5 de abril de 2025 en Ranas Bar, Tijuana, B\.C\.$/);
  });

  test('el enlace antiguo /evento redirige a Radiock Fest Vol. 1', async ({ page }) => {
    await page.goto(`${URL_SITIO}/evento`);
    await expect(page).toHaveURL(/\/eventos\/radiock-fest-vol-1\/?$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Radiock Fest Vol. 1');
  });
});
