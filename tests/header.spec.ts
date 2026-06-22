import { test, expect } from '@playwright/test';

test('header navigation bar renders branding and links successfully', async ({ page }) => {
    // Suppress guide modal auto-popup
    await page.addInitScript(() => {
        localStorage.setItem('hasSeenGuide', 'true');
    });
    await page.goto('/');

    // 1. Check brand branding container
    const brand = page.getByRole('navigation').locator('h1, span').filter({ hasText: 'MyCourse' }).first();
    await expect(brand).toBeVisible();

    // 2. Verify "How to Use Guide" icon button is rendering inside navbar
    const guideBtn = page.getByRole('button', { name: /How to Use Guide/i }).first();
    await expect(guideBtn).toBeVisible();

    // Verify "Give Feedback" icon link is rendering inside navbar
    const feedbackLink = page.getByRole('link', { name: /Give Feedback/i }).first();
    await expect(feedbackLink).toBeVisible();

    // 3. Verify Theme Toggle is rendering inside navbar
    const themeBtn = page.getByRole('button', { name: /Toggle Theme/i }).first();
    await expect(themeBtn).toBeVisible();

    // 4. Verify Auth CTA (Login button) is rendering inside navbar
    const loginBtn = page.getByRole('navigation').getByRole('button', { name: /Login/i }).first();
    await expect(loginBtn).toBeVisible();
});
