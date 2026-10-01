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

/** Nested tag row for index cluster trees (parent → children). */
export interface ClusterTagTreeNode {
  tag: string;
  count: number;
  displayLabel: string;
  blurb?: string;
  children: ClusterTagTreeNode[];
}

export type FeaturedReason = 'editorial' | 'parent-sibling' | 'same-cluster' | 'recent';

export type TagRelationKind = 'self' | 'parent' | 'child' | 'sibling' | 'same-cluster' | 'unrelated';

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
  const lower = tag.toLowerCase();
  if (aliases[lower]) return aliases[lower];
  // Case-insensitive alias key match (e.g. ANTHROPIC → Anthropic → anthropic)
  for (const [key, value] of Object.entries(aliases)) {
    if (key.toLowerCase() === lower) return value;
  }
  // Curated node present under lowercase kebab
  if (nodeIndex.has(lower)) return lower;
  if (nodeIndex.has(tag)) return tag;
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

/** Build a ThemeTagEntry. Callers must pass the **canonical** slug as `tag`. */
function toEntry(
  tag: string,
  mergedCount: Record<string, number>,
  lang: TaxonomyLang
): ThemeTagEntry {
  const canonical = normalizeTag(tag);
  const node = getTagNode(canonical);
  return {
    tag: canonical,
    count: mergedCount[canonical] ?? 0,
    node,
    displayLabel: getTagDisplayLabel(canonical, lang),
    blurb: getTagBlurb(canonical, lang),
  };
}

/**
 * Group route tags into ordered themes → clusters → tags.
 * Folds aliases onto canonical slugs, merges counts, emits at most one
 * ThemeTagEntry per canonical. Hide Other when empty.
 * Within each cluster, sort by count desc then name.
 */
export function groupTagsByTheme(
  tags: string[],
  counts: Record<string, number>,
  lang: TaxonomyLang
): GroupedTheme[] {
  const otherId = taxonomy.uncategorizedId || 'other';
  const themeDefs = [...taxonomy.themes].sort((a, b) => a.order - b.order);

  // Unique raws from input (avoid double-counting the same raw string)
  const uniqueRaws = [...new Set(tags)];

  // Reverse fold + merged counts: every raw → canonicalize, sum counts once per raw
  const mergedCount: Record<string, number> = {};
  const inputCanons = new Set<string>();

  for (const raw of uniqueRaws) {
    const canon = normalizeTag(raw);
    inputCanons.add(canon);
    mergedCount[canon] = (mergedCount[canon] ?? 0) + (counts[raw] ?? 0);
  }

  // All curated membership slugs across non-other themes (for leftover filter)
  const curatedMembership = new Set<string>();
  for (const theme of themeDefs) {
    if (theme.id === otherId) continue;
    for (const cluster of theme.clusters ?? []) {
      for (const node of cluster.tags ?? []) {
        curatedMembership.add(node.slug);
      }
    }
  }

  /** Canonicals already emitted under a theme (raw aliases fold into these). */
  const assignedCanons = new Set<string>();
  const result: GroupedTheme[] = [];

  for (const theme of themeDefs) {
    if (theme.id === otherId) continue;

    const clusters: GroupedCluster[] = [];
    const flatTags: ThemeTagEntry[] = [];
    const emittedInTheme = new Set<string>();

    for (const cluster of theme.clusters ?? []) {
      const membership = new Set(cluster.tags.map((n) => n.slug));
      const entries: ThemeTagEntry[] = [];

      // Emit at most one entry per canonical that appears (via any alias) and is in membership
      for (const canon of inputCanons) {
        if (!membership.has(canon)) continue;
        if (emittedInTheme.has(canon) || assignedCanons.has(canon)) continue;

        const entry = toEntry(canon, mergedCount, lang);
        entries.push(entry);
        flatTags.push(entry);
        emittedInTheme.add(canon);
        assignedCanons.add(canon);
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

  // Leftover: canons not in any curated membership (dirty aliases into curated stay out)
  const leftoverCanons: string[] = [];
  for (const canon of inputCanons) {
    if (assignedCanons.has(canon)) continue;
    if (curatedMembership.has(canon)) continue; // aliased into curated but somehow missed — still hide
    leftoverCanons.push(canon);
  }

  if (leftoverCanons.length > 0) {
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

    const entries = leftoverCanons
      .map((canon) => toEntry(canon, mergedCount, lang))
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
    crumbs.push({
      href: `${indexHref}#${cluster.id}`,
      label: localized(cluster.label, lang),
    });
  }

  // Ancestor tag chain (root → … → immediate parent) so openspec shows … › SDD › OpenSpec
  const ancestors: string[] = [];
  let walk = getTagNode(canonical);
  const seen = new Set<string>([canonical]);
  while (walk?.parent) {
    const p = normalizeTag(walk.parent);
    if (seen.has(p)) break;
    seen.add(p);
    ancestors.unshift(p);
    walk = getTagNode(p);
  }
  for (const p of ancestors) {
    crumbs.push({
      href: getTagHref(p, lang),
      label: getTagDisplayLabel(p, lang),
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
  const premiumIds = ['agent-systems', 'specs-sdd', 'rsi-complex', 'models-runtimes', 'coding-tools', 'finance'];
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
): { featured: Array<{ post: T; reason: FeaturedReason }>; timeline: T[] } {
  if (posts.length === 0) return { featured: [], timeline: [] };

  const canonical = normalizeTag(tag);
  const node = getTagNode(canonical);
  const cluster = getClusterForTag(canonical);
  const clusterSlugs = new Set((cluster?.tags ?? []).map((n) => n.slug));
  const relatedSlugs = new Set<string>([
    ...(node?.children ?? []).map(normalizeTag),
    ...(node?.related ?? []).map(normalizeTag),
    ...(node?.parent ? [normalizeTag(node.parent)] : []),
    ...getSiblings(canonical).map((s) => s.slug),
  ]);

  const featuredSlugs = node?.featured?.filter(Boolean) ?? [];
  let featured: Array<{ post: T; reason: FeaturedReason }> = [];

  if (featuredSlugs.length > 0) {
    const bySlug = new Map(posts.map((p) => [p.slug, p]));
    featured = featuredSlugs
      .map((s) => bySlug.get(s))
      .filter((p): p is T => !!p)
      .slice(0, maxFeatured)
      .map((post) => ({ post, reason: 'editorial' as const }));
  }

  if (featured.length === 0) {
    const scored = posts.map((p) => {
      const tags = (p.data.tags ?? []).map(normalizeTag);
      const parentSiblingOverlap = tags.filter((t) => relatedSlugs.has(t)).length;
      const sameClusterOverlap = tags.filter(
        (t) => t !== canonical && clusterSlugs.has(t)
      ).length;
      return {
        post: p,
        parentSiblingOverlap,
        sameClusterOverlap,
        date: p.data.pubDate.valueOf(),
      };
    });
    scored.sort((a, b) => {
      if (b.parentSiblingOverlap !== a.parentSiblingOverlap) {
        return b.parentSiblingOverlap - a.parentSiblingOverlap;
      }
      if (b.sameClusterOverlap !== a.sameClusterOverlap) {
        return b.sameClusterOverlap - a.sameClusterOverlap;
      }
      return b.date - a.date;
    });
    featured = scored.slice(0, Math.min(maxFeatured, posts.length)).map((s) => {
      let reason: FeaturedReason = 'recent';
      if (s.parentSiblingOverlap > 0) reason = 'parent-sibling';
      else if (s.sameClusterOverlap > 0) reason = 'same-cluster';
      return { post: s.post, reason };
    });
  }

  const featuredSet = new Set(featured.map((f) => f.post.slug));
  const timeline = posts
    .filter((p) => !featuredSet.has(p.slug))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return { featured, timeline };
}

/**
 * Build a nested tag tree for one cluster's visible ThemeTagEntry list.
 * Roots = nodes with no parent, or whose parent is not in the visible set.
 * Children hang under parent (openspec under sdd) using parent links + declared children order.
 */
export function buildClusterTagTree(
  clusterTags: ThemeTagEntry[],
  _counts?: Record<string, number>
): ClusterTagTreeNode[] {
  if (clusterTags.length === 0) return [];

  const bySlug = new Map<string, ThemeTagEntry>();
  for (const entry of clusterTags) {
    bySlug.set(normalizeTag(entry.tag), entry);
  }
  const visible = new Set(bySlug.keys());

  const childrenOf = new Map<string, string[]>();
  const roots: string[] = [];

  for (const slug of visible) {
    const node = getTagNode(slug);
    const parentRaw = node?.parent ? normalizeTag(node.parent) : null;
    if (parentRaw && visible.has(parentRaw)) {
      const list = childrenOf.get(parentRaw) ?? [];
      list.push(slug);
      childrenOf.set(parentRaw, list);
    } else {
      roots.push(slug);
    }
  }

  function orderedChildren(parentSlug: string): string[] {
    const node = getTagNode(parentSlug);
    const declared = (node?.children ?? [])
      .map(normalizeTag)
      .filter((s) => visible.has(s));
    const discovered = childrenOf.get(parentSlug) ?? [];
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const s of [...declared, ...discovered]) {
      if (!seen.has(s) && visible.has(s)) {
        seen.add(s);
        ordered.push(s);
      }
    }
    // Any leftover discovered-only already included; stable count sort for undeclared
    ordered.sort((a, b) => {
      const ia = declared.indexOf(a);
      const ib = declared.indexOf(b);
      if (ia !== -1 || ib !== -1) {
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      }
      const ea = bySlug.get(a)!;
      const eb = bySlug.get(b)!;
      if (eb.count !== ea.count) return eb.count - ea.count;
      return ea.displayLabel.localeCompare(eb.displayLabel);
    });
    return ordered;
  }

  function build(slug: string, ancestors: Set<string>): ClusterTagTreeNode {
    const entry = bySlug.get(slug)!;
    const next = new Set(ancestors);
    next.add(slug);
    const kids = orderedChildren(slug).filter((c) => !ancestors.has(c));
    return {
      tag: slug, // always canonical (Map key)
      count: entry.count,
      displayLabel: entry.displayLabel,
      blurb: entry.blurb,
      children: kids.map((c) => build(c, next)),
    };
  }

  roots.sort((a, b) => {
    const ea = bySlug.get(a)!;
    const eb = bySlug.get(b)!;
    if (eb.count !== ea.count) return eb.count - ea.count;
    return ea.displayLabel.localeCompare(eb.displayLabel);
  });

  return roots.map((r) => build(r, new Set()));
}

/** How another tag relates to the current tag (for article chip highlighting). */
export function classifyTagRelation(currentTag: string, otherTag: string): TagRelationKind {
  const current = normalizeTag(currentTag);
  const other = normalizeTag(otherTag);
  if (other === current) return 'self';

  const node = getTagNode(current);
  if (node?.parent && normalizeTag(node.parent) === other) return 'parent';
  if ((node?.children ?? []).map(normalizeTag).includes(other)) return 'child';
  if (getSiblings(current).some((s) => s.slug === other)) return 'sibling';

  const cluster = getClusterForTag(current);
  if (cluster?.tags.some((n) => n.slug === other)) return 'same-cluster';

  return 'unrelated';
}

/** True when relation is parent/child/sibling/same-cluster (highlight-worthy). */
export function isRelatedPathTag(kind: TagRelationKind): boolean {
  return kind === 'parent' || kind === 'child' || kind === 'sibling' || kind === 'same-cluster';
}

/** Localized one-liner for featured reason badges. */
export function featuredReasonLabel(reason: FeaturedReason, lang: TaxonomyLang): string {
  const map: Record<FeaturedReason, LocalizedString> = {
    editorial: {
      en: 'Featured · editorial pick',
      zh: '精选 · 编辑置顶',
      ja: '精選 · 編集ピック',
    },
    'parent-sibling': {
      en: 'Featured · overlaps parent/sibling tag',
      zh: '精选 · 与上级/兄弟 tag 重叠',
      ja: '精選 · 親／兄弟タグと重複',
    },
    'same-cluster': {
      en: 'Featured · same-cluster link',
      zh: '精选 · 同簇关联',
      ja: '精選 · 同一クラスタ関連',
    },
    recent: {
      en: 'Featured · recent',
      zh: '精选 · 近期',
      ja: '精選 · 最近',
    },
  };
  return localized(map[reason], lang);
}

/** Optional path cue under an article title when post shares the cluster. */
export function sameClusterPathCue(
  currentTag: string,
  postTags: string[] | undefined,
  lang: TaxonomyLang
): string | null {
  const current = normalizeTag(currentTag);
  const cluster = getClusterForTag(current);
  if (!cluster) return null;
  const clusterSlugs = new Set(cluster.tags.map((n) => n.slug));
  const others = (postTags ?? [])
    .map(normalizeTag)
    .filter((t) => t !== current && clusterSlugs.has(t));
  if (others.length === 0) return null;

  const clusterLabel = localized(cluster.label, lang);
  if (lang === 'zh') return `同探索路径 · ${clusterLabel}`;
  if (lang === 'ja') return `同一探索パス · ${clusterLabel}`;
  return `Same exploration path · ${clusterLabel}`;
}
