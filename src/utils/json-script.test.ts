import { describe, expect, it } from 'vitest';
import { serializeJsonForScript } from './json-script';

describe('HTML-embedded JSON serialization', () => {
  it('preserves ordinary structured data and optional fields', () => {
    const value = { headline: '中文 <code> & details', omitted: undefined, tags: ['one', 'two'], count: 2 };
    expect(JSON.parse(serializeJsonForScript(value))).toEqual(JSON.parse(JSON.stringify(value)));
  });
  it('does not let remote text close the script element or inject HTML', () => {
    const attack = '</ScRiPt><script>window.injected=true</script><img id="injected">';
    const serialized = serializeJsonForScript({ headline: attack, description: '\u2028\u2029&<>' });
    expect(serialized).not.toMatch(/[<>&\u2028\u2029]/);
    const document = new DOMParser().parseFromString(
      `<script type="application/ld+json">${serialized}</script>`, 'text/html',
    );
    expect(document.querySelectorAll('script')).toHaveLength(1);
    expect(document.querySelector('#injected')).toBeNull();
    expect(JSON.parse(document.querySelector('script')!.textContent!).headline).toBe(attack);
  });
  it('rejects unsupported root values without emitting invalid JSON', () => {
    expect(() => serializeJsonForScript(undefined)).toThrow('Structured data must be serializable.');
  });
});
