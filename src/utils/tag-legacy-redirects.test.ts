import { describe, expect, it } from 'vitest';
import { vi } from 'vitest';
vi.mock('./i18n', () => ({ getLocalizedPath: (p: string, l: string) => (l === 'zh' ? '/cn' : l === 'ja' ? '/ja' : '') + p }));
import { normalizeTag } from './tag-taxonomy';
import { getLegacyTagRedirects } from './tag-legacy-redirects';

describe('tag slugs with spaces', () => {
  it('never keeps whitespace in a normalized tag', () => {
    expect(normalizeTag('System One')).toBe('system-one');
    expect(normalizeTag('  Foo  Bar ')).toBe('foo-bar');
    expect(normalizeTag('jev')).toBe('jev');
  });

  it('emits redirects only for spaced tags whose canonical page exists', () => {
    expect(
      getLegacyTagRedirects(['System One', 'System One', 'jev', 'Lonely Tag'], ['system-one', 'jev']),
    ).toEqual([{ legacy: 'System One', canonical: 'system-one' }]);
  });
});
