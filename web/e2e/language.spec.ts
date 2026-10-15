import { expect, test } from '@playwright/test';

test.use({ locale: 'de-DE' });

test('follows the device language and remembers a manual choice', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Meine Bikes' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');

  await page.getByRole('button', { name: 'Bike', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill('Spectral');
  await page.getByLabel('Dämpfer', { exact: true }).selectOption('COIL');
  await expect(page.getByLabel('Dämpfer', { exact: true }).locator('option:checked')).toHaveText('Stahlfeder');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByText('Noch keine Setups')).toBeVisible();

  await page.getByRole('button', { name: 'Einstellungen' }).click();
  await page.getByLabel('Sprache', { exact: true }).selectOption('en');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByText('No setups yet')).toBeVisible();

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByLabel('Language', { exact: true }).selectOption('uk');
  await expect(page.getByRole('heading', { name: 'Налаштування' })).toBeVisible();
  await page.getByLabel('Мова', { exact: true }).selectOption('auto');
  await expect(page.getByRole('heading', { name: 'Einstellungen' })).toBeVisible();
});
