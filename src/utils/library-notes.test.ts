// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { getLibraryNotes, parseLibraryNotes, type LibraryNote } from './library-notes';

const error = 'Invalid public library notes feed.';
function note(): LibraryNote {
  return {
    id: 'a'.repeat(64), title: 'Public article', url: 'https://example.com/article',
    date: '2026-10-01T12:00:00Z', language: 'zh', sentence: 'A public summary.',
    bullets: [1, 2, 3].map((index) => ({ heading: `Point ${index}`, details: [`Detail ${index}`] })),
    coverage: { complete: true, summarizedChars: 100, totalChars: 100 },
  };
}
const feed = (entries: unknown[] = [note()]) => ({ version: 1, entries });

describe('public library notes validation', () => {
  it('accepts the public contract, an empty feed and the live export', () => {
    expect(parseLibraryNotes(feed())).toEqual([note()]);
    expect(parseLibraryNotes(feed([]))).toEqual([]);
    const live = getLibraryNotes();
    expect(parseLibraryNotes(feed(live))).toEqual(live);
    const dates = live.map((entry) => Date.parse(entry.date));
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });

  it.each([null, [], {}, { version: 2, entries: [] }, { version: 1, entries: {} }])(
    'fails closed on a malformed envelope: %j', (value) => {
      expect(() => parseLibraryNotes(value)).toThrow(error);
    },
  );

  it.each([
    null, {}, { ...note(), id: '../private' }, { ...note(), title: ' ' },
    { ...note(), sentence: '' }, { ...note(), language: 'en' },
    { ...note(), date: 'not-a-date' }, { ...note(), bullets: null },
    { ...note(), coverage: null },
  ])('fails closed on a malformed entry: %j', (entry) => {
    expect(() => parseLibraryNotes(feed([entry]))).toThrow(error);
  });

  it.each([
    'javascript:alert(1)', 'file:///private', 'http://localhost/a', 'http://127.0.0.1/a',
    'https://service.internal/a', 'https://user:password@example.com/a', 'https://[::1]/a',
  ])('rejects unsafe URLs: %s', (url) => {
    expect(() => parseLibraryNotes(feed([{ ...note(), url }]))).toThrow(error);
  });

  it('rejects duplicate full IDs without disclosing input', () => {
    const entry = { ...note(), title: 'PRIVATE_SENTINEL' };
    expect(() => parseLibraryNotes(feed([entry, entry]))).toThrow(new Error(error));
  });

  it('projects only public fields at every object level without mutating input', () => {
    const sentinel = 'PRIVATE_RAW_ERROR_PATH_TOKEN_SENTINEL';
    const clean = note();
    const input = {
      ...feed(), raw: sentinel, errors: [sentinel],
      entries: [{
        ...clean, privatePath: sentinel, credentials: { token: sentinel },
        bullets: clean.bullets.map((bullet) => ({ ...bullet, raw: sentinel })),
        coverage: { ...clean.coverage, error: sentinel },
      }],
    };
    const before = structuredClone(input);
    const result = parseLibraryNotes(input);
    expect(result).toEqual([clean]);
    expect(JSON.stringify(result)).not.toContain(sentinel);
    expect(input).toEqual(before);
  });

  it('preserves text literally for escaped rendering by Astro', () => {
    const entry = { ...note(), sentence: '<script>alert("example")</script>' };
    expect(parseLibraryNotes(feed([entry]))[0].sentence).toBe(entry.sentence);
  });

  it('retains accurate partial coverage', () => {
    const entry = { ...note(), coverage: { complete: false, summarizedChars: 48, totalChars: 60 } };
    expect(parseLibraryNotes(feed([entry]))[0].coverage).toEqual(entry.coverage);
  });

  it.each([
    { complete: true, summarizedChars: 0, totalChars: 0 },
    { complete: false, summarizedChars: 0, totalChars: 100 },
    { complete: false, summarizedChars: -1, totalChars: 100 },
    { complete: true, summarizedChars: 100, totalChars: 0 },
    { complete: true, summarizedChars: 99, totalChars: 100 },
    { complete: false, summarizedChars: 100, totalChars: 100 },
    { complete: false, summarizedChars: 101, totalChars: 100 },
    { complete: false, summarizedChars: 1.5, totalChars: 100 },
    { complete: false, summarizedChars: 1, totalChars: Infinity },
    { complete: false, summarizedChars: 1, totalChars: Number.MAX_SAFE_INTEGER + 1 },
    { complete: 'true', summarizedChars: 100, totalChars: 100 },
  ])('rejects impossible or inconsistent coverage: %j', (coverage) => {
    expect(() => parseLibraryNotes(feed([{ ...note(), coverage }]))).toThrow(error);
  });

  it.each([0, 1, 2, 9])('rejects %i summary bullets', (count) => {
    const bullets = Array.from({ length: count }, () => note().bullets[0]);
    expect(() => parseLibraryNotes(feed([{ ...note(), bullets }]))).toThrow(error);
  });

  it.each([3, 8])('accepts the %i-bullet boundary with one or four details', (count) => {
    const bullets = Array.from({ length: count }, (_, index) => ({
      heading: `Point ${index}`, details: Array.from({ length: index % 2 ? 1 : 4 }, () => 'Detail'),
    }));
    expect(parseLibraryNotes(feed([{ ...note(), bullets }]))[0].bullets).toEqual(bullets);
  });

  it.each([[], [''], ['   '], [null], ['1', '2', '3', '4', '5']].map((details) => ({ details })))(
    'rejects empty, malformed or excessive details: $details', ({ details }) => {
      const bullets = note().bullets.map((bullet, index) => index ? bullet : { ...bullet, details });
      expect(() => parseLibraryNotes(feed([{ ...note(), bullets }]))).toThrow(error);
    },
  );

  it('rejects blank bullet headings', () => {
    const entry = note();
    entry.bullets[0].heading = ' ';
    expect(() => parseLibraryNotes(feed([entry]))).toThrow(error);
  });
});
