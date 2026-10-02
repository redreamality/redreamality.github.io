// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { projectArchive, writePublicFeed } from '../../scripts/export-library-notes.mjs';

const policy = { version: 1, excludedIds: [] };
const privateMarker = 'PRIVATE_RAW_ERROR_CREDENTIAL_SENTINEL';
function fixture(url = 'https://example.com/article') {
  const id = createHash('sha256').update(url).digest('hex');
  return {
    version: 1,
    internal: privateMarker,
    entries: {
      [id]: {
        status: 'success', url, title: 'Collected article',
        created_at: '2026-10-01T12:00:00+00:00',
        updated_at: '2026-10-01T15:00:00Z', attempts: 3,
        raw: privateMarker, raw_sha256: privateMarker,
        errors: [{ code: privateMarker }], fetch: { token: privateMarker },
        summary: {
          sentence: '中文摘要。', secret: privateMarker,
          bullets: [1, 2, 3].map(n => ({
            heading: `Point ${n}`, details: [`Detail ${n}`], raw: privateMarker,
          })),
        },
        coverage: { complete: true, total_chars: 1000, summarized_chars: 1000, raw: privateMarker },
      },
    },
  };
}
function first(archive = fixture()) { return Object.values(archive.entries)[0]; }

describe('private archive public projection', () => {
  it('publishes an exact allowlist without nested metadata, raw text or errors', () => {
    const feed = projectArchive(fixture(), policy);
    expect(Object.keys(feed)).toEqual(['version', 'entries']);
    expect(Object.keys(feed.entries[0])).toEqual([
      'id', 'title', 'url', 'date', 'language', 'sentence', 'bullets', 'coverage',
    ]);
    expect(Object.keys(feed.entries[0].bullets[0])).toEqual(['heading', 'details']);
    expect(Object.keys(feed.entries[0].coverage)).toEqual(['complete', 'summarizedChars', 'totalChars']);
    expect(JSON.stringify(feed)).not.toContain(privateMarker);
    expect(feed.entries[0].language).toBe('zh');
    expect(feed.entries[0].date).toBe('2026-10-01T12:00:00.000Z');
  });

  it('excludes failed, running, explicitly private, and policy-denied entries', () => {
    for (const status of ['failed', 'running']) {
      const archive = fixture();
      first(archive).status = status;
      expect(projectArchive(archive, policy).entries).toEqual([]);
    }
    const archive = fixture();
    const id = Object.keys(archive.entries)[0];
    expect(projectArchive(archive, { version: 1, excludedIds: [id] }).entries).toEqual([]);
    Object.assign(first(archive), { publish: false });
    expect(projectArchive(archive, policy).entries).toEqual([]);
    Object.assign(first(archive), { publish: true, visibility: 'private' });
    expect(projectArchive(archive, policy).entries).toEqual([]);
  });

  it.each([
    'javascript:alert(1)', 'file:///secret', 'https://user:password@example.com/a',
    'http://localhost/a', 'http://127.0.0.1/a', 'https://10.0.0.1/a',
    'http://2130706433/a', 'https://[::1]/a', 'https://service.internal/a',
    'https://example.com:8443/a', 'https://example.com/a#token=hidden',
    'https://example.com/a?api_key=secret', 'https://example.com/a?%256bey=secret',
    'https://example.com/a?x=ghp_abcdefghijklmnopqrstuvwxyz',
    'https://example.com/ghp_abcdefghijklmnopqrstuvwxyz',
    'https://example.com/%67hp_abcdefghijklmnopqrstuvwxyz',
    'https://example.com/a?redirect=https%3A%2F%2Fexample.net%2Fa%3Ftoken%3Dhidden',
    'https://example.com/a?next=https%253A%252F%252Fexample.net%252Fa%253Fapi_key%253Dhidden',
  ])('rejects an unsafe or credential-bearing URL: %s', url => {
    expect(() => projectArchive(fixture(url), policy)).toThrow();
  });

  it('keeps meaningful query values and escaped content as text, not executable markup', () => {
    const archive = fixture('https://example.com/article?language=en&version=2');
    first(archive).summary.sentence = '<script>alert("x")</script>';
    const entry = projectArchive(archive, policy).entries[0];
    expect(entry.url).toContain('?language=en&version=2');
    expect(entry.sentence).toBe('<script>alert("x")</script>');
  });

  it.each(['title', 'sentence', 'heading', 'detail'])('rejects credential-like content in public %s', field => {
    const archive = fixture();
    const secret = 'ghp_abcdefghijklmnopqrstuvwxyz123456';
    if (field === 'title') first(archive).title = `Title ${secret}`;
    if (field === 'sentence') first(archive).summary.sentence = `Use ${secret}`;
    if (field === 'heading') first(archive).summary.bullets[0].heading = secret;
    if (field === 'detail') first(archive).summary.bullets[0].details[0] = secret;
    expect(() => projectArchive(archive, policy)).toThrow('unsafe_public_text');
  });

  it('rejects encoded credentials and private-key blocks while permitting normal technical words', () => {
    const archive = fixture();
    first(archive).summary.sentence = 'Credential %2567hp_abcdefghijklmnopqrstuvwxyz123456';
    expect(() => projectArchive(archive, policy)).toThrow('unsafe_public_text');
    first(archive).summary.sentence = '-----BEGIN RSA PRIVATE KEY-----';
    expect(() => projectArchive(archive, policy)).toThrow('unsafe_public_text');
    first(archive).summary.sentence = 'A task-management-workflow-example with 100% coverage';
    expect(projectArchive(archive, policy).entries).toHaveLength(1);
  });

  it('validates IDs, timestamps, state version, policy and nested summary shape', () => {
    const archive = fixture();
    const id = Object.keys(archive.entries)[0];
    expect(() => projectArchive({ ...archive, version: 2 }, policy)).toThrow('invalid_archive');
    expect(() => projectArchive(archive, { version: 1, excludedIds: ['../private'] })).toThrow('invalid_policy');
    expect(() => projectArchive({ ...archive, entries: { ['a'.repeat(64)]: first(archive) } }, policy)).toThrow('source_id_mismatch');
    first(archive).created_at = 'not-a-date';
    expect(() => projectArchive(archive, policy)).toThrow('invalid_date');
    first(archive).created_at = '2026-10-01T12:00:00Z';
    first(archive).status = 'unknown';
    expect(() => projectArchive(archive, policy)).toThrow('invalid_archive_status');
    first(archive).status = 'success';
    first(archive).summary.bullets = [];
    expect(() => projectArchive(archive, policy)).toThrow('invalid_summary');
    expect(id).toHaveLength(64);
  });

  it('retains truthful partial-summary coverage and rejects impossible coverage', () => {
    const archive = fixture();
    first(archive).coverage = { complete: false, total_chars: 60000, summarized_chars: 48000 };
    expect(projectArchive(archive, policy).entries[0].coverage).toEqual({
      complete: false, totalChars: 60000, summarizedChars: 48000,
    });
    first(archive).coverage.complete = true;
    expect(() => projectArchive(archive, policy)).toThrow('invalid_coverage');
  });

  it('has deterministic ordering and does not change when only private state changes', () => {
    const one = fixture('https://example.com/one');
    const two = fixture('https://example.com/two');
    first(two).created_at = '2026-10-02T01:00:00Z';
    const archive = { version: 1, entries: { ...one.entries, ...two.entries } };
    const output = projectArchive(archive, policy);
    expect(output.entries[0].url).toBe('https://example.com/two');
    Object.values(archive.entries).forEach(entry => { entry.attempts++; entry.updated_at = '2026-10-03T00:00:00Z'; });
    expect(projectArchive(archive, policy)).toEqual(output);
    expect(projectArchive({ ...archive, entries: { ...two.entries, ...one.entries } }, policy)).toEqual(output);
  });

  it('writes atomically, no-ops on repeat, and preserves the previous feed on invalid input', async () => {
    const prefix = resolve(tmpdir(), 'library-notes-export-');
    const directory = await mkdtemp(prefix);
    try {
      const output = join(directory, 'library-notes.json');
      expect(await writePublicFeed(fixture(), policy, output)).toEqual({ changed: true, published: 1 });
      const saved = await readFile(output, 'utf8');
      expect(await writePublicFeed(fixture(), policy, output)).toEqual({ changed: false, published: 1 });
      await expect(writePublicFeed({ version: 0 }, policy, output)).rejects.toThrow('invalid_archive');
      expect(await readFile(output, 'utf8')).toBe(saved);
      expect(await readdir(directory)).toEqual(['library-notes.json']);
      await writeFile(join(directory, 'proof.txt'), 'owned fixture');
    } finally {
      if (!resolve(directory).startsWith(prefix)) throw new Error('Unsafe test cleanup path');
      await rm(directory, { recursive: true, force: true });
    }
  });
});
