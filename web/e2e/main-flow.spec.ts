import { expect, test, type Page } from '@playwright/test';

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `${process.env.SHOTS_DIR ?? 'test-results'}/${test.info().project.name}-${name}.png` });

test('records a bike, a location and setups like on a phone', async ({ page, context }, info) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 48.3592, longitude: 24.5352 });
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Мої велосипеди' })).toBeVisible();
  if (info.project.name === 'iphone') {
    await expect(page.getByText('Встанови на телефон')).toBeVisible();
    await shot(page, '01-empty');
    await page.getByRole('button', { name: 'Зрозуміло' }).click();
  }

  await page.getByRole('button', { name: 'Велосипед' }).click();
  await page.getByLabel('Назва', { exact: true }).fill('Spectral 29');
  await page.getByLabel('Тип', { exact: true }).selectOption('ENDURO');
  await page.getByLabel('Вилка', { exact: true }).fill('Fox 36');
  await page.getByLabel('Модель амортизатора').fill('Float X2');
  await page.getByRole('button', { name: 'Зберегти' }).click();
  await expect(page.getByText('Enduro · 29"')).toBeVisible();
  await expect(page.getByText('Ще немає сетапів')).toBeVisible();

  await page.getByText('Spectral 29').click();
  await page.getByRole('button', { name: 'Новий сетап' }).click();
  await page.getByLabel('Місцевість', { exact: true }).selectOption('__new__');
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Назва').fill('Bukovel');
  await dialog.getByLabel('Тип місцевості').selectOption('BIKE_PARK');
  await dialog.getByRole('button', { name: 'Додати' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByLabel('Місцевість', { exact: true })).toHaveValue(/.+-.+/);
  await page.getByLabel('Погода').selectOption('DRY');
  await page.getByLabel('Температура', { exact: true }).fill('3');
  await page.getByRole('button', { name: 'Змінити знак' }).click();
  await expect(page.getByLabel('Температура', { exact: true })).toHaveValue('-3');
  await page.getByLabel('Вага з екіпом').fill('82');
  await page.getByLabel('Тиск', { exact: true }).nth(0).fill('85');
  await page.getByLabel('Sag', { exact: true }).nth(0).fill('20');
  await page.getByRole('button', { name: 'Збільшити: Токени' }).first().click();
  await page.getByRole('button', { name: 'Збільшити: Токени' }).first().click();
  await page.getByLabel('Rebound', { exact: true }).first().fill('8');
  await page.getByLabel('Тиск', { exact: true }).nth(1).fill('210');
  await page.getByLabel('Sag', { exact: true }).nth(1).fill('30');
  await page.getByLabel('Перед', { exact: true }).fill('1,6');
  await page.getByLabel('Зад', { exact: true }).fill('1.75');
  await page.getByLabel('Покришка перед').fill('Assegai 2.5');
  await page.getByLabel('Тиск', { exact: true }).nth(0).fill('8x');
  await expect(page.getByRole('button', { name: 'Зберегти' })).toBeDisabled();
  await page.getByLabel('Тиск', { exact: true }).nth(0).fill('85');
  await shot(page, '02-setup-form');
  await page.getByRole('button', { name: 'Зберегти' }).click();

  await expect(page.getByText('Вилка: 85 psi · sag 20% · 2 токени')).toBeVisible();
  await expect(page.getByText('Аморт: 210 psi · sag 30%')).toBeVisible();
  await expect(page.getByText('Шини: 1.6 / 1.75 bar')).toBeVisible();
  await expect(page.getByText('Сухо, -3 °C')).toBeVisible();

  await page.getByText('Вилка: 85 psi').click();
  await expect(page.getByText('Assegai 2.5')).toBeVisible();
  await shot(page, '03-setup-detail');
  await page.getByRole('button', { name: 'Новий на основі цього' }).click();
  await expect(page.getByText(/За основу взято сетап від/)).toBeVisible();
  await expect(page.getByLabel('Температура', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Тиск', { exact: true }).nth(0)).toHaveValue('85');
  await page.getByLabel('Тиск', { exact: true }).nth(0).fill('90');
  await page.getByRole('button', { name: 'Зберегти' }).click();
  await page.getByRole('button', { name: 'Назад' }).click();
  await expect(page.getByText('Вилка: 90 psi · sag 20% · 2 токени')).toBeVisible();
  await page.getByRole('button', { name: 'Історія (1)' }).click();
  await expect(page.getByText('Вилка: 85 psi · sag 20% · 2 токени')).toBeVisible();
  await shot(page, '04-bike-detail');

  await page.getByRole('button', { name: 'Назад' }).click();
  await page.getByRole('button', { name: 'Налаштування' }).click();
  await page.getByRole('radiogroup', { name: 'Тиск підвіски' }).getByRole('radio', { name: 'bar' }).click();
  await shot(page, '05-settings');
  await page.getByRole('button', { name: 'Назад' }).click();
  await page.getByText('Spectral 29').click();
  await expect(page.getByText('Вилка: 6.21 bar · sag 20% · 2 токени')).toBeVisible();

  await page.goto('./#/locations');
  await expect(page.getByText('Байк-парк · 2 сетапи')).toBeVisible();
  await page.getByText('Bukovel').click();
  await page.getByRole('button', { name: 'Де я' }).click();
  await expect(page.getByLabel('Широта')).toHaveValue('48.3592');
  await expect(page.getByRole('link', { name: 'На мапі' })).toHaveAttribute('href', /48\.3592/);
  await page.getByRole('button', { name: 'Зберегти' }).click();

  await page.reload();
  await expect(page.getByText('Bukovel')).toBeVisible();
  await page.goto('./');
  await expect(page.getByText(/2 сетапи · останній/)).toBeVisible();
  await shot(page, '06-bike-list');
});

test('keeps working offline after the first visit', async ({ page, context, browserName }) => {
  test.skip(browserName === 'webkit', 'Playwright WebKit on Linux has no service worker offline support');
  await page.goto('./');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Мої велосипеди' })).toBeVisible();
});
