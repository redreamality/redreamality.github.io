import feed from '../data/library-notes.json' with { type: 'json' };

export interface LibraryNote {
  id: string;
  title: string;
  url: string;
  date: string;
  language: 'zh';
  sentence: string;
  bullets: { heading: string; details: string[] }[];
  coverage: { complete: boolean; summarizedChars: number; totalChars: number };
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function publicUrl(value: unknown): value is string {
  if (!text(value)) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password
      && host.includes('.') && !/^[\d.]+$/.test(host) && !host.includes(':')
      && !/(^|\.)(localhost|local|internal|test|invalid)$/.test(host);
  } catch {
    return false;
  }
}

/** Defense in depth for the public export; never include rejected data in errors. */
export function parseLibraryNotes(value: unknown): LibraryNote[] {
  const invalid = () => { throw new Error('Invalid public library notes feed.'); };
  if (!record(value) || value.version !== 1 || !Array.isArray(value.entries)) return invalid();
  const ids = new Set<string>();
  return value.entries.map((entry: unknown): LibraryNote => {
    if (!record(entry) || !text(entry.id) || !/^[a-f0-9]{64}$/.test(entry.id)
      || ids.has(entry.id) || !text(entry.title) || !publicUrl(entry.url)
      || !text(entry.date) || !/^\d{4}-\d{2}-\d{2}(T|$)/.test(entry.date)
      || !Number.isFinite(Date.parse(entry.date)) || entry.language !== 'zh'
      || !text(entry.sentence) || !Array.isArray(entry.bullets)
      || entry.bullets.length < 3 || entry.bullets.length > 8 || !record(entry.coverage)) return invalid();
    const { complete, summarizedChars, totalChars } = entry.coverage;
    if (typeof complete !== 'boolean' || typeof summarizedChars !== 'number'
      || typeof totalChars !== 'number' || !Number.isSafeInteger(summarizedChars)
      || !Number.isSafeInteger(totalChars) || summarizedChars <= 0 || totalChars <= 0
      || totalChars < summarizedChars || complete !== (summarizedChars === totalChars)) return invalid();
    const bullets = entry.bullets.map((bullet: unknown) => {
      if (!record(bullet) || !text(bullet.heading) || !Array.isArray(bullet.details)
        || bullet.details.length < 1 || bullet.details.length > 4 || !bullet.details.every(text)) return invalid();
      return { heading: bullet.heading, details: bullet.details as string[] };
    });
    ids.add(entry.id);
    // Explicit projection keeps future exporter metadata out of rendered pages.
    return {
      id: entry.id, title: entry.title, url: entry.url, date: entry.date,
      language: 'zh', sentence: entry.sentence, bullets,
      coverage: { complete, summarizedChars, totalChars },
    };
  });
}

const notes = parseLibraryNotes(feed);
export function getLibraryNotes(): LibraryNote[] {
  return [...notes].sort((a, b) => Date.parse(b.date) - Date.parse(a.date) || a.id.localeCompare(b.id));
}
