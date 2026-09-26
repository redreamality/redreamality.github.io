/**
 * Tag taxonomy helpers — hierarchy source: src/data/tag-taxonomy.json
 * Editorial longform: /workspace/blog-pipeline/TAGS.md
 */
import taxonomyJson from '../data/tag-taxonomy.json';
import { getLocalizedPath, type Language } from './i18n';

export type TaxonomyLang = Language;

export interface LocalizedString {
  en: string;
  zh: string;
  ja: string;
}

export interface TaxonomyTheme {
  id: string;
  order: number;
  label: LocalizedString;
  description: LocalizedString;
  tags: string[];
}

export interface TagTaxonomy {
  version: number;
  themes: TaxonomyTheme[];
  aliases: Record<string, string>;
  uncategorizedId: string;
}

export interface ThemeTagEntry {
  tag: string;
  count: number;
}

export interface GroupedTheme {
  id: string;
  label: string;
  description: string;
  tags: ThemeTagEntry[];
  isOther: boolean;
}

export interface BreadcrumbCrumb {
  href?: string;
  label: string;
}

const taxonomy = taxonomyJson as TagTaxonomy;

/** Read the committed taxonomy (source of truth for UI hierarchy). */
export function loadTaxonomy(): TagTaxonomy {
  return taxonomy;
}

/** Map a raw frontmatter/route tag to its canonical slug when known. */
export function normalizeTag(tag: string): string {
  const aliases = taxonomy.aliases ?? {};
  if (aliases[tag]) return aliases[tag];
  return tag;
}

function localized(map: LocalizedString, lang: TaxonomyLang): string {
  return map[lang] ?? map.en;
}

function tagsIndexPath(lang: TaxonomyLang): string {
  return getLocalizedPath('/tags/', lang);
}

function tagDetailPath(tag: string, lang: TaxonomyLang): string {
  const base = tagsIndexPath(lang).replace(/\/$/, '');
  return `${base}/${encodeURIComponent(tag)}/`;
}

/**
 * Find the theme that owns a tag (via aliases → canonical, then theme.tags membership).
 * Returns null only if taxonomy is empty; unlisted tags resolve to the Other theme when present.
 */
export function getThemeForTag(tag: string): TaxonomyTheme | null {
  const canonical = normalizeTag(tag);
  const themes = [...taxonomy.themes].sort((a, b) => a.order - b.order);
  const otherId = taxonomy.uncategorizedId || 'other';

  for (const theme of themes) {
    if (theme.id === otherId) continue;
    if (theme.tags.includes(tag) || theme.tags.includes(canonical)) {
      return theme;
    }
  }

  return themes.find((t) => t.id === otherId) ?? null;
}

/**
 * Group route tags into ordered themes. Only tags present in `tags` appear.
 * Within each theme, sort by count desc then name. Append Other last when needed.
 */
export function groupTagsByTheme(
  tags: string[],
  counts: Record<string, number>,
  lang: TaxonomyLang
): GroupedTheme[] {
  const otherId = taxonomy.uncategorizedId || 'other';
  const themeDefs = [...taxonomy.themes].sort((a, b) => a.order - b.order);
  const assigned = new Set<string>();
  const result: GroupedTheme[] = [];

  for (const theme of themeDefs) {
    if (theme.id === otherId) continue;

    const membership = new Set(
      theme.tags.flatMap((t) => {
        const canon = normalizeTag(t);
        return [t, canon];
      })
    );

    const entries: ThemeTagEntry[] = [];
    for (const tag of tags) {
      const canon = normalizeTag(tag);
      if (membership.has(tag) || membership.has(canon)) {
        entries.push({ tag, count: counts[tag] ?? 0 });
        assigned.add(tag);
      }
    }

    if (entries.length === 0) continue;

    entries.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.tag.localeCompare(b.tag);
    });

    result.push({
      id: theme.id,
      label: localized(theme.label, lang),
      description: localized(theme.description, lang),
      tags: entries,
      isOther: false,
    });
  }

  const leftover = tags.filter((t) => !assigned.has(t));
  if (leftover.length > 0) {
    const otherTheme =
      themeDefs.find((t) => t.id === otherId) ??
      ({
        id: otherId,
        order: 900,
        label: { en: 'Other', zh: '其他', ja: 'その他' },
        description: {
          en: 'Uncategorized tags',
          zh: '未分类标签',
          ja: '未分類タグ',
        },
        tags: [] as string[],
      } satisfies TaxonomyTheme);

    const entries = leftover
      .map((tag) => ({ tag, count: counts[tag] ?? 0 }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.tag.localeCompare(b.tag);
      });

    result.push({
      id: otherTheme.id,
      label: localized(otherTheme.label, lang),
      description: localized(otherTheme.description, lang),
      tags: entries,
      isOther: true,
    });
  }

  return result;
}

/**
 * Hierarchical crumbs for a tag detail page: Tags → Theme → #tag
 * Theme href uses hash anchor on the index: /tags/#agent-systems
 */
export function breadcrumbForTag(tag: string, lang: TaxonomyLang): BreadcrumbCrumb[] {
  const indexHref = tagsIndexPath(lang);
  const tagsLabel =
    lang === 'zh' ? '标签' : lang === 'ja' ? 'タグ' : 'Tags';

  const theme = getThemeForTag(tag);
  const crumbs: BreadcrumbCrumb[] = [{ href: indexHref, label: tagsLabel }];

  if (theme) {
    crumbs.push({
      href: `${indexHref}#${theme.id}`,
      label: localized(theme.label, lang),
    });
  }

  crumbs.push({ label: `#${tag}` });
  return crumbs;
}

/** Public path helpers used by UI components. */
export function getTagsIndexHref(lang: TaxonomyLang): string {
  return tagsIndexPath(lang);
}

export function getTagHref(tag: string, lang: TaxonomyLang): string {
  return tagDetailPath(tag, lang);
}
