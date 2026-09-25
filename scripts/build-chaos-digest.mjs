#!/usr/bin/env node
/**
 * Build Chaos digest feed from blog-pipeline topics.md
 *
 * Usage (from repo root):
 *   node scripts/build-chaos-digest.mjs
 *
 * Reads:  /workspace/blog-pipeline/topics.md  (or TOPICS_MD env)
 *         src/content/blog-cn|blog-en frontmatter for published blog links
 * Writes: src/data/chaos-digest.json
 *
 * Idempotent. Prefer shortlisted + published + writing + inbox score≥4; skip killed.
 * Per-status lookback on updated_at (Asia/Shanghai): inbox 72h, shortlisted+writing
 * 7d (168h), published 30d (720h). Rows outside the window are omitted from the
 * digest only (topics.md untouched). Groups by Shanghai floor hour; within hour
 * sorts by score desc then status (published > shortlisted > writing > inbox).
 *
 * Locale rules (CRITICAL — no 中英混杂):
 *   - title.zh  = topics title (Chinese OK)
 *   - title.en  = EN blog FM title | EN_TITLE_OVERRIDES | mostly-ASCII / repo
 *                 machine title | null  (NEVER copy Chinese into en)
 *   - title.ja  = same as en for ASCII/repo; null when only Chinese exists
 *                 (no JA translations yet; never paste Chinese into ja)
 *   - summary.zh = angle/notes (Chinese OK)
 *   - summary.en = EN blog description only, else ""
 *   - summary.ja = "" (no JA paraphrase yet)
 *
 * Theme taxonomy (item.theme) — derived from sources / title / angle keywords:
 *   models        — frontier / open model releases (Opus, GPT-6, MiMo, …)
 *   agents-oss    — open-source agent runtimes / harnesses / multi-agent stacks
 *   coding-tools  — coding agents, code review, Claude Code, skills for coding
 *   security      — vulns, audits, RCE, security skills
 *   product-news  — product launches, platform features, funding, PH
 *   research      — arxiv / paperswithcode / research blogs
 *   other         — fallback
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const TOPICS_MD =
  process.env.TOPICS_MD || '/workspace/blog-pipeline/topics.md';
const OUT_PATH = path.join(rootDir, 'src/data/chaos-digest.json');
const BLOG_CN = path.join(rootDir, 'src/content/blog-cn');
const BLOG_EN = path.join(rootDir, 'src/content/blog-en');
const TZ = 'Asia/Shanghai';
/** Per-status lookback hours (Asia/Shanghai via updated_at). */
const LOOKBACK_HOURS = {
  inbox: 72,
  shortlisted: 168, // 7 days
  writing: 168,
  published: 720, // 30 days
};

const STATUS_RANK = {
  published: 0,
  shortlisted: 1,
  writing: 2,
  inbox: 3,
  killed: 9,
};

/** Theme ids → display labels (UI may also hardcode) */
const THEME_ORDER = [
  'models',
  'coding-tools',
  'agents-oss',
  'security',
  'research',
  'product-news',
  'other',
];

/** Manual EN title overrides when topics.md is Chinese-only but paraphrase is clear */
const EN_TITLE_OVERRIDES = {
  t003: 'Jev × Claude Code: Four Real Integration Paths and a 25-Line Minimal Build',
};

const CJK_RE = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/;

function hasCJK(s) {
  return CJK_RE.test(String(s || ''));
}

function asciiRatio(s) {
  const str = String(s || '');
  if (!str.length) return 1;
  return (str.match(/[\x00-\x7F]/g) || []).length / str.length;
}

function parseTable(md) {
  const lines = md.split(/\r?\n/);
  const rows = [];
  let header = null;
  for (const line of lines) {
    if (!line.startsWith('|')) continue;
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
    if (cells.length < 5) continue;
    if (cells.every((c) => /^[-:]+$/.test(c))) continue;
    if (!header) {
      header = cells.map((h) => h.toLowerCase());
      continue;
    }
    const obj = {};
    header.forEach((h, i) => {
      obj[h] = cells[i] ?? '';
    });
    if (obj.id && /^t\d+/i.test(obj.id)) rows.push(obj);
  }
  return rows;
}

function splitList(s) {
  if (!s || s === '—' || s === '-') return [];
  return s
    .split(/[;；,，]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

/** Parse "2026-09-23 22:42" as Asia/Shanghai wall time → Date */
function parseShanghaiLocal(s) {
  const m = String(s).trim().match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/,
  );
  if (!m) return null;
  const [, y, mo, d, h, mi, sec = '00'] = m;
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:${sec}+08:00`);
}

function floorHourISO(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:00:00+08:00`;
}

function hourLabel(hourStartISO) {
  const d = new Date(hourStartISO);
  const m = hourStartISO.match(/T(\d{2}):/);
  const hour = m ? m[1] : '00';
  const dm = hourStartISO.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const month = dm ? Number(dm[2]) : 0;
  const day = dm ? Number(dm[3]) : 0;
  return {
    zh: `${month}月${day}日 ${hour}:00`,
    en: new Intl.DateTimeFormat('en-US', {
      timeZone: TZ,
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .format(d)
      .replace(',', ''),
    ja: `${month}月${day}日 ${hour}:00`,
  };
}

function extractBlogFromNotes(notes) {
  const out = { zh: null, en: null };
  if (!notes) return out;
  const re =
    /https?:\/\/(?:www\.)?redreamality\.com(\/cn)?\/blog\/([a-z0-9-]+)\/?/gi;
  let m;
  while ((m = re.exec(notes))) {
    const isCn = Boolean(m[1]);
    const slug = m[2];
    if (isCn) out.zh = `/cn/blog/${slug}/`;
    else out.en = `/blog/${slug}/`;
  }
  if (out.zh && !out.en) {
    const slug = out.zh.replace(/^\/cn\/blog\/|\/$/g, '');
    out.en = `/blog/${slug}/`;
  }
  if (out.en && !out.zh) {
    const slug = out.en.replace(/^\/blog\/|\/$/g, '');
    out.zh = `/cn/blog/${slug}/`;
  }
  return out;
}

/** Extract explicit slug hints from notes (slug= / slug: / slug␠) */
function extractSlugHints(notes) {
  const hints = new Set();
  if (!notes) return hints;
  // "slug=foo", "slug: foo", "slug foo-bar" (require ≥8 chars to avoid "agent")
  const slugEq = notes.matchAll(
    /\bslug[=:\s]+([a-z0-9][a-z0-9-]{7,})/gi,
  );
  for (const m of slugEq) hints.add(m[1].toLowerCase());
  const pathSlug = notes.matchAll(
    /(?:blog-cn|blog-en|\/blog\/|\/cn\/blog\/)\/?([a-z0-9][a-z0-9-]{3,})/gi,
  );
  for (const m of pathSlug) hints.add(m[1].toLowerCase());
  return hints;
}

/** True if notes mentions this slug as a path or whole token (not a short substring). */
function notesMentionsSlug(notes, slug) {
  if (!notes || !slug) return false;
  const n = notes.toLowerCase();
  const s = slug.toLowerCase();
  if (n.includes(`/blog/${s}`) || n.includes(`/cn/blog/${s}`)) return true;
  // Require long slugs for bare token match — blocks "agent" inside "agents"
  if (s.length < 12) return false;
  const re = new RegExp(
    `(^|[^a-z0-9-])${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9-]|$)`,
    'i',
  );
  return re.test(n);
}

function readFrontmatter(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fm) return { title: null, description: null };
    const block = fm[1];
    const tm = block.match(/^title:\s*["']?(.*?)["']?\s*$/m);
    const dm = block.match(/^description:\s*["']?(.*?)["']?\s*$/m);
    const title = tm ? tm[1].replace(/^["']|["']$/g, '') : null;
    const description = dm ? dm[1].replace(/^["']|["']$/g, '') : null;
    return { title, description };
  } catch {
    return { title: null, description: null };
  }
}

function scanBlogSlugs() {
  const map = new Map(); // slug -> { zh, en, titleZh, titleEn, descZh, descEn }
  for (const [dir, lang] of [
    [BLOG_CN, 'zh'],
    [BLOG_EN, 'en'],
  ]) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.md') && !name.endsWith('.mdx')) continue;
      const slug = name.replace(/\.(md|mdx)$/, '');
      const { title, description } = readFrontmatter(path.join(dir, name));
      if (!map.has(slug)) map.set(slug, {});
      const entry = map.get(slug);
      if (lang === 'zh') {
        entry.zh = `/cn/blog/${slug}/`;
        entry.titleZh = title;
        entry.descZh = description;
      } else {
        entry.en = `/blog/${slug}/`;
        entry.titleEn = title;
        entry.descEn = description;
      }
    }
  }
  return map;
}

/**
 * Locale-neutral machine title when topic is Chinese-mixed but starts with
 * org/repo or is already mostly ASCII. Returns null when only CJK prose exists.
 */
function machineAsciiTitle(zhTitle) {
  const t = String(zhTitle || '').trim();
  if (!t) return null;
  // org/repo at start (optionally followed by Chinese gloss after ： or :)
  const repo = t.match(/^([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)/);
  if (repo) return repo[1];
  // arxiv-style / English product titles without CJK
  if (!hasCJK(t) && asciiRatio(t) > 0.85) return t;
  // Mostly ASCII with a short CJK gloss — keep the ASCII-leading clause
  if (asciiRatio(t) > 0.7) {
    const cut = t.split(/[：:]/)[0].trim();
    if (cut && !hasCJK(cut) && cut.length >= 3) return cut;
    if (!hasCJK(t)) return t;
  }
  // Leading Latin product name before CJK (e.g. "Claude Opus 5.5：降价…")
  const lead = t.match(/^([A-Za-z][A-Za-z0-9 .×xX+/&_-]{2,60}?)(?:\s*[：:（(]|\s*$)/);
  if (lead) {
    const candidate = lead[1].trim().replace(/[.\s]+$/, '');
    if (candidate.length >= 4 && !hasCJK(candidate)) return candidate;
  }
  return null;
}

/**
 * Resolve EN title. Never returns Chinese prose.
 * Priority: override → blog EN title → machine ASCII → null
 */
function englishTitle(id, zhTitle, blogMeta) {
  if (EN_TITLE_OVERRIDES[id]) return EN_TITLE_OVERRIDES[id];
  if (blogMeta?.titleEn && !hasCJK(blogMeta.titleEn)) return blogMeta.titleEn;
  const machine = machineAsciiTitle(zhTitle);
  if (machine) return machine;
  return null;
}

/**
 * Theme derivation — keyword + source heuristics.
 * Order matters: more specific buckets first.
 */
function deriveTheme(row) {
  const sources = splitList(row.sources).map((s) => s.toLowerCase());
  const blob = `${row.title || ''} ${row.angle || ''} ${row.notes || ''}`.toLowerCase();
  const srcSet = new Set(sources);

  if (
    srcSet.has('arxiv') ||
    srcSet.has('paperswithcode') ||
    /\barxiv\b|paperswithcode|research agent|self-improvement|compaction|search polic/.test(
      blob,
    )
  ) {
    return 'research';
  }

  if (
    /security|审计|rce|vuln|cve|ghsa|audit-skill|safeguard/.test(blob) ||
    (srcSet.has('hn') && /rce|security|漏洞|穿越/.test(blob))
  ) {
    return 'security';
  }

  if (
    /opus|gpt-6|gpt6|claude\s*fable|mimo|sol\s*&\s*luna|model release|降价.*旗舰|开源模型|frontier model/.test(
      blob,
    ) ||
    (/模型/.test(blob) && /发布|降价|旗舰|开源/.test(blob))
  ) {
    return 'models';
  }

  if (
    /code.?review|claude.?code|coding.?agent|vibe.?coding|agent-skills|security-audit-skill|open-code-review|copilot|cline\b|devtools|coding tools/.test(
      blob,
    )
  ) {
    return 'coding-tools';
  }

  if (
    /agent|harness|orchestration|multi-agent|openclaw|mcp\b|skill|fleet|runtime|substrate|harness-sdk|weknora|librechat|univer|orca|ecc\b|ax\b|jev/.test(
      blob,
    ) ||
    srcSet.has('github')
  ) {
    // github defaults toward agents-oss unless already classified
    if (
      srcSet.has('github') ||
      /agent|harness|orchestration|multi-agent|mcp|skill|runtime/.test(blob)
    ) {
      return 'agents-oss';
    }
  }

  if (
    srcSet.has('techcrunch') ||
    srcSet.has('producthunt') ||
    srcSet.has('theverge') ||
    /融资|funding|raises|producthunt|youtube.*算法|平台|发布/.test(blob)
  ) {
    return 'product-news';
  }

  return 'other';
}

function shouldInclude(row) {
  const status = (row.status || '').toLowerCase();
  const score = Number(row.score) || 0;
  if (status === 'killed') return false;
  if (status === 'published' || status === 'shortlisted' || status === 'writing')
    return true;
  if (status === 'inbox' && score >= 4) return true;
  return false;
}

/** Hours of lookback for this status, or null if status has no window. */
function lookbackHoursFor(status) {
  return LOOKBACK_HOURS[status] ?? null;
}

function withinLookback(updated, status, now) {
  const hours = lookbackHoursFor(status);
  if (hours == null) return true;
  const cutoff = new Date(now.getTime() - hours * 3600 * 1000);
  return updated >= cutoff;
}

function matchBlog(row, blogMap, fromNotes) {
  const blog = { zh: fromNotes.zh || null, en: fromNotes.en || null };
  let meta = null;

  const trySlug = (slug) => {
    if (!slug || !blogMap.has(slug)) return false;
    const paths = blogMap.get(slug);
    if (paths.zh) blog.zh = paths.zh;
    if (paths.en) blog.en = paths.en;
    meta = paths;
    return true;
  };

  // From notes URLs (highest confidence)
  if (blog.zh || blog.en) {
    const slug = (blog.en || blog.zh)
      .replace(/^\/cn\/blog\/|^\/blog\/|\/$/g, '');
    trySlug(slug);
    return { blog, meta };
  }

  // Explicit slug= / slug: / slug␠ hints
  for (const hint of extractSlugHints(row.notes || '')) {
    if (trySlug(hint)) return { blog, meta };
  }

  // Scan blog slugs mentioned in notes — longest slug first to avoid
  // short false positives like slug "agent" matching "agents"/"agentic"
  const notes = row.notes || '';
  if (notes) {
    const slugs = [...blogMap.keys()].sort((a, b) => b.length - a.length);
    for (const slug of slugs) {
      if (notesMentionsSlug(notes, slug)) {
        const paths = blogMap.get(slug);
        blog.zh = paths.zh || null;
        blog.en = paths.en || null;
        meta = paths;
        return { blog, meta };
      }
    }
  }

  return { blog: blog.zh || blog.en ? blog : null, meta };
}

function build() {
  if (!fs.existsSync(TOPICS_MD)) {
    console.error(`topics.md not found: ${TOPICS_MD}`);
    process.exit(1);
  }
  const md = fs.readFileSync(TOPICS_MD, 'utf8');
  const rows = parseTable(md);
  const blogMap = scanBlogSlugs();

  // Refresh known overrides from blog frontmatter when present
  const t003Blog = blogMap.get('jev-claude-code-10x-and-25-lines');
  if (t003Blog?.titleEn) EN_TITLE_OVERRIDES.t003 = t003Blog.titleEn;

  const now = new Date();

  const items = [];
  for (const row of rows) {
    if (!shouldInclude(row)) continue;
    const updated = parseShanghaiLocal(row.updated_at);
    if (!updated) continue;
    const status = (row.status || '').toLowerCase();
    if (!withinLookback(updated, status, now)) continue;

    const fromNotes = extractBlogFromNotes(row.notes);
    let { blog, meta } = matchBlog(row, blogMap, fromNotes);

    // Hard-link published t003 if notes parse failed
    if (
      (!blog || (!blog.zh && !blog.en)) &&
      (row.status || '').toLowerCase() === 'published' &&
      t003Blog &&
      row.id === 't003'
    ) {
      blog = { zh: t003Blog.zh, en: t003Blog.en };
      meta = t003Blog;
    }
    if (blog && meta == null && blog.en) {
      const slug = blog.en.replace(/^\/blog\/|\/$/g, '');
      meta = blogMap.get(slug) || null;
    }

    const zhTitle = row.title;
    const enTitle = englishTitle(row.id, zhTitle, meta);
    // JA: only locale-neutral ASCII/repo titles for now (no JA translations)
    const jaTitle =
      enTitle && !hasCJK(enTitle) ? enTitle : machineAsciiTitle(zhTitle);

    const zhSummary = row.angle || row.notes || '';
    // EN summary only from English blog description — never copy Chinese angle
    const enSummary =
      meta?.descEn && !hasCJK(meta.descEn) ? meta.descEn : '';
    const jaSummary = ''; // no JA paraphrase yet

    const theme = deriveTheme(row);
    const hourStart = floorHourISO(updated);

    const item = {
      id: row.id,
      theme,
      title: {
        zh: zhTitle,
        en: enTitle || '',
        ja: jaTitle || '',
      },
      summary: {
        zh: zhSummary,
        en: enSummary,
        ja: jaSummary,
      },
      sources: splitList(row.sources).map((s) => s.toLowerCase()),
      score: Number(row.score) || 0,
      status: (row.status || 'inbox').toLowerCase(),
      externalUrls: splitList(row.urls),
      updatedAt: updated.toISOString(),
      hourStart,
    };
    if (blog && (blog.zh || blog.en)) {
      item.blog = {
        zh: blog.zh || null,
        en: blog.en || null,
      };
    }
    items.push(item);
  }

  const byHour = new Map();
  for (const item of items) {
    if (!byHour.has(item.hourStart)) byHour.set(item.hourStart, []);
    byHour.get(item.hourStart).push(item);
  }

  const statusCmp = (a, b) =>
    (STATUS_RANK[a.status] ?? 5) - (STATUS_RANK[b.status] ?? 5);

  const hours = [...byHour.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([hourStart, list]) => {
      list.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return statusCmp(a, b);
      });
      return {
        hourStart,
        label: hourLabel(hourStart),
        items: list.map(({ hourStart: _h, updatedAt: _u, ...rest }) => {
          const clean = { ...rest };
          if (!clean.blog) delete clean.blog;
          return clean;
        }),
      };
    });

  // Theme index (flat counts) — UI groups from item.theme; this helps sanity checks
  const themeCounts = {};
  for (const id of THEME_ORDER) themeCounts[id] = 0;
  for (const item of items) {
    themeCounts[item.theme] = (themeCounts[item.theme] || 0) + 1;
  }

  const nowLabel = (() => {
    const p = new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
    const g = (t) => p.find((x) => x.type === t)?.value;
    return `${g('year')}-${g('month')}-${g('day')}T${g('hour')}:${g('minute')}:${g('second')}+08:00`;
  })();

  const digest = {
    updatedAt: nowLabel,
    timezone: TZ,
    themes: THEME_ORDER,
    themeCounts,
    hours,
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(digest, null, 2) + '\n', 'utf8');

  const total = hours.reduce((n, h) => n + h.items.length, 0);
  const withEn = items.filter((i) => i.title.en).length;
  const withBlog = items.filter((i) => i.blog).length;
  console.log(
    `Wrote ${OUT_PATH} — ${hours.length} hour(s), ${total} item(s), enTitles=${withEn}, blogs=${withBlog}, updatedAt=${nowLabel}`,
  );
  console.log('  themes:', JSON.stringify(themeCounts));
  for (const h of hours) {
    console.log(`  ${h.hourStart} → ${h.items.length} items`);
  }
}

build();
