import { expect, test, type Page } from '@playwright/test';

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `${process.env.SHOTS_DIR ?? 'test-results'}/${test.info().project.name}-${name}.png` });

test('picks Fox suspension from the catalogue and starts from the manufacturer table', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Велосипед', exact: true }).click();
  await page.getByLabel('Назва', { exact: true }).fill('Megatower');
  await page.getByLabel('Виробник').nth(0).selectOption('Fox');
  await page.getByLabel('Модель', { exact: true }).nth(0).selectOption('38');
  await page.getByLabel('Рік').nth(0).selectOption('2026');
  await page.getByLabel('Демпфер').nth(0).selectOption('GRIP_X2');
  await page.getByLabel('Пружина').nth(0).selectOption('FLOAT');
  await page.getByLabel('Хід').nth(0).selectOption('170');
  await expect(page.getByText('Заводських токенів: 2, максимум 5')).toBeVisible();
  await expect(page.getByLabel('Швидкісний відскок (HSR)').first()).toBeChecked();
  await page.getByLabel('Виробник').nth(1).selectOption('Fox');
  await page.getByLabel('Модель', { exact: true }).nth(1).selectOption('FLOAT X2');
  await page.getByLabel('Рік').nth(1).selectOption('2026');
  await shot(page, '21-catalog-picker');
  await page.getByRole('button', { name: 'Зберегти' }).click();

  await page.getByText('Megatower').click();
  await page.getByRole('button', { name: 'Новий сетап' }).click();
  await expect(page.getByText('Рекомендовано для цього типу байка: 15–20%')).toBeVisible();
  await expect(page.getByText('Рекомендовано для цього типу байка: 30–30%')).toBeVisible();
  await page.getByRole('button', { name: 'Старт за таблицею виробника' }).click();
  await expect(page.getByText(/Вкажи вагу райдера/)).toBeVisible();
  await page.getByLabel('Вага з екіпом').fill('75');
  await page.getByLabel('Тиск', { exact: true }).nth(1).fill('210');
  await page.getByRole('button', { name: 'Старт за таблицею виробника' }).click();
  await expect(page.getByText(/Заповнено за таблицею виробника: 7\./)).toBeVisible();
  await expect(page.getByLabel('Тиск', { exact: true }).nth(0)).toHaveValue('89');
  await expect(page.getByLabel('LSR', { exact: true }).nth(0)).toHaveValue('7');
  await expect(page.getByLabel('HSR', { exact: true }).nth(0)).toHaveValue('6');
  await expect(page.getByLabel('HSC', { exact: true }).nth(0)).toHaveValue('5');
  await expect(page.getByLabel('LSC', { exact: true }).nth(0)).toHaveValue('10');
  await expect(page.getByLabel('Токени', { exact: true }).nth(0)).toHaveValue('2');
  await expect(page.getByLabel('LSR', { exact: true }).nth(1)).toHaveValue('7');
  await expect(page.getByLabel('HSR', { exact: true }).nth(1)).toHaveValue('4');
  await shot(page, '22-manufacturer-start');
  await page.getByRole('button', { name: 'Зберегти' }).click();
  await expect(page.getByText(/Вилка: 89 psi/)).toBeVisible();
});
