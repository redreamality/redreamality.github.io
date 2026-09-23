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
 * Idempotent. Prefer shortlisted + published + inbox score≥3; skip killed.
 * Groups by Asia/Shanghai floor hour of updated_at; within hour sorts by
 * score desc then status (published > shortlisted > writing > inbox).
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
const LOOKBACK_HOURS = 72;

const STATUS_RANK = {
  published: 0,
  shortlisted: 1,
  writing: 2,
  inbox: 3,
  killed: 9,
};

/** Manual EN title overrides when topics.md is Chinese-only but paraphrase is clear / blog exists */
const EN_TITLE_OVERRIDES = {
  t003: 'Jev × Claude Code: Four Real Integration Paths and a 25-Line Minimal Build',
};

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
  // Encode as fixed +08:00 offset
  return new Date(
    `${y}-${mo}-${d}T${h}:${mi}:${sec}+08:00`,
  );
}

function floorHourISO(date) {
  // Get Shanghai components via Intl
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const y = get('year');
  const mo = get('month');
  const d = get('day');
  const h = get('hour');
  return `${y}-${mo}-${d}T${h}:00:00+08:00`;
}

function hourLabel(hourStartISO) {
  const d = new Date(hourStartISO);
  const zh = new Intl.DateTimeFormat('zh-CN', {
    timeZone: TZ,
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(d);
  // zh-CN often "9/23 22:00" — normalize to "9月23日 22:00"
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
  // If only one side found, mirror slug
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

function readFrontmatterTitle(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fm) return null;
    const tm = fm[1].match(/^title:\s*["']?(.*?)["']?\s*$/m);
    return tm ? tm[1].replace(/^["']|["']$/g, '') : null;
  } catch {
    return null;
  }
}

function scanBlogSlugs() {
  const map = new Map(); // slug -> { zh, en, titleZh, titleEn }
  for (const [dir, lang] of [
    [BLOG_CN, 'zh'],
    [BLOG_EN, 'en'],
  ]) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.md') && !name.endsWith('.mdx')) continue;
      const slug = name.replace(/\.(md|mdx)$/, '');
      const title = readFrontmatterTitle(path.join(dir, name));
      if (!map.has(slug)) map.set(slug, {});
      const entry = map.get(slug);
      if (lang === 'zh') {
        entry.zh = `/cn/blog/${slug}/`;
        entry.titleZh = title;
      } else {
        entry.en = `/blog/${slug}/`;
        entry.titleEn = title;
      }
    }
  }
  return map;
}

/** Light EN paraphrase when title is mostly Latin / repo-style */
function englishTitle(id, zhTitle) {
  if (EN_TITLE_OVERRIDES[id]) return EN_TITLE_OVERRIDES[id];
  // If already mostly ASCII (repo names, arxiv titles), keep
  const asciiRatio =
    (zhTitle.match(/[\x00-\x7F]/g) || []).length / Math.max(zhTitle.length, 1);
  if (asciiRatio > 0.7) return zhTitle;
  return zhTitle; // keep Chinese for EN/JA when no translation
}

function shouldInclude(row) {
  const status = (row.status || '').toLowerCase();
  const score = Number(row.score) || 0;
  if (status === 'killed') return false;
  if (status === 'published' || status === 'shortlisted' || status === 'writing')
    return true;
  if (status === 'inbox' && score >= 3) return true;
  return false;
}

function matchBlog(row, blogMap, fromNotes) {
  const blog = { ...fromNotes };
  if (blog.zh || blog.en) return blog;
  if ((row.status || '').toLowerCase() !== 'published') return null;

  // Try slug hints from notes / title keywords
  const notes = row.notes || '';
  for (const [slug, paths] of blogMap) {
    if (notes.includes(slug) || notes.includes(`/blog/${slug}`)) {
      return {
        zh: paths.zh || null,
        en: paths.en || null,
      };
    }
  }
  // Known published mapping via id when notes already handled
  return null;
}

function build() {
  if (!fs.existsSync(TOPICS_MD)) {
    console.error(`topics.md not found: ${TOPICS_MD}`);
    process.exit(1);
  }
  const md = fs.readFileSync(TOPICS_MD, 'utf8');
  const rows = parseTable(md);
  const blogMap = scanBlogSlugs();

  // Enrich t003 titles from blog frontmatter when present
  const t003Blog = blogMap.get('jev-claude-code-10x-and-25-lines');
  if (t003Blog?.titleEn) EN_TITLE_OVERRIDES.t003 = t003Blog.titleEn;

  const now = new Date();
  const cutoff = new Date(now.getTime() - LOOKBACK_HOURS * 3600 * 1000);

  const items = [];
  for (const row of rows) {
    if (!shouldInclude(row)) continue;
    const updated = parseShanghaiLocal(row.updated_at);
    if (!updated) continue;
    // Keep items even if slightly older than lookback when data is sparse —
    // still filter killed/low. Prefer recent; include all non-killed eligible
    // within lookback OR always include published/shortlisted from this batch.
    if (updated < cutoff && (row.status || '').toLowerCase() === 'inbox') {
      continue;
    }

    const fromNotes = extractBlogFromNotes(row.notes);
    let blog = matchBlog(row, blogMap, fromNotes);
    // Published t003 hard-link if notes parse failed
    if (
      !blog &&
      (row.status || '').toLowerCase() === 'published' &&
      t003Blog &&
      row.id === 't003'
    ) {
      blog = { zh: t003Blog.zh, en: t003Blog.en };
    }
    if (blog && (!blog.zh || !blog.en) && t003Blog && row.id === 't003') {
      blog = {
        zh: blog.zh || t003Blog.zh,
        en: blog.en || t003Blog.en,
      };
    }

    const zhTitle = row.title;
    const enTitle =
      row.id === 't003' && t003Blog?.titleEn
        ? t003Blog.titleEn
        : englishTitle(row.id, zhTitle);

    const hourStart = floorHourISO(updated);
    items.push({
      id: row.id,
      title: { zh: zhTitle, en: enTitle, ja: zhTitle },
      summary: {
        zh: row.angle || row.notes || '',
        en: row.angle || row.notes || '',
        ja: row.angle || row.notes || '',
      },
      sources: splitList(row.sources).map((s) => s.toLowerCase()),
      score: Number(row.score) || 0,
      status: (row.status || 'inbox').toLowerCase(),
      externalUrls: splitList(row.urls),
      blog: blog && (blog.zh || blog.en) ? blog : undefined,
      updatedAt: updated.toISOString(),
      hourStart,
    });
  }

  // Group by hour
  const byHour = new Map();
  for (const item of items) {
    if (!byHour.has(item.hourStart)) byHour.set(item.hourStart, []);
    byHour.get(item.hourStart).push(item);
  }

  const statusCmp = (a, b) =>
    (STATUS_RANK[a.status] ?? 5) - (STATUS_RANK[b.status] ?? 5);

  const hours = [...byHour.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1)) // newest hour first
    .map(([hourStart, list]) => {
      list.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return statusCmp(a, b);
      });
      return {
        hourStart,
        label: hourLabel(hourStart),
        items: list.map(({ hourStart: _h, updatedAt: _u, ...rest }) => {
          // drop internal fields; keep blog only if set
          const clean = { ...rest };
          if (!clean.blog) delete clean.blog;
          return clean;
        }),
      };
    });

  // updatedAt: now in +08:00
  const updatedAt = floorHourISO(now).replace(/:00:00\+08:00$/, () => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
    const g = (t) => parts.find((p) => p.type === t)?.value;
    const ymd = floorHourISO(now).slice(0, 10);
    return `${ymd}T${g('hour')}:${g('minute')}:${g('second')}+08:00`;
  });
  // Simpler: format now as +08:00
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
    hours,
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(digest, null, 2) + '\n', 'utf8');

  const total = hours.reduce((n, h) => n + h.items.length, 0);
  console.log(
    `Wrote ${OUT_PATH} — ${hours.length} hour(s), ${total} item(s), updatedAt=${nowLabel}`,
  );
  for (const h of hours) {
    console.log(`  ${h.hourStart} → ${h.items.length} items`);
  }
}

build();
