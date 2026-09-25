import { describe, it, expect } from 'vitest';
import rehypeOutboundLinks from './rehype-outbound-links';

describe('rehype-outbound-links', () => {
  it('rewrites external http(s) and leaves internals alone', () => {
    const tree: any = {
      type: 'root',
      children: [
        { type: 'element', tagName: 'a', properties: { href: 'https://github.com/foo' }, children: [] },
        { type: 'element', tagName: 'a', properties: { href: '/blog/bar/' }, children: [] },
        { type: 'element', tagName: 'a', properties: { href: 'mailto:a@b.com' }, children: [] },
        { type: 'element', tagName: 'a', properties: { href: 'javascript:alert(1)' }, children: [] },
        { type: 'element', tagName: 'a', properties: { href: 'https://redreamality.com/x/' }, children: [] },
      ],
    };
    rehypeOutboundLinks()(tree);
    expect(tree.children[0].properties.href).toBe(
      `/go/?to=${encodeURIComponent('https://github.com/foo')}`,
    );
    expect(tree.children[1].properties.href).toBe('/blog/bar/');
    expect(tree.children[2].properties.href).toBe('mailto:a@b.com');
    expect(tree.children[3].properties.href).toBe('javascript:alert(1)');
    expect(tree.children[4].properties.href).toBe('https://redreamality.com/x/');
  });
});
