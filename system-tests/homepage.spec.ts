import { test, expect } from '@playwright/test';

test('displays WCA Logo in header', async ({ page }) => {
  await page.goto('/');

  const navbar = page.getByTestId('header-navbar');
  await expect(navbar.getByAltText('WCA Logo')).toBeVisible();
});
