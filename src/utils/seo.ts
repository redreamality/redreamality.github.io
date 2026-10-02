import type { Language } from './i18n';

export const SEO_TITLE_MAX = 70;
export const SEO_TITLE_TARGET_MIN = 50;
export const SEO_DESC_TARGET_MIN = 150;
export const SEO_DESC_TARGET_MAX = 160;

const BRAND = 'Redreamality';

const TITLE_HINT: Record<Language, string> = {
  en: 'AI & Software',
  zh: 'AI与软件工程',
  ja: 'AI・ソフトウェア',
};

const DESC_PAD: Record<Language, (title: string) => string> = {
  en: (title) =>
    ` Learn more about ${title} on Redreamality — practical writing on AI agents, software engineering, and open source.`,
  zh: (title) =>
    ` 本文介绍「${title}」，来自 Redreamality 关于 AI Agent、软件工程与开源实践的技术博客，涵盖背景、方法、适用场景与可复现要点，帮助读者快速把握核心结论与下一步行动。`,
  ja: (title) =>
    `「${title}」について、Redreamality の AI・ソフトウェア開発ブログで背景、手法、適用場面、再現可能な実践ポイントまで解説し、読者が核心と次の行動を素早く把握できるようにします。`,
};

/** Site-positioning filler only — never invents article-specific claims. */
const DESC_EXTRA: Record<Language, string> = {
  en: ' Written for engineers who want concrete takeaways, sources, and trade-offs rather than hype.',
  zh: '面向希望获得可落地结论、来源依据与工程权衡而非空泛宣传的读者，强调可验证信息、适用边界与可复现的实践路径。',
  ja: '誇張ではなく検証可能な情報・出典・工学的トレードオフを重視し、実務者向けの具体的な要点をまとめています。',
};

function isCjkHeavy(text: string): boolean {
  const cjk = text.match(/[\u3000-\u303f\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/g);
  return (cjk?.join('').length ?? 0) >= Math.max(4, text.length * 0.3);
}

/** Truncate to max codepoints, preferring separators / word boundaries. */
export function truncateTitle(title: string, max = SEO_TITLE_MAX): string {
  const normalized = title.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;

  const slice = normalized.slice(0, max);
  const separators = [': ', ' — ', ' – ', ' - ', ' | ', '：', '、', '，', ', ', ' '];
  let best = -1;
  for (const sep of separators) {
    const idx = slice.lastIndexOf(sep);
    if (idx >= Math.floor(max * 0.4) && idx > best) best = idx;
  }
  if (best > 0) return normalized.slice(0, best).trim();

  if (isCjkHeavy(normalized)) {
    return normalized.slice(0, max - 1).trimEnd() + '…';
  }

  const sp = slice.lastIndexOf(' ');
  if (sp >= Math.floor(max * 0.4)) return normalized.slice(0, sp).trim();
  return normalized.slice(0, max - 1).trimEnd() + '…';
}

function alreadyBranded(title: string): boolean {
  return /redreamality/i.test(title);
}

function snippetFromDescription(description: string, budget: number): string {
  const cleaned = description.replace(/\s+/g, ' ').trim();
  if (!cleaned || budget < 8) return '';
  if (cleaned.length <= budget) return cleaned;
  const slice = cleaned.slice(0, budget);
  if (isCjkHeavy(cleaned)) return slice.trimEnd();
  const sp = slice.lastIndexOf(' ');
  return (sp >= Math.floor(budget * 0.5) ? slice.slice(0, sp) : slice).trimEnd();
}

/**
 * Build a document `<title>` aimed at Bing/Google limits:
 * - never exceed 70 characters
 * - when short, append brand (and topic hint / description snippet if still short)
 */
export function resolveDocumentTitle(
  title: string,
  lang: Language = 'en',
  max = SEO_TITLE_MAX,
  options?: { description?: string },
): string {
  const base = title.replace(/\s+/g, ' ').trim();
  if (!base) return BRAND;

  if (alreadyBranded(base)) {
    return base.length > max ? truncateTitle(base, max) : base;
  }

  if (base.length > max) {
    return truncateTitle(base, max);
  }

  const withBrand = `${base} | ${BRAND}`;
  if (withBrand.length > max) {
    return base;
  }

  if (withBrand.length >= SEO_TITLE_TARGET_MIN) {
    return withBrand;
  }

  // Still short: try topic hint first.
  const withHint = `${base} — ${TITLE_HINT[lang]} | ${BRAND}`;
  if (withHint.length <= max && withHint.length >= SEO_TITLE_TARGET_MIN) {
    return withHint;
  }
  if (withHint.length > max) {
    return withBrand;
  }

  // Still short (typical for terse CJK titles): borrow a description snippet.
  const brandSuffix = ` | ${BRAND}`;
  const budget = max - base.length - ' — '.length - brandSuffix.length;
  const snippet = snippetFromDescription(options?.description ?? '', budget);
  if (snippet) {
    const richer = `${base} — ${snippet}${brandSuffix}`;
    if (richer.length <= max) return richer;
  }

  return withHint.length <= max ? withHint : withBrand;
}

function clampDescription(text: string, max = SEO_DESC_TARGET_MAX): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;

  const slice = normalized.slice(0, max);
  // Only break on a space in the final 8 characters so CJK/Latin mixes
  // still land inside the 150–160 target window.
  const minCut = max - 8;
  const sp = slice.lastIndexOf(' ');
  if (sp >= minCut) {
    return normalized.slice(0, sp).trimEnd();
  }

  return normalized.slice(0, max).trimEnd();
}

/**
 * Expand thin meta descriptions toward ~150–160 chars using the existing
 * description + title. Does not invent article facts beyond the title.
 */
export function resolveMetaDescription(
  description: string,
  title: string,
  lang: Language = 'en',
  options?: { min?: number; max?: number },
): string {
  const min = options?.min ?? SEO_DESC_TARGET_MIN;
  const max = options?.max ?? SEO_DESC_TARGET_MAX;
  const text = (description || '').replace(/\s+/g, ' ').trim();

  if (text.length >= min) {
    return text.length > max * 2 ? clampDescription(text, max * 2) : text;
  }

  let out = text ? `${text}${DESC_PAD[lang](title)}`.replace(/\s+/g, ' ').trim() : DESC_PAD[lang](title).trim();
  let guard = 0;
  while (out.length < min && guard < 3) {
    const next = `${out}${DESC_EXTRA[lang]}`.replace(/\s+/g, ' ').trim();
    if (next.length <= out.length) break;
    out = next;
    guard += 1;
  }
  return clampDescription(out, max);
}
