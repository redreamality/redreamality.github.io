import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { Window } from 'happy-dom';
import { contentSlug } from './content-slug.mjs';

export function normalizePage(value) {
  const url = new URL(value);
  url.hash = '';
  url.search = '';
  return url.href;
}

export function classifyCoverage(pages, records, endDate) {
  const observed = new Set(records.filter(row => row.impressions > 0).map(row => normalizePage(row.url)));
  return pages.map(page => ({
    ...page,
    status: observed.has(normalizePage(page.url))
      ? 'observed-impressions'
      : page.declaredDate && page.declaredDate > endDate
        ? 'declared-date-after-window'
        : 'not-returned-in-page-table',
  }));
}

export function readGscSnapshot(snapshot) {
  const url = new URL(snapshot.url);
  if (url.hostname !== 'search.google.com' ||
      url.searchParams.get('resource_id') !== 'sc-domain:redreamality.com' ||
      url.searchParams.get('breakdown') !== 'page') {
    throw new Error('Expected the redreamality.com GSC page report.');
  }
  for (const key of ['page', 'query', 'country', 'device']) {
    if (url.searchParams.has(key)) throw new Error(`Remove the ${key} filter before a site coverage audit.`);
  }
  const searchType = url.searchParams.get('type') ?? 'web';
  if (searchType !== 'web' || !snapshot.text?.includes('Search type: Web (text)')) {
    throw new Error('This audit requires the Web (text) search report.');
  }
  const table = snapshot.tables?.[0];
  if (table?.[0]?.[0] !== 'Top pages' || table[0][2] !== 'Impressions') {
    throw new Error('Unexpected GSC table header.');
  }
  const dateValue = key => {
    const value = url.searchParams.get(key);
    if (!/^\d{8}$/.test(value ?? '')) throw new Error(`Explicit YYYYMMDD ${key} required.`);
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  };
  const startDate = dateValue('start_date');
  const endDate = dateValue('end_date');
  const displayDate = date => new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric',
  }).format(new Date(`${date}T00:00:00Z`));
  if (!snapshot.text?.includes(`from ${displayDate(startDate)} to ${displayDate(endDate)}`)) {
    throw new Error('The visible chart date range must match the requested URL dates.');
  }
  const records = table.slice(1).map(row => ({
    url: row[0].replace(' Copy URL to clipboard Open in new tab Inspect URL', ''),
    clicks: Number(row[1].replaceAll(',', '')),
    impressions: Number(row[2].replaceAll(',', '')),
  }));
  if (records.some(row => !Number.isSafeInteger(row.impressions) || row.impressions < 0)) {
    throw new Error('Invalid impression count.');
  }
  const pagination = snapshot.text.match(/\b[\d,]+-[\d,]+ of ([\d,]+)\b/);
  if (!pagination) throw new Error('Missing visible pagination total; coverage completeness is unknown.');
  const declaredRows = Number(pagination[1].replaceAll(',', ''));
  const uniqueRows = new Set(records.map(row => row.url)).size;
  if (records.length !== declaredRows || uniqueRows !== records.length) {
    throw new Error(`Incomplete or duplicate page table: ${records.length} rows, ${uniqueRows} unique, ${declaredRows} declared.`);
  }
  return {
    startDate,
    endDate,
    records,
    searchType: 'web-text',
    declaredRows,
    atRowLimit: records.length >= 1000,
    capturedAt: snapshot.capturedAt,
  };
}

export function parseSitemap(xml) {
  const window = new Window();
  try {
    const document = new window.DOMParser().parseFromString(xml, 'application/xml');
    const kind = document.documentElement.localName;
    if (!['sitemapindex', 'urlset'].includes(kind)) throw new Error(`Unexpected sitemap root: ${kind}`);
    const entryName = kind === 'sitemapindex' ? 'sitemap' : 'url';
    return {
      kind,
      urls: [...document.getElementsByTagName(entryName)]
        .map(entry => [...entry.children].find(child => child.localName === 'loc')?.textContent?.trim())
        .filter(Boolean),
    };
  } finally {
    window.close();
  }
}

async function fetchSitemap(url, visited = new Set()) {
  if (visited.has(url)) return [];
  if (new URL(url).origin !== 'https://redreamality.com') throw new Error('Unexpected sitemap origin.');
  visited.add(url);
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Sitemap HTTP ${response.status}: ${url}`);
  const parsed = parseSitemap(await response.text());
  if (parsed.kind === 'urlset') return parsed.urls;
  const urls = [];
  for (const child of parsed.urls) urls.push(...await fetchSitemap(child, visited));
  return urls;
}

export async function localMetadata(repo) {
  const metadata = new Map();
  for (const language of ['en', 'cn', 'ja']) {
    for (const type of ['blog', 'notes', 'questions']) {
      const dir = join(repo, 'src', 'content', `${type}-${language}`);
      const files = await readdir(dir, { recursive: true, withFileTypes: true });
      for (const file of files) {
        if (!file.isFile() || !/\.mdx?$/.test(file.name)) continue;
        const absolute = join(file.parentPath, file.name);
        const { frontmatter, content } = parseFrontmatter(await readFile(absolute, 'utf8'));
        const slug = contentSlug(relative(dir, absolute), frontmatter);
        const prefix = language === 'en' ? '' : `/${language}`;
        const route = type === 'blog' ? 'blog' : `garden/${type}`;
        const url = normalizePage(new URL(`${prefix}/${route}/${slug}/`, 'https://redreamality.com').href);
        const date = frontmatter.pubDate ?? frontmatter.date;
        metadata.set(url, {
          source: relative(repo, absolute).replaceAll('\\', '/'),
          language, type, title: frontmatter.title,
          declaredDate: date ? new Date(date).toISOString().slice(0, 10) : null,
          bodyCharacters: content.length,
        });
      }
    }
  }
  return metadata;
}

async function main() {
  const [snapshotPath, outputDirectory] = process.argv.slice(2);
  if (!snapshotPath || !outputDirectory) throw new Error('Usage: node scripts/gsc-coverage-audit.mjs <snapshot.json> <output-directory>');
  const repo = process.cwd();
  const snapshot = readGscSnapshot(JSON.parse(await readFile(snapshotPath, 'utf8')));
  const urls = [...new Set(await fetchSitemap('https://redreamality.com/sitemap-index.xml'))];
  const metadata = await localMetadata(repo);
  const pages = urls.filter(url => /^\/(?:cn\/|ja\/)?(?:blog|garden\/(?:notes|questions))\/[^/]+\/$/.test(new URL(url).pathname))
    .map(url => ({ url, ...metadata.get(normalizePage(url)) }));
  const coverage = classifyCoverage(pages, snapshot.records, snapshot.endDate);
  const result = {
    generatedAt: new Date().toISOString(),
    period: { start: snapshot.startDate, end: snapshot.endDate },
    gscCapturedAt: snapshot.capturedAt,
    searchType: snapshot.searchType,
    gscRows: snapshot.records.length,
    gscDeclaredRows: snapshot.declaredRows,
    gscAtRowLimit: snapshot.atRowLimit,
    sitemapUrls: urls.length,
    contentPages: pages.length,
    counts: Object.fromEntries(['observed-impressions', 'declared-date-after-window', 'not-returned-in-page-table']
      .map(status => [status, coverage.filter(page => page.status === status).length])),
    caveats: [
      'Missing GSC rows are not proof of zero impressions or missing indexation.',
      'Frontmatter dates are not verified deployment or Google discovery dates.',
      'The current sitemap is compared with historical performance.',
      'Query strings and fragments are removed for presence checks only; metrics are not summed.',
    ],
    pages: coverage,
  };
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(join(outputDirectory, 'coverage.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ ...result, pages: coverage.filter(page => page.status !== 'observed-impressions').slice(0, 35) }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
