/**
 * Tag taxonomy helpers — hierarchy source: src/data/tag-taxonomy.json (v2)
 * Editorial longform: /workspace/blog-pipeline/TAGS.md
 *
 * Schema: themes[] → clusters[] → tag nodes { slug, parent?, children?, related?, blurb?, display?, featured? }
 */
import taxonomyJson from '../data/tag-taxonomy.json';
import { getLocalizedPath, type Language } from './i18n';

export type TaxonomyLang = Language;

export interface LocalizedString {
  en: string;
  zh: string;
  ja: string;
}

/** A curated tag node inside a cluster. Slugs are canonical EN kebab-case only. */
export interface TagNode {
  slug: string;
  parent?: string;
  children?: string[];
  related?: string[];
  blurb?: LocalizedString;
  display?: LocalizedString;
  featured?: string[];
}

export interface TaxonomyCluster {
  id: string;
  label: LocalizedString;
  blurb?: LocalizedString;
  tags: TagNode[];
}

export interface TaxonomyTheme {
  id: string;
  order: number;
  label: LocalizedString;
  description: LocalizedString;
  clusters: TaxonomyCluster[];
  /** When true, render as a muted/de-emphasized section (vendors, other). */
  muted?: boolean;
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
  node: TagNode | null;
  displayLabel: string;
  blurb?: string;
}

export interface GroupedCluster {
  id: string;
  label: string;
  blurb?: string;
  tags: ThemeTagEntry[];
}

export interface GroupedTheme {
  id: string;
  label: string;
  description: string;
  clusters: GroupedCluster[];
  /** Flat list for back-compat consumers that only need tags. */
  tags: ThemeTagEntry[];
  isOther: boolean;
  muted: boolean;
}

export interface BreadcrumbCrumb {
  href?: string;
  label: string;
}

const taxonomy = taxonomyJson as TagTaxonomy;

/** All tag nodes keyed by canonical slug (first occurrence wins). */
const nodeIndex: Map<string, { node: TagNode; theme: TaxonomyTheme; cluster: TaxonomyCluster }> =
  new Map();

for (const theme of taxonomy.themes) {
  for (const cluster of theme.clusters ?? []) {
    for (const node of cluster.tags ?? []) {
      if (!nodeIndex.has(node.slug)) {
        nodeIndex.set(node.slug, { node, theme, cluster });
      }
    }
  }
}

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

function localized(map: LocalizedString | undefined, lang: TaxonomyLang): string {
  if (!map) return '';
  return map[lang] ?? map.en ?? '';
}

function tagsIndexPath(lang: TaxonomyLang): string {
  return getLocalizedPath('/tags/', lang);
}

function tagDetailPath(tag: string, lang: TaxonomyLang): string {
  const base = tagsIndexPath(lang).replace(/\/$/, '');
  return `${base}/${encodeURIComponent(tag)}/`;
}

/** Prefer node.display, else humanize the slug. */
export function getTagDisplayLabel(slug: string, lang: TaxonomyLang): string {
  const entry = nodeIndex.get(normalizeTag(slug));
  if (entry?.node.display) {
    return localized(entry.node.display, lang);
  }
  // Fallback: title-case kebab segments lightly
  return slug
    .split('-')
    .map((w) => (w.length <= 3 && w === w.toLowerCase() ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

export function getTagBlurb(slug: string, lang: TaxonomyLang): string | undefined {
  const entry = nodeIndex.get(normalizeTag(slug));
  if (!entry?.node.blurb) return undefined;
  const text = localized(entry.node.blurb, lang);
  return text || undefined;
}

export function getTagNode(slug: string): TagNode | null {
  return nodeIndex.get(normalizeTag(slug))?.node ?? null;
}

/**
 * Find the theme that owns a tag (via aliases → canonical, then cluster membership).
 * Unlisted tags resolve to the Other/Uncategorized theme when present.
 */
export function getThemeForTag(tag: string): TaxonomyTheme | null {
  const canonical = normalizeTag(tag);
  const entry = nodeIndex.get(canonical);
  if (entry) return entry.theme;

  const themes = [...taxonomy.themes].sort((a, b) => a.order - b.order);
  const otherId = taxonomy.uncategorizedId || 'other';
  return themes.find((t) => t.id === otherId) ?? null;
}

export function getClusterForTag(tag: string): TaxonomyCluster | null {
  const canonical = normalizeTag(tag);
  return nodeIndex.get(canonical)?.cluster ?? null;
}

export function getParent(slug: string): TagNode | null {
  const node = getTagNode(slug);
  if (!node?.parent) return null;
  return getTagNode(node.parent);
}

export function getChildren(slug: string): TagNode[] {
  const node = getTagNode(slug);
  if (!node?.children?.length) return [];
  return node.children.map((s) => getTagNode(s)).filter((n): n is TagNode => n !== null);
}

/** Siblings = other children of the same parent (excludes self). */
export function getSiblings(slug: string): TagNode[] {
  const canonical = normalizeTag(slug);
  const node = getTagNode(canonical);
  if (!node?.parent) {
    // Root nodes in the same cluster without a parent: treat cluster peers without parent as siblings
    const cluster = getClusterForTag(canonical);
    if (!cluster) return [];
    return cluster.tags.filter((t) => t.slug !== canonical && !t.parent);
  }
  const parent = getTagNode(node.parent);
  if (!parent?.children?.length) return [];
  return parent.children
    .filter((s) => s !== canonical)
    .map((s) => getTagNode(s))
    .filter((n): n is TagNode => n !== null);
}

export function getRelated(slug: string): TagNode[] {
  const node = getTagNode(slug);
  if (!node?.related?.length) return [];
  return node.related.map((s) => getTagNode(s)).filter((n): n is TagNode => n !== null);
}

function toEntry(tag: string, counts: Record<string, number>, lang: TaxonomyLang): ThemeTagEntry {
  const canonical = normalizeTag(tag);
  const node = getTagNode(canonical);
  return {
    tag,
    count: counts[tag] ?? counts[canonical] ?? 0,
    node,
    displayLabel: getTagDisplayLabel(canonical, lang),
    blurb: getTagBlurb(canonical, lang),
  };
}

/**
 * Group route tags into ordered themes → clusters → tags.
 * Only tags present in `tags` appear. Hide Other when empty.
 * Within each cluster, sort by count desc then name.
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

    const clusters: GroupedCluster[] = [];
    const flatTags: ThemeTagEntry[] = [];

    for (const cluster of theme.clusters ?? []) {
      const membership = new Set(cluster.tags.map((n) => n.slug));
      const entries: ThemeTagEntry[] = [];

      for (const tag of tags) {
        const canon = normalizeTag(tag);
        if (membership.has(canon) || membership.has(tag)) {
          const entry = toEntry(tag, counts, lang);
          entries.push(entry);
          flatTags.push(entry);
          assigned.add(tag);
        }
      }

      if (entries.length === 0) continue;

      entries.sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.displayLabel.localeCompare(b.displayLabel);
      });

      clusters.push({
        id: cluster.id,
        label: localized(cluster.label, lang),
        blurb: cluster.blurb ? localized(cluster.blurb, lang) || undefined : undefined,
        tags: entries,
      });
    }

    if (flatTags.length === 0) continue;

    flatTags.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.displayLabel.localeCompare(b.displayLabel);
    });

    result.push({
      id: theme.id,
      label: localized(theme.label, lang),
      description: localized(theme.description, lang),
      clusters,
      tags: flatTags,
      isOther: false,
      muted: !!theme.muted,
    });
  }

  const leftover = tags.filter((t) => !assigned.has(t));
  // Hide Other when empty — never grow the curated tags[] list
  if (leftover.length > 0) {
    const otherTheme =
      themeDefs.find((t) => t.id === otherId) ??
      ({
        id: otherId,
        order: 900,
        muted: true,
        label: { en: 'Uncategorized', zh: '未归类', ja: '未分類' },
        description: {
          en: 'Route tags not yet placed in a curated theme.',
          zh: '尚未归入精品主题的路由标签。',
          ja: 'まだテーマに未分類のルートタグ。',
        },
        clusters: [] as TaxonomyCluster[],
      } satisfies TaxonomyTheme);

    const entries = leftover
      .map((tag) => toEntry(tag, counts, lang))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.displayLabel.localeCompare(b.displayLabel);
      });

    result.push({
      id: otherTheme.id,
      label: localized(otherTheme.label, lang),
      description: localized(otherTheme.description, lang),
      clusters: [
        {
          id: `${otherTheme.id}-fallback`,
          label: localized(otherTheme.label, lang),
          tags: entries,
        },
      ],
      tags: entries,
      isOther: true,
      muted: true,
    });
  }

  return result;
}

/**
 * Hierarchical crumbs: Tags → Theme → Cluster? → Tag display name
 * Theme/cluster hrefs use hash anchors on the index.
 */
export function breadcrumbForTag(tag: string, lang: TaxonomyLang): BreadcrumbCrumb[] {
  const indexHref = tagsIndexPath(lang);
  const tagsLabel = lang === 'zh' ? '标签' : lang === 'ja' ? 'タグ' : 'Tags';
  const canonical = normalizeTag(tag);

  const theme = getThemeForTag(tag);
  const cluster = getClusterForTag(tag);
  const crumbs: BreadcrumbCrumb[] = [{ href: indexHref, label: tagsLabel }];

  if (theme && theme.id !== (taxonomy.uncategorizedId || 'other')) {
    crumbs.push({
      href: `${indexHref}#${theme.id}`,
      label: localized(theme.label, lang),
    });
  }

  if (cluster && theme && theme.id !== (taxonomy.uncategorizedId || 'other')) {
    // Only show cluster crumb when theme has more than one cluster, or always for clarity
    crumbs.push({
      href: `${indexHref}#${cluster.id}`,
      label: localized(cluster.label, lang),
    });
  }

  crumbs.push({ label: getTagDisplayLabel(canonical, lang) });
  return crumbs;
}

/** Premium theme teasers for homepage / chaos entry cards. */
export function getPremiumThemeTeasers(lang: TaxonomyLang, limit = 3): Array<{
  id: string;
  label: string;
  description: string;
  href: string;
}> {
  const indexHref = tagsIndexPath(lang);
  const premiumIds = ['agent-systems', 'specs-sdd', 'rsi-complex-jev', 'coding-tools', 'finance'];
  return [...taxonomy.themes]
    .filter((t) => premiumIds.includes(t.id) && !t.muted)
    .sort((a, b) => a.order - b.order)
    .slice(0, limit)
    .map((t) => ({
      id: t.id,
      label: localized(t.label, lang),
      description: localized(t.description, lang),
      href: `${indexHref}#${t.id}`,
    }));
}

/** Public path helpers used by UI components. */
export function getTagsIndexHref(lang: TaxonomyLang): string {
  return tagsIndexPath(lang);
}

export function getTagHref(tag: string, lang: TaxonomyLang): string {
  return tagDetailPath(normalizeTag(tag), lang);
}

/**
 * Split posts into featured + timeline.
 * Prefer node.featured slugs; else heuristic: posts whose tags overlap parent/sibling, else newest.
 */
export function pickFeaturedPosts<T extends { slug: string; data: { tags?: string[]; pubDate: Date } }>(
  tag: string,
  posts: T[],
  maxFeatured = 4
): { featured: T[]; timeline: T[] } {
  if (posts.length === 0) return { featured: [], timeline: [] };

  const canonical = normalizeTag(tag);
  const node = getTagNode(canonical);
  const relatedSlugs = new Set<string>([
    ...(node?.children ?? []),
    ...(node?.related ?? []),
    ...(node?.parent ? [node.parent] : []),
    ...getSiblings(canonical).map((s) => s.slug),
  ]);

  const featuredSlugs = node?.featured?.filter(Boolean) ?? [];
  let featured: T[] = [];

  if (featuredSlugs.length > 0) {
    const bySlug = new Map(posts.map((p) => [p.slug, p]));
    featured = featuredSlugs.map((s) => bySlug.get(s)).filter((p): p is T => !!p).slice(0, maxFeatured);
  }

  if (featured.length === 0) {
    const scored = posts.map((p) => {
      const tags = (p.data.tags ?? []).map(normalizeTag);
      const overlap = tags.filter((t) => relatedSlugs.has(t)).length;
      return { post: p, overlap, date: p.data.pubDate.valueOf() };
    });
    scored.sort((a, b) => {
      if (b.overlap !== a.overlap) return b.overlap - a.overlap;
      return b.date - a.date;
    });
    featured = scored.slice(0, Math.min(maxFeatured, posts.length)).map((s) => s.post);
  }

  const featuredSet = new Set(featured.map((p) => p.slug));
  const timeline = posts
    .filter((p) => !featuredSet.has(p.slug))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return { featured, timeline };
}
