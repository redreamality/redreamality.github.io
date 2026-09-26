import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { classifyCoverage, localMetadata, normalizePage, parseSitemap, readGscSnapshot } from '../../scripts/gsc-coverage-audit.mjs';
import { contentSlug } from '../../scripts/content-slug.mjs';

describe('GSC coverage evidence boundaries', () => {
  it('does not convert an absent row into zero impressions', () => {
    const result = classifyCoverage([
      { url: 'https://redreamality.com/blog/old/', declaredDate: '2025-01-01' },
      { url: 'https://redreamality.com/blog/new/', declaredDate: '2026-09-24' },
    ], [], '2026-09-23');
    expect(result.map(page => page.status)).toEqual(['not-returned-in-page-table', 'declared-date-after-window']);
    expect(result[0]).not.toHaveProperty('impressions');
  });

  it('recognizes fragment and parameter impressions without adding them together', () => {
    const page = { url: 'https://redreamality.com/blog/sdk/', declaredDate: '2025-01-01' };
    const result = classifyCoverage([page], [{ url: `${page.url}?source=web#hooks`, impressions: 3 }], '2026-09-23');
    expect(result[0].status).toBe('observed-impressions');
    expect(normalizePage(`${page.url}#hooks`)).toBe(page.url);
  });

  it('rejects filtered reports and detects the UI row limit', () => {
    const snapshot = {
      url: 'https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain%3Aredreamality.com&breakdown=page&start_date=20260624&end_date=20260923',
      text: 'Search type: Web (text)\nChart, containing counts from June 24, 2026 to September 23, 2026\n1-10 of 1,000',
      tables: [[['Top pages', 'Clicks', 'Impressions'], ...Array.from({ length: 1000 }, (_, i) => [`https://redreamality.com/blog/a-${i}/`, '0', '1'])]],
    };
    expect(readGscSnapshot(snapshot).atRowLimit).toBe(true);
    expect(() => readGscSnapshot({ ...snapshot, url: `${snapshot.url}&query=example` })).toThrow('Remove the query filter');
    expect(() => readGscSnapshot({ ...snapshot, url: snapshot.url.replace('20260624', '2026-06-24') })).toThrow('YYYYMMDD');
    expect(() => readGscSnapshot({ ...snapshot, text: 'Search type: Web (text)\nChart with stale dates' })).toThrow('visible chart date');
    expect(() => readGscSnapshot({ ...snapshot, url: `${snapshot.url}&type=image`, text: snapshot.text.replace('Web (text)', 'Image') })).toThrow('Web (text)');
    expect(() => readGscSnapshot({ ...snapshot, tables: [snapshot.tables[0].slice(0, 11)] })).toThrow('Incomplete');
    const duplicate = [...snapshot.tables[0]];
    duplicate[2] = duplicate[1];
    expect(() => readGscSnapshot({ ...snapshot, tables: [duplicate] })).toThrow('duplicate');
  });

  it('matches Astro mixed-case IDs, nested index files and explicit slugs', async () => {
    expect(contentSlug('Applying-MCTS-for-Customer-Engagement.md')).toBe('applying-mcts-for-customer-engagement');
    expect(contentSlug('Tutorials/index.mdx')).toBe('tutorials');
    expect(contentSlug('File.md', { slug: 'explicit-path' })).toBe('explicit-path');
    const metadata = await localMetadata(resolve('.'));
    for (const language of ['', '/cn', '/ja']) {
      for (const slug of ['applying-mcts-for-customer-engagement', 'awesome-manus-like-projects', 'how-to-use-super-in-python']) {
        const page = metadata.get(`https://redreamality.com${language}/blog/${slug}/`);
        expect(page?.source).toBeTruthy();
        expect(page?.declaredDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it('does not confuse hreflang alternatives with sitemap loc entries', () => {
    const parsed = parseSitemap('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml"><url><loc>https://redreamality.com/blog/a/</loc><xhtml:link rel="alternate" href="https://redreamality.com/cn/blog/a/"/></url></urlset>');
    expect(parsed).toEqual({ kind: 'urlset', urls: ['https://redreamality.com/blog/a/'] });
  });
});
