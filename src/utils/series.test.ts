import { describe, expect, it } from 'vitest';
import { SERIES, SERIES_SLUGS, getSeriesConfig, getSeriesTitle } from '../data/series';
import {
  filterHomeFeedPosts,
  getSeriesDay,
  getSeriesEntries,
  getSeriesIndexHref,
  getSeriesNeighbors,
  getSeriesSlugsWithEntries,
  groupPostsBySeries,
  isHomeFeedEligible,
  summarizeSeries,
} from './series';

type Post = {
  slug: string;
  data: { title: string; pubDate: Date; series?: string; seriesDay?: number; humanInterventions?: number };
};

const post = (slug: string, date: string, extra: Partial<Post['data']> = {}): Post => ({
  slug,
  data: { title: slug, pubDate: new Date(`${date}T00:00:00Z`), ...extra },
});

const MMN = 'money-machine-nightly';

describe('series config', () => {
  it('registers money-machine-nightly with zh/en titles and home exclusion', () => {
    expect(SERIES_SLUGS).toContain(MMN);
    const config = getSeriesConfig(MMN)!;
    expect(config.excludeFromHome).toBe(true);
    expect(config.tag).toBe(MMN);
    expect(getSeriesTitle(config, 'zh')).toBe('赚钱机器夜报');
    expect(getSeriesTitle(config, 'en')).toBe('Money Machine Nightly');
    // No Japanese title configured: falls back to English rather than an empty label.
    expect(getSeriesTitle(config, 'ja')).toBe('Money Machine Nightly');
    expect(config.intro.zh?.length).toBeGreaterThanOrEqual(1);
  });

  it('every configured series has a matching slug key and kebab-case slug', () => {
    for (const [key, config] of Object.entries(SERIES)) {
      expect(config.slug).toBe(key);
      expect(key).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it('returns undefined for missing or unknown series', () => {
    expect(getSeriesConfig(undefined)).toBeUndefined();
    expect(getSeriesConfig('nope')).toBeUndefined();
  });
});

describe('home feed filter', () => {
  it('keeps formal posts and drops excluded series entries', () => {
    const formal = post('formal', '2026-10-01');
    const nightly = post('money-machine-nightly-2026-10-09', '2026-10-09', { series: MMN, seriesDay: 1 });
    expect(isHomeFeedEligible(formal)).toBe(true);
    expect(isHomeFeedEligible(nightly)).toBe(false);
    expect(filterHomeFeedPosts([nightly, formal]).map((p) => p.slug)).toEqual(['formal']);
  });

  it('treats unknown series as excluded so stray entries cannot flood the home page', () => {
    expect(isHomeFeedEligible(post('x', '2026-10-01', { series: 'unregistered' }))).toBe(false);
  });

  it('daily entries no longer push formal posts out of the latest 12', () => {
    const formals = Array.from({ length: 12 }, (_, i) => post(`formal-${i}`, `2026-09-${String(10 + i).padStart(2, '0')}`));
    const nightlies = Array.from({ length: 10 }, (_, i) =>
      post(`nightly-${i}`, `2026-10-${String(1 + i).padStart(2, '0')}`, { series: MMN }),
    );
    const sorted = [...nightlies, ...formals].sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
    const latest = filterHomeFeedPosts(sorted).slice(0, 12);
    expect(latest).toHaveLength(12);
    expect(latest.every((p) => p.slug.startsWith('formal-'))).toBe(true);
    // Order of the remaining feed is preserved (newest first).
    expect(latest[0].slug).toBe('formal-11');
  });
});

describe('series grouping', () => {
  const entries = [
    post('formal', '2026-10-05'),
    post('d1', '2026-10-09', { series: MMN, seriesDay: 1, humanInterventions: 1 }),
    post('d3', '2026-10-11', { series: MMN, seriesDay: 3 }),
    post('d2', '2026-10-10', { series: MMN, seriesDay: 2, humanInterventions: 2 }),
  ];

  it('collects entries of one series newest first', () => {
    expect(getSeriesEntries(entries, MMN).map((p) => p.slug)).toEqual(['d3', 'd2', 'd1']);
  });

  it('breaks same-day ties by seriesDay', () => {
    const sameDay = [post('a', '2026-10-09', { series: MMN, seriesDay: 1 }), post('b', '2026-10-09', { series: MMN, seriesDay: 2 })];
    expect(getSeriesEntries(sameDay, MMN).map((p) => p.slug)).toEqual(['b', 'a']);
  });

  it('groups by series and skips posts without one', () => {
    const groups = groupPostsBySeries(entries);
    expect([...groups.keys()]).toEqual([MMN]);
    expect(groups.get(MMN)!.map((p) => p.slug)).toEqual(['d3', 'd2', 'd1']);
  });

  it('only generates index pages for configured series with at least one entry', () => {
    expect(getSeriesSlugsWithEntries([post('formal', '2026-10-05')])).toEqual([]);
    expect(getSeriesSlugsWithEntries(entries)).toEqual([MMN]);
    expect(getSeriesSlugsWithEntries([post('x', '2026-10-01', { series: 'unregistered' })])).toEqual([]);
  });

  it('computes prev (older) and next (newer) neighbors', () => {
    const list = getSeriesEntries(entries, MMN);
    expect(getSeriesNeighbors(list, 'd2')).toEqual({ prev: list[2], next: list[0] });
    expect(getSeriesNeighbors(list, 'd1').prev).toBeNull();
    expect(getSeriesNeighbors(list, 'd3').next).toBeNull();
    expect(getSeriesNeighbors(list, 'missing')).toEqual({ prev: null, next: null });
  });

  it('uses seriesDay when present, else the position in date order', () => {
    const list = getSeriesEntries(
      [post('a', '2026-10-09', { series: MMN }), post('b', '2026-10-10', { series: MMN }), post('c', '2026-10-11', { series: MMN, seriesDay: 0 })],
      MMN,
    );
    expect(getSeriesDay(list.find((p) => p.slug === 'a')!, list)).toBe(1);
    expect(getSeriesDay(list.find((p) => p.slug === 'b')!, list)).toBe(2);
    expect(getSeriesDay(list.find((p) => p.slug === 'c')!, list)).toBe(0);
  });

  it('summarizes cumulative numbers from frontmatter', () => {
    const summary = summarizeSeries(getSeriesEntries(entries, MMN));
    expect(summary).toMatchObject({
      entryCount: 3,
      latestDay: 3,
      humanInterventions: 3,
      humanInterventionsReported: 2,
    });
    expect(summary.firstDate?.toISOString().slice(0, 10)).toBe('2026-10-09');
    expect(summary.latestDate?.toISOString().slice(0, 10)).toBe('2026-10-11');
  });

  it('summarizes an empty series without throwing', () => {
    expect(summarizeSeries([])).toEqual({
      entryCount: 0,
      latestDay: null,
      firstDate: null,
      latestDate: null,
      humanInterventions: 0,
      humanInterventionsReported: 0,
    });
  });

  it('builds locale-prefixed index hrefs', () => {
    expect(getSeriesIndexHref(MMN, 'zh')).toBe('/cn/blog/series/money-machine-nightly/');
    expect(getSeriesIndexHref(MMN, 'en')).toBe('/blog/series/money-machine-nightly/');
    expect(getSeriesIndexHref(MMN, 'ja')).toBe('/ja/blog/series/money-machine-nightly/');
  });
});
