import { describe, expect, it } from 'vitest';
import { SERIES, getSeriesConfig, getSeriesTitle } from '../data/series';
import legacyRedirects from '../data/legacy-redirects.json';
import { projects } from './projectsData';
import {
  getSeriesDay,
  getSeriesEntryHref,
  getSeriesIndexHref,
  getSeriesNeighbors,
  sortSeriesEntries,
  summarizeSeries,
} from './series';

type Entry = {
  slug: string;
  data: { title: string; pubDate: Date; seriesDay?: number; humanInterventions?: number };
};

const entry = (slug: string, date: string, extra: Partial<Entry['data']> = {}): Entry => ({
  slug,
  data: { title: slug, pubDate: new Date(`${date}T00:00:00Z`), ...extra },
});

const MMN = 'money-machine-nightly';

describe('column config', () => {
  it('registers money-machine-nightly with zh/en titles and an intro', () => {
    const config = getSeriesConfig(MMN)!;
    expect(getSeriesTitle(config, 'zh')).toBe('赚钱机器夜报');
    expect(getSeriesTitle(config, 'en')).toBe('Money Machine Nightly');
    // No Japanese title configured: falls back to English rather than an empty label.
    expect(getSeriesTitle(config, 'ja')).toBe('Money Machine Nightly');
    expect(config.intro.zh?.length).toBeGreaterThanOrEqual(1);
    expect(config.pinned?.zh?.href).toBe('/cn/garden/meditations/agent-identity-infrastructure-long-road/');
  });

  it('every configured column has a matching slug key and kebab-case slug', () => {
    for (const [key, config] of Object.entries(SERIES)) {
      expect(config.slug).toBe(key);
      expect(key).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it('returns undefined for missing or unknown columns', () => {
    expect(getSeriesConfig(undefined)).toBeUndefined();
    expect(getSeriesConfig('nope')).toBeUndefined();
  });

  it('is listed as a project card that links to its projects-section index', () => {
    const card = projects.find((p) => p.column === MMN);
    expect(card).toBeDefined();
    expect(card!.slug).toBe(MMN);
    expect(card!.details).toBe(true);
  });
});

describe('column entries', () => {
  const entries = [
    entry('2026-10-09', '2026-10-09', { seriesDay: 1, humanInterventions: 1 }),
    entry('2026-10-11', '2026-10-11', { seriesDay: 3 }),
    entry('2026-10-10', '2026-10-10', { seriesDay: 2, humanInterventions: 2 }),
  ];

  it('sorts entries newest first without mutating the input', () => {
    const before = entries.map((e) => e.slug);
    expect(sortSeriesEntries(entries).map((e) => e.slug)).toEqual(['2026-10-11', '2026-10-10', '2026-10-09']);
    expect(entries.map((e) => e.slug)).toEqual(before);
  });

  it('breaks same-day ties by seriesDay', () => {
    const sameDay = [entry('a', '2026-10-09', { seriesDay: 1 }), entry('b', '2026-10-09', { seriesDay: 2 })];
    expect(sortSeriesEntries(sameDay).map((e) => e.slug)).toEqual(['b', 'a']);
  });

  it('computes prev (older) and next (newer) neighbors', () => {
    const list = sortSeriesEntries(entries);
    expect(getSeriesNeighbors(list, '2026-10-10')).toEqual({ prev: list[2], next: list[0] });
    expect(getSeriesNeighbors(list, '2026-10-09').prev).toBeNull();
    expect(getSeriesNeighbors(list, '2026-10-11').next).toBeNull();
    expect(getSeriesNeighbors(list, 'missing')).toEqual({ prev: null, next: null });
  });

  it('uses seriesDay when present, else the position in date order', () => {
    const list = sortSeriesEntries([
      entry('a', '2026-10-09'),
      entry('b', '2026-10-10'),
      entry('c', '2026-10-11', { seriesDay: 0 }),
    ]);
    expect(getSeriesDay(list.find((e) => e.slug === 'a')!, list)).toBe(1);
    expect(getSeriesDay(list.find((e) => e.slug === 'b')!, list)).toBe(2);
    expect(getSeriesDay(list.find((e) => e.slug === 'c')!, list)).toBe(0);
  });

  it('summarizes cumulative numbers from frontmatter', () => {
    const summary = summarizeSeries(sortSeriesEntries(entries));
    expect(summary).toMatchObject({
      entryCount: 3,
      latestDay: 3,
      humanInterventions: 3,
      humanInterventionsReported: 2,
    });
    expect(summary.firstDate?.toISOString().slice(0, 10)).toBe('2026-10-09');
    expect(summary.latestDate?.toISOString().slice(0, 10)).toBe('2026-10-11');
  });

  it('summarizes an empty column without throwing', () => {
    expect(summarizeSeries([])).toEqual({
      entryCount: 0,
      latestDay: null,
      firstDate: null,
      latestDate: null,
      humanInterventions: 0,
      humanInterventionsReported: 0,
    });
  });
});

describe('column URLs', () => {
  it('builds locale-prefixed index and entry hrefs under /projects/', () => {
    expect(getSeriesIndexHref(MMN, 'zh')).toBe('/cn/projects/money-machine-nightly/');
    expect(getSeriesIndexHref(MMN, 'en')).toBe('/projects/money-machine-nightly/');
    expect(getSeriesIndexHref(MMN, 'ja')).toBe('/ja/projects/money-machine-nightly/');
    expect(getSeriesEntryHref(MMN, '2026-10-08', 'zh')).toBe('/cn/projects/money-machine-nightly/2026-10-08/');
  });

  it('redirects the old blog URLs to the new projects URLs', () => {
    expect(legacyRedirects).toEqual({
      '/cn/blog/money-machine-nightly-2026-10-08/': getSeriesEntryHref(MMN, '2026-10-08', 'zh'),
      '/cn/blog/series/money-machine-nightly/': getSeriesIndexHref(MMN, 'zh'),
    });
  });
});
