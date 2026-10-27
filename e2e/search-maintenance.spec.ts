import { test, expect } from '@playwright/test';

const families = [
  ['blog', 'openspec-tutorial-cli-commands-agents-md-examples'],
  ['blog', 'openspec-1-5-stores-beta-update-guide'],
  ['blog', 'claude-md-agents-md-deep-dive'],
  ['blog', 'typesafe-jev-use-cases'],
  ['blog', '-sddbmad-vs-spec-kit-vs-openspec-vs-promptx'],
  ['blog', 'byobu-cheatsheet'],
  ['blog', 'pythonpathvs-code'],
  ['blog', 'claude-agent-sdk-python-'],
  ['garden/notes', 'pstack-skills-guide'],
  ['garden/notes', 'bmad-method-guide'],
  ['garden/notes', 'openspec-guide'],
];

for (const prefix of ['', '/cn', '/ja']) {
  test(`maintained search pages keep their URLs, headings and linked examples: ${prefix || 'en'}`, async ({ page, request }) => {
    test.setTimeout(180_000);
    const sitemap = await request.get('/sitemap-0.xml');
    expect(sitemap.status()).toBe(200);
    const sitemapText = await sitemap.text();
    const checkedAssets = new Set<string>();
    for (const [section, slug] of families) {
      const path = `${prefix}/${section}/${slug}/`;
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), path).toBe(200);
      await expect(page.locator('h1'), path).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]'), path)
        .toHaveAttribute('href', `https://redreamality.com${path}`);
      expect(sitemapText, path).toContain(`<loc>https://redreamality.com${path}</loc>`);
      expect(await page.locator('meta[name="robots"]').getAttribute('content') ?? '', path).not.toContain('noindex');
      const main = page.locator('main article');
      await expect(main.locator('h2').first(), path).toBeVisible();
      const brokenAnchors = await main.locator('a[href^="#"]').evaluateAll(links => links.flatMap(link => {
        const href = link.getAttribute('href');
        if (!href || href === '#') return [];
        const id = decodeURIComponent(href.slice(1));
        return document.getElementById(id) ? [] : [href];
      }));
      expect(brokenAnchors, `${path} in-page answers must be reachable`).toEqual([]);
      const assets = await main.locator('a[href^="/assets/"]').evaluateAll(links =>
        links.map(link => link.getAttribute('href')).filter((href): href is string => href !== null));
      for (const href of assets) {
        if (checkedAssets.has(href)) continue;
        checkedAssets.add(href);
        const download = await request.get(href);
        expect(download.status(), `${path} download ${href}`).toBe(200);
        expect((await download.body()).length, href).toBeGreaterThan(0);
      }
      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 844 });
        const contentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(contentWidth, `${path} at ${width}px`).toBeLessThanOrEqual(width + 1);
      }
      await page.setViewportSize({ width: 1280, height: 720 });
    }
  });
}

test('pstack comparison table scrolls by keyboard without moving the page', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/garden/notes/pstack-skills-guide/', { waitUntil: 'domcontentloaded' });
  const table = page.getByRole('region', { name: 'Host / Installation and entry / Boundary', exact: true });
  await table.focus();
  await expect(table).toBeFocused();
  expect(await table.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => table.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.scrollX)).toBe(0);
});

for (const prefix of ['', '/cn', '/ja']) {
  test(`instruction comparison remains readable on mobile: ${prefix || 'en'}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${prefix}/blog/claude-md-agents-md-deep-dive/`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toBeVisible();
    const width = await page.evaluate(() => ({
      content: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));
    expect(width.content).toBeLessThanOrEqual(width.viewport + 1);
    await page.screenshot({ path: `test-results/search-maintenance/instructions-${prefix.replace('/', '') || 'en'}-mobile.png` });
  });
}
