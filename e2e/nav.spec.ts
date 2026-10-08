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

// Desktop header: the nav items sit inside a rounded "pill" (the <ul> background).
// Regression guard for the pill being exactly as wide/tall as its text (no inner
// padding) and for the Japanese labels wrapping the header onto two rows.
test.describe('Desktop navigation pill', () => {
  for (const prefix of ['', '/cn', '/ja']) {
    for (const width of [1024, 1280, 1440]) {
      test(`pill contains its items with padding ${prefix || 'en'} at ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(`${prefix}/`, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('#mobile-menu-button')).toBeHidden();
        const pill = page.locator('#navbar-default > ul');
        await expect(pill).toBeVisible();

        const m = await page.evaluate(() => {
          const nav = document.querySelector('body > nav')!.getBoundingClientRect();
          const ul = document.querySelector('#navbar-default > ul')!;
          const u = ul.getBoundingClientRect();
          const items = [...ul.querySelectorAll(':scope > li > a, :scope > li > button')]
            .filter((el) => (el as HTMLElement).offsetParent !== null)
            .map((el) => {
              const r = el.getBoundingClientRect();
              const range = document.createRange();
              range.selectNodeContents(el);
              const text = range.getBoundingClientRect();
              return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, textLeft: text.left, textRight: text.right };
            });
          return { navH: nav.height, u: { left: u.left, right: u.right, top: u.top, bottom: u.bottom }, items, hScroll: document.documentElement.scrollWidth > innerWidth };
        });

        expect(m.items).toHaveLength(5);
        expect(m.hScroll).toBe(false);
        // Single header row.
        expect(m.navH).toBeLessThanOrEqual(80);
        for (const it of m.items) {
          // Every item box is inside the pill, on one row.
          expect(it.left).toBeGreaterThanOrEqual(m.u.left);
          expect(it.right).toBeLessThanOrEqual(m.u.right);
          expect(it.top).toBeGreaterThanOrEqual(m.u.top);
          expect(it.bottom).toBeLessThanOrEqual(m.u.bottom);
          expect(Math.abs(it.top - m.items[0].top)).toBeLessThanOrEqual(1);
        }
        // Visible inner padding between the first/last label and the pill edge.
        expect(m.items[0].textLeft - m.u.left).toBeGreaterThanOrEqual(12);
        expect(m.u.right - m.items[4].textRight).toBeGreaterThanOrEqual(12);
      });
    }
  }

  test('collapses to the hamburger menu below lg', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 800 });
    await page.goto('/ja/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#mobile-menu-button')).toBeVisible();
    await expect(page.locator('#navbar-default')).toBeHidden();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });

  test('Garden dropdown opens on hover', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/cn/', { waitUntil: 'domcontentloaded' });
    await page.locator('#garden-menu-toggle').hover();
    const link = page.locator('.nav-dropdown-desktop a[href="/cn/garden/meditations/"]');
    await expect(link).toBeVisible();
  });
});
