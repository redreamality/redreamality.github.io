import { describe, expect, it } from 'vitest';
import { assertExternalResourcesAllowed, findExternalResources } from './visual-resource-policy';

describe('visual artifact external resource policy', () => {
  it('detects quoted, unquoted, srcset, object, embed, CSS import, and dynamic URLs', () => {
    const html = `
      <script src=https://cdn.example.com/app.js></script>
      <img srcset="https://img.example.com/a.webp 1x, https://img.example.com/b.webp 2x">
      <object data='https://media.example.com/chart.svg'></object>
      <embed src="//192.0.2.1/model.bin">
      <style>@import url(//[2001:db8::1]/theme.css);</style>
      <script src=//intranet/app.js></script>
      <script>fetch("https://api.example.com/data.json")</script>
    `;

    expect(findExternalResources(html)).toEqual([
      'https://cdn.example.com/app.js',
      'https://img.example.com/a.webp',
      'https://img.example.com/b.webp',
      'https://media.example.com/chart.svg',
      'https://api.example.com/data.json',
      '//192.0.2.1/model.bin',
      '//[2001:db8::1]/theme.css',
      '//intranet/app.js',
    ]);
  });

  it('rejects resources outside the allowlist', () => {
    expect(() => assertExternalResourcesAllowed(
      '<img src="https://img.example.com/cover.webp">',
      [],
      'example (en)',
    )).toThrow('outside its allowlist');
  });

  it('accepts an exact explicit allowlist entry', () => {
    expect(() => assertExternalResourcesAllowed(
      '<img src="https://img.example.com/cover.webp">',
      ['https://img.example.com/cover.webp'],
      'example (en)',
    )).not.toThrow();
  });
});
