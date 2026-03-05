import { test, expect } from '@playwright/test';

test('has title and displays main buttons', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Pingo/);

  // Expect Host and Join links to be visible
  await expect(page.getByRole('link', { name: /Host a Game/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Join a Game/i })).toBeVisible();
});

test('can navigate to create page via Host button', async ({ page }) => {
  await page.goto('/');

  // Click the host game link
  await page.getByRole('link', { name: /Host a Game/i }).click();

  // URL should now point to /create
  await expect(page).toHaveURL(/.*\/create/);

  // Form elements should be present
  await expect(page.getByText('Lobby Settings')).toBeVisible();
});

test('can navigate to join page via Join button', async ({ page }) => {
  await page.goto('/');

  // Click the join game link
  await page.getByRole('link', { name: /Join a Game/i }).click();

  // URL should now point to /join
  await expect(page).toHaveURL(/.*\/join/);

  // Form elements should be present
  await expect(page.getByLabel('Room Code')).toBeVisible();
});
