#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const seo = await import(pathToFileURL(join(__dirname, '../src/utils/seo.ts')).href);
const {
  resolveDocumentTitle,
  resolveMetaDescription,
  SEO_TITLE_MAX,
  SEO_DESC_TARGET_MIN,
} = seo;

const root = join(__dirname, '../src/content');

function parseFrontmatter(source) {
  if (!source.startsWith('---')) return { data: {}, body: source };
  const end = source.indexOf('\n---', 3);
  if (end < 0) return { data: {}, body: source };
  const fm = source.slice(3, end).trim();
  const body = source.slice(end + 4);
  const data = {};
  for (const line of fm.split(/\r?\n/)) {
    if (!line || line.startsWith('#') || line.startsWith(' ') || line.startsWith('-')) continue;
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) v = v.slice(1, -1);
    if (!(m[1] in data)) data[m[1]] = v;
  }
  return { data, body };
}

function langOf(file) {
  if (/[\\/](blog|notes|chaos|talks|questions|meditations|projects)-cn[\\/]/.test(file)) return 'zh';
  if (/[\\/](blog|notes|chaos|talks|questions|meditations|projects)-ja[\\/]/.test(file)) return 'ja';
  return 'en';
}

function hasContentH1(body) {
  let inFence = false;
  let fenceChar = '';
  let fenceLen = 0;
  for (const line of body.split(/\r?\n/)) {
    const fence = line.match(/^(`{3,}|~{3,})/);
    if (fence) {
      const mark = fence[1][0];
      const len = fence[1].length;
      if (!inFence) { inFence = true; fenceChar = mark; fenceLen = len; }
      else if (mark === fenceChar && len >= fenceLen) inFence = false;
      continue;
    }
    if (!inFence && /^#\s+\S/.test(line)) return true;
  }
  return false;
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) walk(p, out);
    else if (/\.mdx?$/.test(name.name)) out.push(p);
  }
  return out;
}

const files = walk(root);
let longTitle = 0, shortTitle = 0, shortDesc = 0, contentH1 = 0;
const bingLong = [
  'anthropic-claude-code-review-multi-agent',
  'cordis-spatiotemporal-composability-deepseek-harness',
  'deepseek-v4-benchmarks-guide',
  'gemini-cli-contributors-deep-analysis',
  'ralph-wiggum-loop-vs-open-spec',
  'the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs',
  'github-spec-kit-guide',
  '-sddbmad-vs-spec-kit-vs-openspec-vs-promptx',
  'openspec-tutorial-cli-commands-agents-md-examples',
  'pythonpathvs-code',
  'openspec-guide',
];
const bingLongResults = [];

for (const file of files) {
  const { data, body } = parseFrontmatter(readFileSync(file, 'utf8'));
  const lang = langOf(file);
  const display = data.title || '';
  const docTitle = resolveDocumentTitle(data.seoTitle || display, lang, undefined, { description: data.description || "" });
  const desc = resolveMetaDescription(data.seoDescription || data.description || '', display, lang);
  if (docTitle.length > SEO_TITLE_MAX) longTitle++;
  if (docTitle.length < 45) shortTitle++;
  if (desc.length < SEO_DESC_TARGET_MIN) shortDesc++;
  if (hasContentH1(body)) contentH1++;
  if (bingLong.some((s) => file.includes(s))) {
    bingLongResults.push({ file: file.split('/content/')[1], titleLen: docTitle.length, title: docTitle, descLen: desc.length });
  }
}

console.log(JSON.stringify({
  pages: files.length,
  resolvedTitleOver70: longTitle,
  resolvedTitleUnder45: shortTitle,
  resolvedDescUnder150: shortDesc,
  sourceMarkdownH1Files: contentH1,
  note: 'Build-time remark-demote-h1 converts content H1 → H2; source count is informational.',
  bingFlaggedLongTitleAfterFix: bingLongResults,
}, null, 2));
