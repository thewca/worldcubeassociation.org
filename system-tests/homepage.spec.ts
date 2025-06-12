import { test, expect } from '@playwright/test';

test('displays placeholder homepage text', async ({ page }) => {
  await page.goto('http://localhost:3001/');

  await expect(page.getByText('im so goofy teehee')).toBeVisible();
});
