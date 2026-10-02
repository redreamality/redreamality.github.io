import { readdirSync } from 'node:fs';
import { test, expect, type Page, type TestInfo } from '@playwright/test';
import feed from '../src/data/library-notes.json' with { type: 'json' };
import { notesCopy } from '../src/utils/library-notes-i18n';
import { serializeJsonForScript } from '../src/utils/json-script';
import { isInternalHref } from '../src/utils/outbound';

const locales = [
  { lang: 'en', prefix: '', htmlLang: 'en', collection: 'notes-en' },
  { lang: 'zh', prefix: '/cn', htmlLang: 'zh-CN', collection: 'notes-cn' },
  { lang: 'ja', prefix: '/ja', htmlLang: 'ja', collection: 'notes-ja' },
] as const;
const entries = feed.entries;
const sample = entries[0];

test('JSON-LD preserves untrusted summary text without executing HTML', async ({ page }) => {
  const attack = '</script><script>window.__libraryNotesInjected=true</script><img id="injected-note">';
  await page.setContent(`<script type="application/ld+json">${serializeJsonForScript({
    headline: attack, description: attack,
  })}</script>`);
  await expect(page.locator('script')).toHaveCount(1);
  await expect(page.locator('#injected-note')).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as Record<string, unknown>).__libraryNotesInjected)).toBeUndefined();
  expect(JSON.parse((await page.locator('script').textContent())!).headline).toBe(attack);
});

test.beforeEach(async ({ context, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === origin ? route.continue() : route.abort(),
  );
});

async function shell(page: Page, lang: string) {
  await expect(page.locator('body > nav')).toHaveCount(1);
  await expect(page.locator('body > footer')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('html')).toHaveAttribute('lang', lang);
}

async function capture(page: Page, testInfo: TestInfo, name: string) {
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )).toBeLessThanOrEqual(1);
  const outside = await page.locator('body > main').evaluate((root) =>
    [...root.querySelectorAll('h1, h2, p, input, button, a, li')].filter((element) => {
      const box = element.getBoundingClientRect();
      return box.width > 0 && (box.left < -1 || box.right > innerWidth + 1);
    }).map((element) => element.tagName),
  );
  expect(outside).toEqual([]);
  const path = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true, animations: 'disabled' });
  await testInfo.attach(name, { path, contentType: 'image/png' });
}

for (const locale of locales) {
  const index = `${locale.prefix}/garden/notes/`;
  const detail = (id: string) => `${index}library/${id}/`;
  const c = notesCopy[locale.lang];
  const manualSlugs = readdirSync(new URL(`../src/content/${locale.collection}/`, import.meta.url))
    .filter((name) => /\.mdx?$/.test(name)).map((name) => name.replace(/\.mdx?$/, ''));
  const total = manualSlugs.length + entries.length;

  test(`${locale.lang}: unified list preserves manual routes, source counts and date order`, async ({ page }) => {
    expect((await page.goto(index))?.status()).toBe(200);
    await shell(page, locale.htmlLang);
    await expect(page.locator('h1')).toHaveText(c.title);
    await expect(page.locator('[data-note-kind="manual"]')).toHaveCount(manualSlugs.length);
    await expect(page.locator('[data-note-kind="library"]')).toHaveCount(entries.length);
    await expect(page.locator('[data-notes-count]')).toHaveText(c.count.replace('{count}', String(total)));
    const dates = await page.locator('[data-note-date]').evaluateAll((rows) =>
      rows.map((row) => Date.parse((row as HTMLElement).dataset.noteDate!)),
    );
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
    for (const note of entries) {
      const row = page.locator('[data-note-kind="library"]').filter({
        has: page.locator(`a[href="${detail(note.id)}"]`),
      });
      await expect(row.locator('h2 a')).toHaveText(note.title);
      await expect(row.locator('p[lang="zh-CN"]')).toHaveText(note.sentence);
      await expect(row).toContainText(c.ai);
      await expect(row).toContainText(c.chinese);
      await expect(row).toContainText(c.indexed);
      await expect(row.locator('[data-note-partial]')).toHaveCount(note.coverage.complete ? 0 : 1);
    }
    for (const slug of manualSlugs) {
      await expect(page.locator(`[data-note-kind="manual"] a[href="${index}${slug}/"]`)).toHaveCount(1);
    }
    if (manualSlugs.length) {
      await page.locator(`[data-note-link][href="${index}${manualSlugs[0]}/"]`).click();
      await expect(page).toHaveURL(new RegExp(`${index}${manualSlugs[0]}/$`));
      await shell(page, locale.htmlLang);
    }
  });

  test(`${locale.lang}: manual tags stay visible, searchable and unlinked`, async ({ page }) => {
    test.skip(!manualSlugs.length, 'No manual notes in this locale.');
    await page.goto(index);
    const href = `${index}${manualSlugs[0]}/`;
    const row = page.locator('[data-note-kind="manual"]').filter({
      has: page.locator(`a[href="${href}"]`),
    });
    const labels = row.locator('[data-note-tag]');
    expect(await labels.count()).toBeGreaterThan(0);
    const tags = (await labels.allTextContents()).map((tag) => tag.trim());
    for (const label of await labels.all()) {
      await expect(label).toBeVisible();
      expect(await label.evaluate((element) => element.tagName)).toBe('SPAN');
    }
    await expect(page.locator('[data-note-tags] a, [data-note-tags] button')).toHaveCount(0);
    await page.getByRole('searchbox', { name: c.search }).fill(tags[0].replace(/^#/, ''));
    await expect(row).toBeVisible();
    await row.locator('[data-note-link]').click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    const originalTags = (await page.locator('article header span').allTextContents())
      .map((text) => text.trim()).filter((text) => text.startsWith('#'));
    expect(tags).toEqual(originalTags);
  });

  test(`${locale.lang}: search, empty state, kind filters and clear are accessible`, async ({ page }) => {
    await page.goto(index);
    await expect(page.locator('notes-index')).toHaveAttribute('data-ready', 'true');
    const search = page.getByRole('searchbox', { name: c.search });
    const visible = page.locator('[data-note-kind]:visible');
    await page.getByRole('radio', { name: c.library, exact: true }).check();
    await expect(visible).toHaveCount(entries.length);
    await page.getByRole('radio', { name: c.manual, exact: true }).check();
    await expect(visible).toHaveCount(manualSlugs.length);
    await page.getByRole('radio', { name: c.all, exact: true }).check();
    await expect(visible).toHaveCount(total);
    if (sample) {
      await search.fill(sample.title);
      await expect(page.locator(`[data-note-link][href="${detail(sample.id)}"]`)).toBeVisible();
      const query = sample.title.normalize('NFKC').toLocaleLowerCase();
      const expected = await page.locator('[data-note-kind]').evaluateAll((rows, query) =>
        rows.filter((row) => (row as HTMLElement).dataset.noteSearch!
          .normalize('NFKC').toLocaleLowerCase().includes(query)).length, query);
      await expect(visible).toHaveCount(expected);
      await expect(page.getByRole('status')).toHaveText(c.count.replace('{count}', String(expected)));
    }
    await search.fill('NO_MATCH_LIBRARY_7c024cfca744470c8b53');
    await expect(visible).toHaveCount(0);
    await expect(page.locator('[data-notes-empty]')).toBeVisible();
    await expect(page.getByRole('status')).toHaveText(c.count.replace('{count}', '0'));
    await expect(page.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    await page.getByRole('radio', { name: c.library, exact: true }).check();
    await page.getByRole('button', { name: c.clear, exact: true }).click();
    await expect(search).toHaveValue('');
    await expect(search).toBeFocused();
    await expect(page.getByRole('radio', { name: c.all, exact: true })).toBeChecked();
    await expect(visible).toHaveCount(total);
    await expect(page.locator('[data-notes-empty]')).toBeHidden();
  });

  test(`${locale.lang}: keyboard opens escaped Chinese summary with source confirmation`, async ({ page }) => {
    test.skip(!sample, 'The public feed has no detail entries.');
    await page.goto(index);
    const link = page.locator(`[data-note-link][href="${detail(sample.id)}"]`);
    await link.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`${detail(sample.id)}$`));
    await shell(page, locale.htmlLang);
    await expect(page.locator('h1')).toHaveText(sample.title);
    const structured = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
    expect(structured.headline).toBe(sample.title);
    expect(structured.description).toBe(sample.sentence);
    await expect(page.locator('[data-library-summary]')).toHaveAttribute('lang', 'zh-CN');
    await expect(page.locator('[data-library-summary] > p')).toHaveText(sample.sentence);
    await expect(page.locator('[data-library-summary] h2')).toHaveText(sample.bullets.map((bullet) => bullet.heading));
    await expect(page.locator('[data-library-summary] li')).toHaveText(sample.bullets.flatMap((bullet) => bullet.details));
    await expect(page.locator('[data-library-summary] script, [data-library-summary] iframe')).toHaveCount(0);
    await expect(page.locator('meta[property="article:published_time"]')).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://redreamality.com${detail(sample.id)}`);
    const destination = new URL(sample.url).toString();
    if (isInternalHref(sample.url)) {
      await expect(page.locator('[data-library-source]')).toHaveAttribute('href', sample.url);
      return;
    }
    await expect(page.locator('[data-library-source]')).toHaveAttribute('href', `${locale.prefix}/go/?to=${encodeURIComponent(destination)}`);
    await page.locator('[data-library-source]').click();
    await expect(page).toHaveURL((url) => url.pathname === `${locale.prefix}/go/` && url.searchParams.get('to') === destination);
    await expect(page.locator('#outbound-continue')).toHaveAttribute('href', destination);
  });

  test(`${locale.lang}: partial coverage and language switching keep stable full IDs`, async ({ page }) => {
    test.skip(!sample, 'The public feed has no detail entries.');
    const note = entries.find((entry) => !entry.coverage.complete) ?? sample;
    await page.goto(detail(note.id));
    await expect(page.locator('[data-note-partial]')).toHaveCount(note.coverage.complete ? 0 : 1);
    if (!note.coverage.complete) await expect(page.locator('[data-note-partial]')).toContainText(c.partial);
    for (const target of locales.filter((target) => target.lang !== locale.lang)) {
      const path = `${target.prefix}/garden/notes/library/${note.id}/`;
      await page.locator('#language-toggle-btn-desktop').click();
      await page.locator(`#language-dropdown-desktop a[href="${path}"]`).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await shell(page, target.htmlLang);
      await expect(page.locator('[data-library-summary] > p')).toHaveText(note.sentence);
    }
  });

  test(`${locale.lang}: no-JS list keeps every entry and hides inactive controls`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const origin = new URL(baseURL!).origin;
    await context.route('**/*', (route) =>
      new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    try {
      const page = await context.newPage();
      await page.goto(index);
      await expect(page.locator('[data-note-kind]:visible')).toHaveCount(total);
      await expect(page.locator('[data-notes-controls]')).toBeHidden();
      if (sample) {
        await page.locator(`[data-note-link][href="${detail(sample.id)}"]`).click();
        await expect(page.locator('[data-library-summary] > p')).toHaveText(sample.sentence);
      }
    } finally {
      await context.close();
    }
  });

  for (const width of [320, 390]) {
    test(`${locale.lang}: ${width}px reading layout and dark mode`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
      await page.goto(index);
      await capture(page, testInfo, 'notes-list-light');
      await page.locator('.theme-toggle:visible').click();
      await expect(page.locator('html')).toHaveClass(/dark/);
      await capture(page, testInfo, 'notes-list-dark');
      if (sample) {
        await page.goto(detail(sample.id));
        await expect(page.locator('html')).toHaveClass(/dark/);
        await capture(page, testInfo, 'notes-detail-dark');
        await page.locator('.theme-toggle:visible').click();
        await expect(page.locator('html')).not.toHaveClass(/dark/);
        await capture(page, testInfo, 'notes-detail-light');
      }
    });
  }

  test(`${locale.lang}: notes alias redirects to the existing canonical index`, async ({ page }) => {
    await page.goto(`${locale.prefix}/notes/`);
    await expect(page).toHaveURL(new RegExp(`${index}$`));
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://redreamality.com${index}`);
  });

  test(`${locale.lang}: library alias redirects with the full stable ID`, async ({ page }) => {
    test.skip(!sample, 'The public feed has no detail entries.');
    await page.goto(`${locale.prefix}/notes/library/${sample.id}/`);
    await expect(page).toHaveURL(new RegExp(`${detail(sample.id)}$`));
    await shell(page, locale.htmlLang);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://redreamality.com${detail(sample.id)}`);
    await expect(page.locator('[data-library-summary] > p')).toHaveText(sample.sentence);
  });
}

test('sitemap includes all public library details and excludes notes aliases', async ({ page, request }) => {
  const response = await request.get('/sitemap-index.xml');
  expect(response.ok()).toBeTruthy();
  const sitemaps = await page.evaluate((xml) => [...new DOMParser()
    .parseFromString(xml, 'application/xml').querySelectorAll('sitemap > loc')]
    .map((node) => new URL(node.textContent!).pathname), await response.text());
  expect(sitemaps.length).toBeGreaterThan(0);
  const paths: string[] = [];
  for (const path of sitemaps) {
    const response = await request.get(path);
    expect(response.ok()).toBeTruthy();
    paths.push(...await page.evaluate((xml) => [...new DOMParser()
      .parseFromString(xml, 'application/xml').querySelectorAll('url > loc')]
      .map((node) => new URL(node.textContent!).pathname), await response.text()));
  }
  for (const locale of locales) {
    expect(paths).not.toContain(`${locale.prefix}/notes/`);
    expect(paths).toContain(`${locale.prefix}/garden/notes/`);
    for (const note of entries) {
      expect(paths.filter((path) => path === `${locale.prefix}/garden/notes/library/${note.id}/`)).toHaveLength(1);
    }
  }
  expect(paths.some((path) => /^\/(?:cn\/|ja\/)?notes\/library\//.test(path))).toBe(false);
});

test('desktop notes list and summary remain readable', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
  await page.goto('/cn/garden/notes/');
  await capture(page, testInfo, 'notes-desktop-list');
  if (sample) {
    await page.goto(`/cn/garden/notes/library/${sample.id}/`);
    await capture(page, testInfo, 'notes-desktop-detail');
  }
});
