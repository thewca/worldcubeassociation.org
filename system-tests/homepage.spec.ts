import { test, expect } from '@playwright/test';

test('displays placeholder homepage text', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('No homepage content yet, go ahead and add some!')).toBeVisible();
});
