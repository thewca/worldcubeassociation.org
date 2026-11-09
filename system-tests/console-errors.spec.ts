import { test, expect, type Page } from '@playwright/test';
import type { Route } from 'nextjs-routes';

type StaticPage = Exclude<Exclude<Route, { query: unknown }>['pathname'], `/api/${string}`>;

const pageAccess: Record<StaticPage, 'public' | 'requires-login'> = {
  '/': 'public',
  '/about': 'public',
  '/competitions': 'public',
  '/competitions/live': 'public',
  '/competitions/mine': 'requires-login',
  '/dashboard': 'requires-login',
  '/delegates': 'public',
  '/disclaimer': 'public',
  '/documents': 'public',
  '/executives': 'public',
  '/export/developer': 'public',
  '/export/results': 'public',
  '/faq': 'public',
  '/incidents': 'public',
  '/logo': 'public',
  '/officers-and-board': 'public',
  '/organizations': 'public',
  '/posts': 'public',
  '/privacy': 'public',
  '/regulations': 'public',
  '/regulations/about': 'public',
  '/regulations/history': 'public',
  '/regulations/scrambles': 'public',
  '/regulations/translations': 'public',
  '/results/rankings': 'public',
  '/results/records': 'public',
  '/score-tools': 'public',
  '/search': 'public',
  '/speedcubing-history': 'public',
  '/teams-committees': 'public',
  '/translators': 'public',
};

const routes = Object.entries(pageAccess)
  .filter(([, access]) => access === 'public')
  .map(([route]) => route);

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });

  page.on('pageerror', (error) => {
    errors.push(error.message);
  });

  return errors;
}

test.describe('console errors', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'React warnings are browser-independent');

  for (const route of routes) {
    test(`${route} has no console errors`, async ({ page }) => {
      const errors = collectConsoleErrors(page);

      await page.goto(route);

      const navbar = page.getByTestId('header-navbar');
      await expect(navbar.getByRole('link', { name: 'WCA Logo' })).toBeVisible();

      expect(errors).toEqual([]);
    });
  }
});
