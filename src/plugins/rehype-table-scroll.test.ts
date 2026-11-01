import { describe, it, expect } from 'vitest';
import rehypeTableScroll from './rehype-table-scroll';

const table = () => ({
  type: 'element',
  tagName: 'table',
  properties: {},
  children: [
    { type: 'element', tagName: 'thead', properties: {}, children: [
      { type: 'element', tagName: 'tr', properties: {}, children: [
        { type: 'element', tagName: 'th', properties: {}, children: [{ type: 'text', value: 'A' }] },
        { type: 'element', tagName: 'th', properties: {}, children: [{ type: 'text', value: 'B' }] },
      ] },
    ] },
  ],
});

describe('rehype-table-scroll', () => {
  it('wraps bare tables in a scrollable region and skips pre-wrapped ones', () => {
    const tree: any = {
      type: 'root',
      children: [
        table(),
        { type: 'element', tagName: 'div', properties: { className: ['content-table-scroll'] }, children: [table()] },
      ],
    };
    rehypeTableScroll()(tree);
    const [wrapped, manual] = tree.children;
    expect(wrapped.tagName).toBe('div');
    expect(wrapped.properties.className).toEqual(['content-table-scroll']);
    expect(wrapped.properties.ariaLabel).toBe('A / B');
    expect(wrapped.children[0].tagName).toBe('table');
    expect(manual.children[0].tagName).toBe('table');
  });
});
