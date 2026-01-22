import { test, expect } from '@playwright/test';

test.describe('App Smoke Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the homepage and show core elements', async ({ page }) => {
    // 1. Verify Title
    await expect(page).toHaveTitle(/Ready2Work/);

    // 2. Verify Hero Section present
    const heroHeading = page.getByRole('heading', { level: 1 }).first();
    await expect(heroHeading).toBeVisible();
  });

  test('should navigate to Role Selection when clicking Get Started', async ({ page }) => {
    // 1. Find the "Get Started" or "Start" CTA
    // Note: Using a robust selector strategy
    const startButton = page.getByRole('button', { name: /Start Session|Get Started/i }).first();

    await expect(startButton).toBeVisible();
    await startButton.click();

    // 2. Verify navigation to Role Selection
    await expect(page).toHaveURL(/.*role-selection/);

    // 3. Verify Role Grid is present
    await expect(page.getByText('Service & Operations')).toBeVisible();
    await expect(page.getByText('Tech & Corporate')).toBeVisible();
  });
});
