/**
 * Loads project-column entries (nightly logs) from their own content
 * collections. One collection per column and locale; a locale without a
 * collection simply has no entries (and therefore no index/entry pages).
 */
import type { SeriesSlug } from '../data/series';
import { getCollection } from './content-collections';
import type { Language } from './i18n';
import { sortSeriesEntries } from './series';

const COLUMN_COLLECTIONS: Record<SeriesSlug, Partial<Record<Language, 'money-machine-nightly-cn'>>> = {
  'money-machine-nightly': { zh: 'money-machine-nightly-cn' },
};

/** Entries of one column in one locale, newest first. */
export async function getColumnEntries(series: SeriesSlug, lang: Language) {
  const collection = COLUMN_COLLECTIONS[series][lang];
  if (!collection) return [];
  return sortSeriesEntries(await getCollection(collection));
}

/** Columns that have at least one entry in this locale (index page + project card exist). */
export async function getColumnsWithEntries(lang: Language): Promise<SeriesSlug[]> {
  const slugs = Object.keys(COLUMN_COLLECTIONS) as SeriesSlug[];
  const counts = await Promise.all(slugs.map(async (slug) => (await getColumnEntries(slug, lang)).length));
  return slugs.filter((_, i) => counts[i] > 0);
}
