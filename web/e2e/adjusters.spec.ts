import { expect, test, type Page } from '@playwright/test';

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `${process.env.SHOTS_DIR ?? 'test-results'}/${test.info().project.name}-${name}.png` });

test('describes the damper, fills starting values and applies a tip', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Велосипед', exact: true }).click();
  await page.getByLabel('Назва', { exact: true }).fill('Megatower');
  await page.getByLabel('Швидкісний відскок (HSR)').first().check();
  const forkMax = page.getByLabel('Макс.', { exact: true });
  await forkMax.nth(0).fill('18');
  await forkMax.nth(1).fill('8');
  await forkMax.nth(2).fill('16');
  await forkMax.nth(3).fill('8');
  await shot(page, '11-bike-adjusters');
  await page.getByRole('button', { name: 'Зберегти' }).click();
  await expect(page.getByText('Megatower')).toBeVisible();

  await page.getByText('Megatower').click();
  await expect(page.getByText('LSR 18 · HSR 8 · LSC 16 · HSC 8')).toBeVisible();
  await page.getByRole('button', { name: 'Новий сетап' }).click();
  await page.getByRole('button', { name: 'Заповнити стартові значення' }).click();
  await expect(page.getByText(/Заповнено: \d+/)).toBeVisible();
  await expect(page.getByLabel('HSR', { exact: true }).first()).toHaveValue('4');
  await expect(page.getByLabel('LSR', { exact: true }).first()).toHaveValue('9');
  await expect(page.getByLabel('Sag', { exact: true }).first()).toHaveValue('22.5');
  await expect(page.getByText('Рекомендовано для цього типу байка: 20–25%')).toBeVisible();
  await page.getByText('Рекомендовано для цього типу байка: 20–25%').scrollIntoViewIfNeeded();
  await shot(page, '12-starting-values');

  await page.getByRole('button', { name: 'Збільшити: HSR' }).first().click();
  await page.getByRole('button', { name: 'Збільшити: HSR' }).first().click();
  await page.getByRole('button', { name: 'Збільшити: HSR' }).first().click();
  await page.getByRole('button', { name: 'Збільшити: HSR' }).first().click();
  await page.getByRole('button', { name: 'Збільшити: HSR' }).first().click();
  await expect(page.getByLabel('HSR', { exact: true }).first()).toHaveValue('8');
  await page.getByLabel('HSR', { exact: true }).first().fill('9');
  await expect(page.getByRole('button', { name: 'Зберегти' })).toBeDisabled();
  await page.getByLabel('HSR', { exact: true }).first().fill('4');
  await page.getByRole('button', { name: 'Зберегти' }).click();

  await page.getByText(/^Вилка:/).click();
  await expect(page.getByText('4 / 8')).toHaveCount(2);
  await page.getByRole('button', { name: 'Що не так?' }).click();
  await page.getByText('Вилку викидає після приземлень і великих ударів').click();
  await expect(page.getByText('HSR: закрити на 2 клацання')).toBeVisible();
  await expect(page.getByText('4 → 2 з 8')).toBeVisible();
  await shot(page, '13-advice');
  await page.getByRole('button', { name: 'Створити сетап із цією зміною' }).click();
  await expect(page.getByLabel('HSR', { exact: true }).first()).toHaveValue('2');
  await expect(page.getByLabel('Нотатки', { exact: true })).toHaveValue(
    'Пробую: Вилку викидає після приземлень і великих ударів. HSR: закрити на 2 клацання',
  );
  await page.getByRole('button', { name: 'Зберегти' }).click();
  await page.getByRole('button', { name: 'Назад' }).click();
  await page.getByRole('button', { name: 'Назад' }).click();
  await expect(page.getByRole('button', { name: 'Історія (1)' })).toBeVisible();
});
