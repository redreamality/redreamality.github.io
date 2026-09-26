import { test, expect } from '@playwright/test';

for (const prefix of ['', '/cn', '/ja']) {
  for (const [width, columns] of [[390, 1], [768, 2], [1440, 3]]) {
    test(`compact visual cards ${prefix || 'en'} at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`${prefix}/`);
      const cards = page.locator('[data-home-visual-card]');
      const count = await cards.count();
      expect(count).toBeGreaterThan(3);
      const boxes = await cards.evaluateAll(elements => elements.map(element => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x, y, width, height };
      }));
      expect(boxes.filter(box => Math.abs(box.y - boxes[0].y) < 1)).toHaveLength(columns);
      for (const box of boxes) {
        expect(box.height).toBeLessThan(420);
        expect(box.width).toBeLessThan(400);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
      }
      await expect(cards.first().locator('.visual-thumbnail')).toHaveCSS('height', '128px');
      await expect(cards.first().locator('h3')).toHaveCSS('font-size', '18px');
      const destination = await cards.first().getAttribute('href');
      await cards.first().focus();
      await expect(cards.first()).toHaveCSS('outline-style', 'solid');
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(new RegExp(`${destination}$`));
      await expect(page.locator('body > nav')).toBeVisible();
    });
  }
}
