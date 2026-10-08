/**
 * Pure helpers for blog series (columns). Kept free of `astro:content` so they
 * can be unit-tested; pages pass in entries from `getBlogPosts(lang)`.
 * Metadata lives in `src/data/series.ts`.
 */
import { getSeriesConfig } from '../data/series';
import type { Language } from './i18n';

export interface SeriesFields {
  pubDate: Date;
  title?: string;
  series?: string;
  seriesDay?: number;
  humanInterventions?: number;
}

export interface SeriesEntryLike {
  slug: string;
  data: SeriesFields;
}

/**
 * Home page "latest posts" eligibility: posts in a series whose config sets
 * `excludeFromHome` are dropped. Posts without `series` are always eligible.
 * An unknown series slug (cannot happen after schema validation) is treated as
 * excluded so a stray daily entry never pushes formal posts off the home page.
 */
export function isHomeFeedEligible(post: { data: { series?: string } }): boolean {
  const slug = post.data.series;
  if (!slug) return true;
  const config = getSeriesConfig(slug);
  return config ? !config.excludeFromHome : false;
}

export function filterHomeFeedPosts<T extends { data: { series?: string } }>(posts: T[]): T[] {
  return posts.filter(isHomeFeedEligible);
}

/** Entries of one series, newest first (date desc, then seriesDay desc). */
export function getSeriesEntries<T extends SeriesEntryLike>(posts: T[], series: string): T[] {
  return posts
    .filter((p) => p.data.series === series)
    .sort((a, b) => {
      const byDate = b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
      if (byDate !== 0) return byDate;
      return (b.data.seriesDay ?? 0) - (a.data.seriesDay ?? 0);
    });
}

/** Group posts by series slug; each group newest first. Posts without series are skipped. */
export function groupPostsBySeries<T extends SeriesEntryLike>(posts: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const post of posts) {
    const slug = post.data.series;
    if (!slug) continue;
    if (!groups.has(slug)) groups.set(slug, []);
    groups.get(slug)!.push(post);
  }
  for (const [slug, entries] of groups) {
    groups.set(slug, getSeriesEntries(entries, slug));
  }
  return groups;
}

/**
 * Series slugs that should get an index page for this locale: configured
 * series with at least one entry. Used by both `getStaticPaths` and
 * locale availability so the language switcher never links to a missing index.
 */
export function getSeriesSlugsWithEntries(posts: SeriesEntryLike[]): string[] {
  return [...groupPostsBySeries(posts).keys()].filter((slug) => Boolean(getSeriesConfig(slug))).sort();
}

/** Day label: explicit `seriesDay` wins, else 1-based position in date order. */
export function getSeriesDay<T extends SeriesEntryLike>(entry: T, entriesNewestFirst: T[]): number {
  if (typeof entry.data.seriesDay === 'number') return entry.data.seriesDay;
  const idx = entriesNewestFirst.findIndex((e) => e.slug === entry.slug);
  return idx === -1 ? 0 : entriesNewestFirst.length - idx;
}

export interface SeriesNeighbors<T> {
  /** Older entry (previous day). */
  prev: T | null;
  /** Newer entry (next day). */
  next: T | null;
}

export function getSeriesNeighbors<T extends SeriesEntryLike>(entriesNewestFirst: T[], slug: string): SeriesNeighbors<T> {
  const idx = entriesNewestFirst.findIndex((e) => e.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: entriesNewestFirst[idx + 1] ?? null,
    next: idx > 0 ? entriesNewestFirst[idx - 1] : null,
  };
}

export interface SeriesSummary {
  entryCount: number;
  latestDay: number | null;
  firstDate: Date | null;
  latestDate: Date | null;
  /** Sum of `humanInterventions` over entries that report it. */
  humanInterventions: number;
  /** How many entries report `humanInterventions` (the sum covers only these). */
  humanInterventionsReported: number;
}

/** Cumulative numbers computable from frontmatter alone. */
export function summarizeSeries<T extends SeriesEntryLike>(entriesNewestFirst: T[]): SeriesSummary {
  if (entriesNewestFirst.length === 0) {
    return {
      entryCount: 0,
      latestDay: null,
      firstDate: null,
      latestDate: null,
      humanInterventions: 0,
      humanInterventionsReported: 0,
    };
  }
  let humanInterventions = 0;
  let humanInterventionsReported = 0;
  for (const entry of entriesNewestFirst) {
    if (typeof entry.data.humanInterventions === 'number') {
      humanInterventions += entry.data.humanInterventions;
      humanInterventionsReported += 1;
    }
  }
  const newest = entriesNewestFirst[0];
  const oldest = entriesNewestFirst[entriesNewestFirst.length - 1];
  return {
    entryCount: entriesNewestFirst.length,
    latestDay: getSeriesDay(newest, entriesNewestFirst),
    firstDate: oldest.data.pubDate,
    latestDate: newest.data.pubDate,
    humanInterventions,
    humanInterventionsReported,
  };
}

export function getSeriesIndexHref(series: string, lang: Language): string {
  const prefix = lang === 'zh' ? '/cn' : lang === 'ja' ? '/ja' : '';
  return `${prefix}/blog/series/${series}/`;
}
