#!/usr/bin/env node
/**
 * Crawl built HTML in dist/ and verify every language-switcher link and every
 * <link rel="alternate" hreflang> target resolves to a file that exists in dist.
 *
 * Usage: node scripts/check-locale-links.mjs [distDir] [--json] [--quiet]
 * Exit code 1 when any dead target is found.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const SITE_ORIGIN = 'https://redreamality.com';

const args = process.argv.slice(2);
const distDir = args.find((arg) => !arg.startsWith('--')) ?? 'dist';
const asJson = args.includes('--json');
const quiet = args.includes('--quiet');

function* walkHtml(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) yield* walkHtml(full);
    else if (name.endsWith('.html')) yield full;
  }
}

function decodeEntities(value) {
  return value.replace(/&amp;/g, '&').replace(/&#38;/g, '&').replace(/&quot;/g, '"');
}

export function resolveTarget(href, root = distDir) {
  let pathname = decodeEntities(href);
  if (pathname.startsWith(SITE_ORIGIN)) pathname = pathname.slice(SITE_ORIGIN.length) || '/';
  if (/^[a-z]+:/i.test(pathname)) return { external: true, exists: true };
  pathname = pathname.split('#')[0].split('?')[0];
  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    // keep raw
  }
  const candidates = pathname.endsWith('/')
    ? [join(root, pathname, 'index.html'), join(root, `${pathname.replace(/\/$/, '')}.html`)]
    : [join(root, pathname), join(root, `${pathname}.html`), join(root, pathname, 'index.html')];
  return { external: false, exists: candidates.some((candidate) => existsSync(candidate) && statSync(candidate).isFile()) };
}

function pagePathFor(file, root) {
  const rel = relative(root, file).split(sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  return `/${rel}`;
}

export function extractSwitcherHrefs(html) {
  const hrefs = [];
  let from = 0;
  while (true) {
    const start = html.indexOf('class="language-toggle', from);
    if (start === -1) break;
    const scriptAt = html.indexOf('<script', start);
    const end = scriptAt === -1 ? html.length : scriptAt;
    const block = html.slice(start, end);
    for (const tag of block.match(/<a\b[^>]*>/g) ?? []) {
      if (!/role="menuitem"/.test(tag)) continue;
      const href = tag.match(/\shref="([^"]*)"/);
      if (href) hrefs.push(href[1]);
    }
    from = end;
  }
  return hrefs;
}

export function extractHreflang(html) {
  const out = [];
  for (const tag of html.match(/<link\b[^>]*>/g) ?? []) {
    if (!/rel="alternate"/.test(tag)) continue;
    const lang = tag.match(/\shreflang="([^"]*)"/);
    const href = tag.match(/\shref="([^"]*)"/);
    if (lang && href) out.push({ lang: lang[1], href: href[1] });
  }
  return out;
}

export function checkDist(root = distDir) {
  const report = {
    pages: 0,
    switchLinks: 0,
    deadSwitchLinks: 0,
    hreflangLinks: 0,
    deadHreflang: 0,
    deadXDefault: 0,
    pagesWithDeadLinks: 0,
    examples: [],
  };
  for (const file of walkHtml(root)) {
    const html = readFileSync(file, 'utf8');
    report.pages += 1;
    const page = pagePathFor(file, root);
    let pageHasDead = false;
    for (const href of extractSwitcherHrefs(html)) {
      report.switchLinks += 1;
      if (!resolveTarget(href, root).exists) {
        report.deadSwitchLinks += 1;
        pageHasDead = true;
        if (report.examples.length < 40) report.examples.push({ page, kind: 'switch', href });
      }
    }
    for (const { lang, href } of extractHreflang(html)) {
      report.hreflangLinks += 1;
      if (!resolveTarget(href, root).exists) {
        if (lang === 'x-default') report.deadXDefault += 1;
        else report.deadHreflang += 1;
        pageHasDead = true;
        if (report.examples.length < 40) report.examples.push({ page, kind: `hreflang:${lang}`, href });
      }
    }
    if (pageHasDead) report.pagesWithDeadLinks += 1;
  }
  return report;
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  if (!existsSync(distDir)) {
    console.error(`dist directory not found: ${distDir}`);
    process.exit(2);
  }
  const report = checkDist(distDir);
  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`pages scanned:          ${report.pages}`);
    console.log(`switch links:           ${report.switchLinks} (dead: ${report.deadSwitchLinks})`);
    console.log(`hreflang alternates:    ${report.hreflangLinks} (dead: ${report.deadHreflang}, dead x-default: ${report.deadXDefault})`);
    console.log(`pages with dead links:  ${report.pagesWithDeadLinks}`);
    if (!quiet && report.examples.length) {
      console.log('examples:');
      for (const example of report.examples) console.log(`  ${example.page}  [${example.kind}]  -> ${example.href}`);
    }
  }
  const dead = report.deadSwitchLinks + report.deadHreflang + report.deadXDefault;
  process.exit(dead > 0 ? 1 : 0);
}
