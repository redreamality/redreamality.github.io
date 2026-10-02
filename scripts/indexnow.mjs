#!/usr/bin/env node
/**
 * Submit URLs to IndexNow (Bing, Yandex, and other participants).
 *
 * Ownership proof: public/{key}.txt deploys to https://redreamality.com/{key}.txt
 * (the key is intended to be public at that URL; IndexNow is not a private secret).
 *
 * Usage:
 *   node scripts/indexnow.mjs https://redreamality.com/blog/foo/
 *   node scripts/indexnow.mjs --stdin < urls.txt
 *   node scripts/indexnow.mjs --git-diff HEAD~1 HEAD
 *   node scripts/indexnow.mjs --git-diff HEAD~1 HEAD --dry-run
 *   pnpm indexnow -- --git-diff HEAD~1 HEAD
 *
 * Env overrides (optional): INDEXNOW_KEY, INDEXNOW_HOST, INDEXNOW_ENDPOINT
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const HOST = process.env.INDEXNOW_HOST || 'redreamality.com';
const SITE = `https://${HOST}`;
const KEY =
  process.env.INDEXNOW_KEY ||
  readKeyFromPublicFile() ||
  '97c30153e5a34ca0854e52d8ae413f1a';
const KEY_LOCATION = `${SITE}/${KEY}.txt`;
const ENDPOINT = process.env.INDEXNOW_ENDPOINT || 'https://api.indexnow.org/indexnow';
const MAX_URLS = 10000;

/** Content collection → live path segment (trailingSlash: always). */
const COLLECTION_ROUTE = {
  blog: '/blog',
  notes: '/garden/notes',
  chaos: '/garden/chaos',
  talks: '/garden/talks',
  questions: '/garden/questions',
  meditations: '/garden/meditations',
  projects: '/projects',
};

const LANG_PREFIX = { en: '', cn: '/cn', ja: '/ja' };

const CONTENT_RE =
  /^src\/content\/(blog|notes|chaos|talks|questions|meditations|projects)-(en|cn|ja)\/(.+)\.mdx?$/;

function readKeyFromPublicFile() {
  try {
    const files = readdirSync(join(ROOT, 'public'));
    const keyFile = files.find((name) => /^[a-zA-Z0-9-]{8,128}\.txt$/.test(name));
    if (!keyFile) return null;
    const body = readFileSync(join(ROOT, 'public', keyFile), 'utf8').trim();
    const nameKey = keyFile.replace(/\.txt$/, '');
    return body === nameKey ? body : null;
  } catch {
    return null;
  }
}

function parseFrontmatterSlug(filePath) {
  try {
    const source = readFileSync(filePath, 'utf8');
    if (!source.startsWith('---')) return null;
    const end = source.indexOf('\n---', 3);
    if (end < 0) return null;
    const fm = source.slice(3, end);
    const m = fm.match(/^slug:\s*(.+)$/m);
    if (!m) return null;
    let v = m[1].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    return v || null;
  } catch {
    return null;
  }
}

/** Mirror scripts/content-slug.mjs without importing github-slugger (CI-friendly). */
function contentSlugFromEntry(entry, dataSlug) {
  if (dataSlug) return String(dataSlug);
  return entry
    .replaceAll('\\', '/')
    .replace(/\.mdx?$/, '')
    .split('/')
    .map((segment) =>
      segment
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\-_./]+/gu, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, ''),
    )
    .filter(Boolean)
    .join('/')
    .replace(/\/index$/, '');
}

function contentPathToUrl(repoPath) {
  const normalized = repoPath.replaceAll('\\', '/').replace(/^\.\//, '');
  const m = normalized.match(CONTENT_RE);
  if (!m) return null;
  const [, collection, lang, entry] = m;
  const route = COLLECTION_ROUTE[collection];
  const prefix = LANG_PREFIX[lang];
  if (route === undefined || prefix === undefined) return null;

  const abs = join(ROOT, normalized);
  const slug = contentSlugFromEntry(entry + '.md', parseFrontmatterSlug(abs));
  if (!slug) return null;
  return `${SITE}${prefix}${route}/${slug}/`;
}

function gitDiffPaths(base, head) {
  const out = execFileSync(
    'git',
    ['diff', '--name-status', '--diff-filter=ACDMR', base, head],
    { cwd: ROOT, encoding: 'utf8' },
  );
  const paths = [];
  for (const line of out.split(/\r?\n/)) {
    if (!line.trim()) continue;
    // status\tpath  OR  R100\told\tnew
    const parts = line.split('\t');
    const status = parts[0][0];
    if (status === 'R' || status === 'C') {
      if (parts[1]) paths.push(parts[1]);
      if (parts[2]) paths.push(parts[2]);
    } else if (parts[1]) {
      paths.push(parts[1]);
    }
  }
  return paths;
}

function normalizeUrl(raw) {
  const s = raw.trim();
  if (!s || s.startsWith('#')) return null;
  let url;
  try {
    url = new URL(s);
  } catch {
    // allow path-only input
    url = new URL(s.startsWith('/') ? s : `/${s}`, SITE);
  }
  if (url.hostname !== HOST && url.hostname !== `www.${HOST}`) {
    console.warn(`skip (host mismatch): ${s}`);
    return null;
  }
  // trailingSlash: always
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  url.hash = '';
  url.search = '';
  return url.toString();
}

async function readStdinLines() {
  const lines = [];
  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of rl) lines.push(line);
  return lines;
}

function usage() {
  console.log(`Usage:
  node scripts/indexnow.mjs <url> [url...]
  node scripts/indexnow.mjs --stdin
  node scripts/indexnow.mjs --git-diff <base> [head]
  node scripts/indexnow.mjs --dry-run ...

Key file: ${KEY_LOCATION}
Endpoint: ${ENDPOINT}`);
}

async function collectUrls(argv) {
  const dryRun = argv.includes('--dry-run');
  const args = argv.filter((a) => a !== '--dry-run');

  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    usage();
    process.exit(args.length === 0 ? 1 : 0);
  }

  /** @type {string[]} */
  let raw = [];

  if (args[0] === '--stdin') {
    raw = await readStdinLines();
  } else if (args[0] === '--git-diff') {
    const base = args[1];
    const head = args[2] || 'HEAD';
    if (!base) {
      console.error('--git-diff requires <base> [head]');
      process.exit(1);
    }
    const paths = gitDiffPaths(base, head);
    for (const p of paths) {
      const url = contentPathToUrl(p);
      if (url) raw.push(url);
      else if (CONTENT_RE.test(p.replaceAll('\\', '/'))) {
        console.warn(`could not map content path: ${p}`);
      }
    }
    if (raw.length === 0) {
      console.log(`No content URLs changed between ${base} and ${head}.`);
      return { urls: [], dryRun };
    }
  } else {
    raw = args;
  }

  const urls = [...new Set(raw.map(normalizeUrl).filter(Boolean))];
  if (urls.length > MAX_URLS) {
    console.error(`Too many URLs (${urls.length}); max ${MAX_URLS}`);
    process.exit(1);
  }
  return { urls, dryRun };
}

async function submit(urls) {
  const body = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  };
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  const text = await res.text().catch(() => '');
  return { status: res.status, text };
}

const { urls, dryRun } = await collectUrls(process.argv.slice(2));
if (urls.length === 0) process.exit(0);

console.log(`IndexNow: ${urls.length} URL(s) → ${ENDPOINT}`);
for (const u of urls) console.log(`  ${u}`);

if (dryRun) {
  console.log('Dry run; nothing submitted.');
  process.exit(0);
}

const { status, text } = await submit(urls);
// 200 OK, 202 Accepted (key validation pending) are success.
if (status === 200 || status === 202) {
  console.log(`OK HTTP ${status}${text ? `: ${text.slice(0, 200)}` : ''}`);
  process.exit(0);
}

console.error(`IndexNow failed HTTP ${status}${text ? `: ${text.slice(0, 500)}` : ''}`);
process.exit(1);
