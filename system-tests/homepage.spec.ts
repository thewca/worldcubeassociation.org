import { test, expect } from '@playwright/test';

test('displays placeholder homepage text', async ({ page }) => {
  await page.goto('http://localhost:3001/');

  // Expect a title "to contain" a substring.
  await expect(page.getByText('No homepage content yet, go ahead and add some!')).toBeVisible();
});
