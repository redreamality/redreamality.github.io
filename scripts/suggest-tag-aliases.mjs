#!/usr/bin/env node
/**
 * Scan blog-{en,cn,ja}/ frontmatter tags and print two buckets:
 *   (A) auto-foldable by normalizeTag rules (case / kebab → curated slug)
 *   (B) need manual aliases (CJK / semantic / no curated hit)
 *
 * Does NOT write into tag-taxonomy.json.
 * Optionally writes a scratch markdown under /workspace/blog-pipeline/.
 *
 * Usage:
 *   node scripts/suggest-tag-aliases.mjs
 *   node scripts/suggest-tag-aliases.mjs --out /workspace/blog-pipeline/_tag-alias-suggestions.md
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '@astrojs/markdown-remark';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const taxonomy = JSON.parse(readFileSync(join(root, 'src/data/tag-taxonomy.json'), 'utf8'));

const aliases = taxonomy.aliases ?? {};
const curated = new Set();
for (const theme of taxonomy.themes ?? []) {
  for (const cluster of theme.clusters ?? []) {
    for (const node of cluster.tags ?? []) {
      if (node.slug) curated.add(node.slug);
    }
  }
}

/** Mirror of normalizeTag in src/utils/tag-taxonomy.ts (manual aliases win). */
function normalizeTag(tag) {
  const raw = String(tag).trim();
  if (aliases[raw]) return aliases[raw];
  const lower = raw.toLowerCase();
  if (aliases[lower]) return aliases[lower];
  for (const [key, value] of Object.entries(aliases)) {
    if (key.toLowerCase() === lower) return value;
  }
  if (curated.has(raw)) return raw;
  if (curated.has(lower)) return lower;
  const kebab = raw.replace(/[\s_]+/g, '-').toLowerCase();
  if (curated.has(kebab)) return kebab;
  return raw;
}

/** Auto fold only (no manual aliases) — used to classify bucket A. */
function autoFoldOnly(tag) {
  const raw = String(tag).trim();
  if (curated.has(raw)) return { canon: raw, via: 'exact-curated' };
  const lower = raw.toLowerCase();
  if (curated.has(lower)) return { canon: lower, via: 'lower' };
  const kebab = raw.replace(/[\s_]+/g, '-').toLowerCase();
  if (curated.has(kebab)) return { canon: kebab, via: 'kebab-lower' };
  return null;
}

function hasCjk(s) {
  return /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/.test(s);
}

function collectBlogTags() {
  const counts = new Map(); // raw -> { count, files }
  for (const lang of ['en', 'cn', 'ja']) {
    const dir = join(root, 'src/content', `blog-${lang}`);
    let entries;
    try {
      entries = readdirSync(dir, { recursive: true, withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isFile() || !/\.mdx?$/.test(entry.name)) continue;
      const file = join(entry.parentPath ?? entry.path, entry.name);
      let fm;
      try {
        fm = parseFrontmatter(readFileSync(file, 'utf8')).frontmatter;
      } catch {
        continue;
      }
      const tags = Array.isArray(fm?.tags) ? fm.tags : [];
      for (const tag of tags) {
        if (typeof tag !== 'string' || !tag.trim()) continue;
        const raw = tag.trim();
        const cur = counts.get(raw) ?? { count: 0, files: [] };
        cur.count += 1;
        if (cur.files.length < 3) cur.files.push(file.replace(root + '/', ''));
        counts.set(raw, cur);
      }
    }
  }
  return counts;
}

const outArgIdx = process.argv.indexOf('--out');
const outPath =
  outArgIdx >= 0
    ? process.argv[outArgIdx + 1]
    : '/workspace/blog-pipeline/_tag-alias-suggestions.md';

const rawCounts = collectBlogTags();
const bucketA = []; // auto-foldable variants (raw !== canon via auto)
const bucketB = []; // need manual / stay other

for (const [raw, meta] of [...rawCounts.entries()].sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))) {
  const withManual = normalizeTag(raw);
  const auto = autoFoldOnly(raw);

  if (auto && auto.canon !== raw) {
    // Variant that auto rules already fold onto a curated slug
    bucketA.push({
      raw,
      canon: auto.canon,
      via: auto.via,
      count: meta.count,
      files: meta.files,
      alsoManual: withManual !== auto.canon ? withManual : null,
    });
    continue;
  }

  if (auto && auto.canon === raw) {
    // Already canonical curated — skip noise
    continue;
  }

  // No curated auto hit
  if (withManual !== raw) {
    // Already covered by a manual alias
    bucketB.push({
      raw,
      status: 'manual-alias-already',
      canon: withManual,
      count: meta.count,
      files: meta.files,
      note: hasCjk(raw) ? 'CJK/JA (manual)' : 'semantic/manual',
    });
    continue;
  }

  bucketB.push({
    raw,
    status: 'needs-decision',
    canon: null,
    count: meta.count,
    files: meta.files,
    note: hasCjk(raw)
      ? 'CJK/JA — add manual alias only if intentional; do NOT auto-map'
      : 'no curated hit — leave as other, or add semantic manual alias',
  });
}

function fmtA(rows) {
  if (!rows.length) return '_None_\n';
  return (
    '| raw | → curated | via | count | sample files |\n|---|---|---|---:|---|\n' +
    rows
      .map(
        (r) =>
          `| \`${r.raw}\` | \`${r.canon}\` | ${r.via}${r.alsoManual ? ` (manual would → \`${r.alsoManual}\`)` : ''} | ${r.count} | ${r.files.map((f) => `\`${f}\``).join(', ')} |`
      )
      .join('\n') +
    '\n'
  );
}

function fmtB(rows) {
  if (!rows.length) return '_None_\n';
  return (
    '| raw | status | canon | count | note | sample files |\n|---|---|---|---:|---|---|\n' +
    rows
      .map(
        (r) =>
          `| \`${r.raw}\` | ${r.status} | ${r.canon ? `\`${r.canon}\`` : '—'} | ${r.count} | ${r.note} | ${r.files.map((f) => `\`${f}\``).join(', ')} |`
      )
      .join('\n') +
    '\n'
  );
}

const generatedAt = new Date().toISOString();
const md = `# Tag alias suggestions (scratch)

Generated: ${generatedAt}

Source: \`blog-en\` / \`blog-cn\` / \`blog-ja\` frontmatter tags.
Rules mirror \`normalizeTag\` in \`src/utils/tag-taxonomy.ts\`.
**Do not** write these back into \`tag-taxonomy.json\` automatically.

## (A) Auto-foldable by build-time rules

These TitleCase / space / underscore variants already fold onto a **curated** slug without a manual alias. Prefer cleaning frontmatter over adding aliases.

${fmtA(bucketA)}
## (B) Need manual aliases or stay as other

CJK / semantic merges / no curated hit. Manual \`aliases\` only for intentional semantic or CJK/JA folds. Never auto-map arbitrary Chinese (e.g. \`深度求索\` ↛ \`deepseek\`).

${fmtB(bucketB)}
## Summary

- Unique raw tags scanned: **${rawCounts.size}**
- Bucket A (auto-foldable variants): **${bucketA.length}**
- Bucket B (manual / other): **${bucketB.length}**
`;

// stdout
console.log('=== (A) Auto-foldable by rules ===');
if (!bucketA.length) console.log('(none)');
else {
  for (const r of bucketA) {
    console.log(`  ${JSON.stringify(r.raw)} → ${r.canon}  [${r.via}]  n=${r.count}`);
  }
}
console.log('\n=== (B) Need manual aliases / other ===');
if (!bucketB.length) console.log('(none)');
else {
  for (const r of bucketB) {
    console.log(
      `  ${JSON.stringify(r.raw)}  [${r.status}]  → ${r.canon ?? '—'}  n=${r.count}  (${r.note})`
    );
  }
}
console.log(`\nSummary: raw=${rawCounts.size} A=${bucketA.length} B=${bucketB.length}`);

if (outPath) {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, md);
  console.log(`\nWrote scratch: ${outPath}`);
}
