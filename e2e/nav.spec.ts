import { test, expect } from '@playwright/test';

test.describe('Mobile navigation + Garden dropdown', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('hamburger opens menu and Garden dropdown exposes Meditations', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // The collapsible menu is hidden until the hamburger is tapped.
    const menu = page.locator('#navbar-default');
    await expect(menu).toBeHidden();

    await page.locator('#mobile-menu-button').click();
    await expect(menu).toBeVisible();

    // Open the Garden dropdown (mobile click-toggle).
    await page.locator('#garden-menu-toggle').click();
    const dropdown = page.locator('#garden-dropdown');

    // The new Meditations entry must be present, visible, and point to the right route.
    const meditations = dropdown.getByRole('link', { name: 'Meditations' });
    await expect(meditations).toBeVisible();
    await expect(meditations).toHaveAttribute('href', '/garden/meditations/');
    await meditations.click();
    await expect(page).toHaveURL(/\/garden\/meditations\/$/);
    await expect(page.locator('h1')).toContainText('Meditations');
  });
});
