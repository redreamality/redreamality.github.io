/**
 * Build-time locale availability for the language switcher and hreflang tags.
 *
 * Rule: a page may only link to another locale when that locale's page is
 * actually generated. Detail routes (blog, garden/*, projects, visuals, tags)
 * are resolved against the same collections / manifests their getStaticPaths
 * use; non-dynamic routes are resolved against the files under src/pages.
 * Anything we cannot prove exists falls back to the current locale only
 * (hide rather than link to a 404).
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  getBlogPosts,
  getChaosPosts,
  getLocalizedPath,
  getMeditations,
  getNotes,
  getProjects,
  getQuestions,
  getTags,
  getTalks,
  i18nConfig,
  type Language,
} from './i18n';
import { getLibraryNotes } from './library-notes';
import { getSeriesSlugsWithEntries } from './series';
import { getVisualWorks } from './visuals';

export type LocalizedDetailType =
  | 'blog'
  | 'chaos'
  | 'notes'
  | 'questions'
  | 'talks'
  | 'meditations'
  | 'projects'
  | 'visuals'
  | 'tags'
  | 'library'
  | 'series';

export interface LocaleAvailabilityIndex {
  /** Locale-prefixed, trailing-slash paths of non-dynamic pages (e.g. `/cn/garden/`). */
  staticRoutes: Set<string>;
  /** Slugs that generate a detail page, per content type and locale. */
  details: Record<LocalizedDetailType, Record<Language, Set<string>>>;
}

/** Ordered detail-route patterns, matched against the locale-less path. */
const DETAIL_ROUTES: Array<{ type: LocalizedDetailType; pattern: RegExp }> = [
  { type: 'library', pattern: /^\/garden\/notes\/library\/([^/]+)\/$/ },
  { type: 'chaos', pattern: /^\/garden\/chaos\/([^/]+)\/$/ },
  { type: 'notes', pattern: /^\/garden\/notes\/([^/]+)\/$/ },
  { type: 'questions', pattern: /^\/garden\/questions\/([^/]+)\/$/ },
  { type: 'talks', pattern: /^\/garden\/talks\/([^/]+)\/$/ },
  { type: 'meditations', pattern: /^\/garden\/meditations\/([^/]+)\/$/ },
  { type: 'projects', pattern: /^\/projects\/([^/]+)\/$/ },
  { type: 'visuals', pattern: /^\/visuals\/([^/]+)\/$/ },
  { type: 'tags', pattern: /^\/tags\/([^/]+)\/$/ },
  // Series indexes live under /blog/ and must be matched before blog slugs.
  { type: 'series', pattern: /^\/blog\/series\/([^/]+)\/$/ },
  { type: 'blog', pattern: /^\/blog\/(.+)\/$/ },
];

const LOCALE_PREFIX = /^\/(cn|ja)(?=\/|$)/;

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Decode, strip index.html, and force a trailing slash (trailingSlash: 'always'). */
export function normalizeRoutePath(pathname: string): string {
  let path = safeDecode(pathname.split('#')[0].split('?')[0] || '/');
  if (!path.startsWith('/')) path = `/${path}`;
  path = path.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  path = path.replace(/\/{2,}/g, '/');
  return path.endsWith('/') ? path : `${path}/`;
}

/** Locale-less form of a path: `/cn/blog/x/` -> `/blog/x/`. */
export function stripLocalePrefix(pathname: string): string {
  const path = normalizeRoutePath(pathname).replace(LOCALE_PREFIX, '');
  return path === '' ? '/' : path;
}

function orderLanguages(languages: Iterable<Language>): Language[] {
  const set = new Set(languages);
  return i18nConfig.languages.filter((lang) => set.has(lang));
}

/**
 * Pure resolver: which locales generate the page behind `pathname`.
 * The current locale is always included.
 */
export function resolveAvailableLanguages(
  pathname: string,
  currentLang: Language,
  index: LocaleAvailabilityIndex,
): Language[] {
  const barePath = stripLocalePrefix(pathname);

  for (const { type, pattern } of DETAIL_ROUTES) {
    const match = barePath.match(pattern);
    if (!match) continue;
    const slug = match[1];
    const available = i18nConfig.languages.filter((lang) => index.details[type][lang].has(slug));
    if (available.length > 0) return orderLanguages([currentLang, ...available]);
    // Unknown slug: fall through so a hand-written static page that happens to
    // share a detail prefix (e.g. /projects/archive/) is still checked below.
    break;
  }

  const staticAvailable = i18nConfig.languages.filter((lang) =>
    index.staticRoutes.has(normalizeRoutePath(getLocalizedPath(barePath, lang))),
  );
  return orderLanguages([currentLang, ...staticAvailable]);
}

function emptyDetails(): LocaleAvailabilityIndex['details'] {
  const make = () => ({ en: new Set<string>(), zh: new Set<string>(), ja: new Set<string>() });
  return {
    blog: make(),
    chaos: make(),
    notes: make(),
    questions: make(),
    talks: make(),
    meditations: make(),
    projects: make(),
    visuals: make(),
    tags: make(),
    library: make(),
    series: make(),
  };
}

const PAGE_EXTENSIONS = /\.(astro|md|mdx|html|js|ts)$/;

/**
 * Collect non-dynamic routes from src/pages (any segment with `[` is dynamic
 * and is covered by DETAIL_ROUTES instead).
 */
export function collectStaticRoutes(pagesDir: string): Set<string> {
  const routes = new Set<string>();
  const walk = (dir: string, prefix: string) => {
    for (const name of readdirSync(dir)) {
      if (name.startsWith('_') || name.startsWith('.') || name.includes('[')) continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        walk(full, `${prefix}${name}/`);
        continue;
      }
      if (!PAGE_EXTENSIONS.test(name) || /\.(test|spec)\./.test(name)) continue;
      const base = name.replace(PAGE_EXTENSIONS, '');
      routes.add(normalizeRoutePath(base === 'index' ? `/${prefix}` : `/${prefix}${base}`));
    }
  };
  walk(pagesDir, '');
  return routes;
}

async function buildIndex(): Promise<LocaleAvailabilityIndex> {
  const pagesDir = join(process.cwd(), 'src', 'pages');
  if (!existsSync(pagesDir)) {
    throw new Error(`[locale-availability] Cannot find ${pagesDir}; run the build from the repository root.`);
  }

  const details = emptyDetails();
  const libraryIds = getLibraryNotes().map((note) => note.id);
  const visualWorks = getVisualWorks();

  await Promise.all(
    i18nConfig.languages.map(async (lang) => {
      const [blog, chaos, notes, questions, talks, meditations, projects, tags] = await Promise.all([
        getBlogPosts(lang),
        getChaosPosts(lang),
        getNotes(lang),
        getQuestions(lang),
        getTalks(lang),
        getMeditations(lang),
        getProjects(lang),
        getTags(lang),
      ]);
      const add = (type: LocalizedDetailType, slugs: string[]) => {
        for (const slug of slugs) details[type][lang].add(safeDecode(slug));
      };
      add('blog', blog.map((entry) => entry.slug));
      add('series', getSeriesSlugsWithEntries(blog));
      add('chaos', chaos.map((entry) => entry.slug));
      add('notes', notes.map((entry) => entry.slug));
      add('questions', questions.map((entry) => entry.slug));
      add('talks', talks.map((entry) => entry.slug));
      add('meditations', meditations.map((entry) => entry.slug));
      add('projects', projects.map((entry) => entry.slug));
      add('tags', tags);
      add('library', libraryIds);
      add(
        'visuals',
        visualWorks.filter((work) => Boolean(work.locales[lang]?.artifact)).map((work) => work.slug),
      );
    }),
  );

  return { staticRoutes: collectStaticRoutes(pagesDir), details };
}

let cachedIndex: Promise<LocaleAvailabilityIndex> | undefined;

export function getLocaleAvailabilityIndex(): Promise<LocaleAvailabilityIndex> {
  // Content can change between requests in dev; a production build reuses one index.
  if (import.meta.env?.DEV) return buildIndex();
  cachedIndex ??= buildIndex();
  return cachedIndex;
}

export async function getAvailableLanguagesForPath(pathname: string, currentLang: Language): Promise<Language[]> {
  return resolveAvailableLanguages(pathname, currentLang, await getLocaleAvailabilityIndex());
}
