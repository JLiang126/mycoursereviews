import { test, expect } from '@playwright/test';

test('header navigation bar renders branding and links successfully', async ({ page }) => {
    await page.goto('/');

    // 1. Check brand branding container
    const brand = page.getByRole('navigation').locator('span').filter({ hasText: 'MyCourse' }).first();
    await expect(brand).toBeVisible();

    // 2. Check main desktop navigation links
    const homeLink = page.getByRole('navigation').getByRole('link', { name: 'Home' }).first();
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toHaveAttribute('href', '/');

    const browseLink = page.getByRole('navigation').getByRole('link', { name: 'Browse Courses' }).first();
    await expect(browseLink).toBeVisible();
    await expect(browseLink).toHaveAttribute('href', '/courses');

    const termsLink = page.getByRole('navigation').getByRole('link', { name: 'Terms & Conditions' }).first();
    await expect(termsLink).toBeVisible();
    await expect(termsLink).toHaveAttribute('href', '/terms');

    // 3. Verify Theme Toggle is rendering inside navbar
    const themeBtn = page.getByRole('navigation').locator('button').filter({ hasText: /🌞|🌚/ }).first();
    await expect(themeBtn).toBeVisible();

    // 4. Verify Auth CTA (Login button) is rendering inside navbar
    const loginBtn = page.getByRole('navigation').getByRole('button', { name: /Login/i }).first();
    await expect(loginBtn).toBeVisible();
});
