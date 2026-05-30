import { test, expect } from '@playwright/test';

test('home page shows brand title, tags, stepper, and theme toggle flips', async ({
    page,
    browserName,
}) => {
    // Skip theme toggle checks on webkit due to default browser rendering stubs
    const skipThemeTest = browserName === 'webkit';

    // Force theme to dark and suppress guide modal auto-popup
    await page.addInitScript(() => {
        localStorage.setItem('theme', 'dark');
        localStorage.setItem('hasSeenGuide', 'true');
    });
    await page.goto('/');

    // 1. Verify main heading title
    const title = page.getByText('Adelaide University').first();
    await expect(title).toBeVisible();

    const subTitle = page.getByText('Course Reviews').first();
    await expect(subTitle).toBeVisible();

    // 2. Verify tagging disclaimer text
    const tag = page.getByText('By students, for students', { exact: false }).first();
    await expect(tag).toBeVisible();

    // 3. Verify main buttons (Browse and Login)
    const browseBtn = page.locator('a').filter({ hasText: /Browse Course/i }).first();
    await expect(browseBtn).toBeVisible();
    await expect(browseBtn).toHaveAttribute('href', '/courses');

    // 4. Verify 4-stage stepper instructions
    await expect(page.getByText('How it Works').first()).toBeVisible();
    await expect(page.getByText('1').first()).toBeVisible();
    await expect(page.getByText('Browse', { exact: true }).first()).toBeVisible();

    await expect(page.getByText('2').first()).toBeVisible();
    await expect(page.getByText('Login', { exact: true }).first()).toBeVisible();

    await expect(page.getByText('3').first()).toBeVisible();
    await expect(page.getByText('Review', { exact: true }).first()).toBeVisible();

    await expect(page.getByText('4').first()).toBeVisible();
    await expect(page.getByText('Discuss', { exact: true }).first()).toBeVisible();

    // 5. Verify and toggle dark mode classes on html
    if (!skipThemeTest) {
        const themeBtn = page.getByRole('button', { name: /Toggle Theme/i }).first();
        await expect(themeBtn).toBeVisible();

        const html = page.locator('html');
        const wasDark = await html.evaluate((node) => node.classList.contains('dark'));
        
        // Toggle theme click
        await themeBtn.click({ force: true });
        await page.waitForTimeout(300);

        // Verify flip
        await expect
            .poll(async () => html.evaluate((node) => node.classList.contains('dark')))
            .toBe(!wasDark);
    }
});
