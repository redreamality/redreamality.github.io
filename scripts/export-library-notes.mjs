import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, rename, unlink, mkdir } from 'node:fs/promises';
import { isIP } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const root = fileURLToPath(new URL('../', import.meta.url));
const secretParameter = /token|secret|password|passwd|credential|signature|authorization|api[-_]?key|access[-_]?key|session|jwt|^auth$|^key$|^sig$|^code$/i;
const credentialPattern = /(?<![A-Za-z0-9_])(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{30,}|(?:AKIA|ASIA)[A-Z0-9]{16}|xox[baprs]-[A-Za-z0-9-]{20,}|eyJ[\w-]+\.[\w-]+\.[\w-]+)|-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----|(?:authorization\s*[:=]\s*bearer|api[-_ ]?key\s*[:=]|access[-_ ]?token\s*[:=]|password\s*[:=])\s*["']?[^\s"'<>]{12,}/i;

function requireValue(condition, code) {
  if (!condition) throw new Error(code);
}

function inspectedText(value) {
  let decoded = value;
  for (let count = 0; count < 8; count++) {
    requireValue(!credentialPattern.test(decoded), 'unsafe_public_text');
    const next = decoded.replace(/%([a-f0-9]{2})/gi, (_, byte) => String.fromCharCode(parseInt(byte, 16)));
    if (next === decoded) return decoded;
    decoded = next;
  }
  throw new Error('unsafe_nested_encoding');
}

function text(value, maximum) {
  requireValue(typeof value === 'string' && value.trim().length > 0 && value.length <= maximum, 'invalid_text');
  requireValue(!/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value), 'invalid_text');
  inspectedText(value);
  return value.trim();
}

function sourceURL(value, depth = 0) {
  requireValue(depth <= 3, 'unsafe_nested_url');
  const input = text(value, 8192);
  requireValue(!/[\s\\]/.test(input), 'unsafe_source_url');
  let url;
  try { url = new URL(input); } catch { throw new Error('unsafe_source_url'); }
  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  requireValue(
    ['https:', 'http:'].includes(url.protocol) &&
    !url.username && !url.password && !url.hash &&
    !url.port && hostname.includes('.') &&
    !isIP(hostname.replace(/^\[|\]$/g, '')) &&
    !/(^|\.)(localhost|local|internal|home|lan|test|invalid)$/.test(hostname),
    'unsafe_source_url',
  );
  inspectedText(url.pathname);
  for (const [key, value] of url.searchParams) {
    requireValue(!secretParameter.test(inspectedText(key)), 'unsafe_source_url');
    for (const nested of inspectedText(value).matchAll(/https?:\/\/[^\s"'<>]+/gi)) {
      sourceURL(nested[0], depth + 1);
    }
  }
  return input;
}

export function projectArchive(archive, policy) {
  requireValue(
    archive && archive.version === 1 && archive.entries &&
    typeof archive.entries === 'object' && !Array.isArray(archive.entries),
    'invalid_archive',
  );
  requireValue(
    policy && policy.version === 1 && Array.isArray(policy.excludedIds) &&
    policy.excludedIds.every(id => typeof id === 'string' && /^[a-f0-9]{64}$/.test(id)),
    'invalid_policy',
  );
  const excluded = new Set(policy.excludedIds);
  const entries = [];
  for (const [id, entry] of Object.entries(archive.entries)) {
    requireValue(entry && typeof entry === 'object', 'invalid_archive_entry');
    requireValue(['success', 'failed', 'running'].includes(entry.status), 'invalid_archive_status');
    if (entry.status !== 'success' || excluded.has(id) || entry.publish === false || entry.visibility === 'private') continue;
    requireValue(/^[a-f0-9]{64}$/.test(id), 'invalid_id');
    const url = sourceURL(entry.url);
    requireValue(createHash('sha256').update(url).digest('hex') === id, 'source_id_mismatch');
    requireValue(
      typeof entry.created_at === 'string' &&
      /^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(entry.created_at) &&
      Number.isFinite(Date.parse(entry.created_at)),
      'invalid_date',
    );
    const summary = entry.summary;
    requireValue(summary && Array.isArray(summary.bullets) && summary.bullets.length >= 3 && summary.bullets.length <= 8, 'invalid_summary');
    const coverage = entry.coverage;
    requireValue(
      coverage && typeof coverage.complete === 'boolean' &&
      Number.isSafeInteger(coverage.total_chars) && Number.isSafeInteger(coverage.summarized_chars) &&
      coverage.total_chars > 0 && coverage.summarized_chars > 0 &&
      coverage.summarized_chars <= coverage.total_chars &&
      coverage.complete === (coverage.total_chars === coverage.summarized_chars),
      'invalid_coverage',
    );
    // Explicit projection: never spread the private entry or nested objects.
    entries.push({
      id,
      title: text(entry.title, 12000),
      url,
      date: new Date(entry.created_at).toISOString(),
      language: 'zh',
      sentence: text(summary.sentence, 1200),
      bullets: summary.bullets.map(bullet => {
        requireValue(bullet && Array.isArray(bullet.details) && bullet.details.length >= 1 && bullet.details.length <= 4, 'invalid_summary');
        return {
          heading: text(bullet.heading, 300),
          details: bullet.details.map(detail => text(detail, 2000)),
        };
      }),
      coverage: {
        complete: coverage.complete,
        summarizedChars: coverage.summarized_chars,
        totalChars: coverage.total_chars,
      },
    });
  }
  entries.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  return { version: 1, entries };
}

export async function writePublicFeed(archive, policy, output) {
  const feed = projectArchive(archive, policy);
  const serialized = JSON.stringify(feed, null, 2) + '\n';
  let previous;
  try { previous = await readFile(output, 'utf8'); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (previous === serialized) return { changed: false, published: feed.entries.length };
  await mkdir(dirname(output), { recursive: true });
  const temporary = `${output}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, serialized, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
    await rename(temporary, output);
  } finally {
    await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; });
  }
  return { changed: true, published: feed.entries.length };
}

async function main() {
  const { values } = parseArgs({
    options: {
      archive: { type: 'string' },
      github: { type: 'boolean', default: false },
      output: { type: 'string', default: resolve(root, 'src/data/library-notes.json') },
      policy: { type: 'string', default: resolve(root, 'src/data/library-notes-policy.json') },
    },
    strict: true,
  });
  requireValue(Boolean(values.archive) !== values.github, 'choose_one_archive_source');
  let archive;
  if (values.github) {
    const response = JSON.parse(execFileSync('gh', [
      'api', 'repos/redreamality/my-personal-library-archive/contents/data.json?ref=main',
    ], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }));
    requireValue(response.encoding === 'base64', 'invalid_github_response');
    archive = JSON.parse(Buffer.from(response.content, 'base64').toString('utf8'));
  } else {
    archive = JSON.parse(await readFile(values.archive, 'utf8'));
  }
  const policy = JSON.parse(await readFile(values.policy, 'utf8'));
  console.log(JSON.stringify(await writePublicFeed(archive, policy, resolve(values.output))));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    const allowed = /^(invalid_|unsafe_|source_id_|choose_one_)/.test(error.message);
    console.error(JSON.stringify({ error: allowed ? error.message : 'library_export_failed' }));
    process.exitCode = 1;
  });
}
