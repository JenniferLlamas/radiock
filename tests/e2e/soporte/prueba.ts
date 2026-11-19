import { test as base, expect } from '@playwright/test';

/**
 * `test` con una comprobación automática: si la página lanza un error de JavaScript
 * durante la prueba, la prueba falla aunque todas sus aserciones hayan pasado.
 */
export const test = base.extend<{ erroresJs: string[] }>({
  erroresJs: [async ({ page }, usar) => {
    const errores: string[] = [];
    page.on('pageerror', (error) => errores.push(error.message));
    await usar(errores);
    expect(errores, 'errores de JavaScript en la página').toEqual([]);
  }, { auto: true }],
});

export { expect };
