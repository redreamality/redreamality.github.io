import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const script = resolve('scripts/check-locale-links.mjs');
let fixture;

beforeEach(() => {
  fixture = mkdtempSync(join(tmpdir(), 'check-locale-links-'));
});

afterEach(() => {
  rmSync(fixture, { recursive: true, force: true });
});

describe('locale links CLI', () => {
  it('prints scan results and exits successfully for live locale links', () => {
    writeFileSync(join(fixture, 'index.html'), `
      <link rel="alternate" hreflang="en" href="https://redreamality.com/">
      <div class="language-toggle"><a role="menuitem" href="/">English</a></div>
    `);

    const result = spawnSync(process.execPath, [script, fixture], { encoding: 'utf8' });

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('pages scanned:          1');
    expect(result.stdout).toContain('switch links:           1 (dead: 0)');
    expect(result.stdout).toContain('hreflang alternates:    1 (dead: 0, dead x-default: 0)');
    expect(result.stdout).toContain('pages with dead links:  0');
  });

  it('reports dead locale targets and exits with code 1', () => {
    writeFileSync(join(fixture, 'index.html'), `
      <link rel="alternate" hreflang="ja" href="https://redreamality.com/ja/">
      <div class="language-toggle"><a role="menuitem" href="/ja/">Japanese</a></div>
    `);

    const result = spawnSync(process.execPath, [script, fixture, '--json'], { encoding: 'utf8' });

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stderr).toBe('');
    expect(JSON.parse(result.stdout)).toEqual({
      pages: 1,
      switchLinks: 1,
      deadSwitchLinks: 1,
      hreflangLinks: 1,
      deadHreflang: 1,
      deadXDefault: 0,
      pagesWithDeadLinks: 1,
      examples: [
        { page: '/', kind: 'switch', href: '/ja/' },
        { page: '/', kind: 'hreflang:ja', href: 'https://redreamality.com/ja/' },
      ],
    });
  });
});
