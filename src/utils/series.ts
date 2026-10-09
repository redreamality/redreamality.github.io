/**
 * Pure helpers for project columns (nightly logs). Kept free of `astro:content`
 * so they can be unit-tested; pages pass in entries from the column's own
 * collection (see `getColumnEntries` in `./columns`). Metadata lives in
 * `src/data/series.ts`.
 */
import type { Language } from './i18n';

export interface SeriesFields {
  pubDate: Date;
  title?: string;
  seriesDay?: number;
  humanInterventions?: number;
}

export interface SeriesEntryLike {
  slug: string;
  data: SeriesFields;
}

/** Column entries newest first (date desc, then seriesDay desc). Does not mutate the input. */
export function sortSeriesEntries<T extends SeriesEntryLike>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    const byDate = b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
    if (byDate !== 0) return byDate;
    return (b.data.seriesDay ?? 0) - (a.data.seriesDay ?? 0);
  });
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

function localePrefix(lang: Language): string {
  return lang === 'zh' ? '/cn' : lang === 'ja' ? '/ja' : '';
}

/** Column index under the projects section: `/cn/projects/<series>/`. */
export function getSeriesIndexHref(series: string, lang: Language): string {
  return `${localePrefix(lang)}/projects/${series}/`;
}

/** Column entry: `/cn/projects/<series>/<entry-slug>/` (entry slug = `YYYY-MM-DD`). */
export function getSeriesEntryHref(series: string, entrySlug: string, lang: Language): string {
  return `${getSeriesIndexHref(series, lang)}${entrySlug}/`;
}
