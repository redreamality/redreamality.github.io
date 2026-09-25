import { describe, it, expect } from 'vitest';
import {
  isInternalHref,
  sanitizeOutboundUrl,
  toOutboundHref,
} from './outbound';

describe('outbound utils', () => {
  describe('isInternalHref', () => {
    it('treats relative, hash, and mailto/tel as internal', () => {
      expect(isInternalHref('/blog/foo/')).toBe(true);
      expect(isInternalHref('../notes/')).toBe(true);
      expect(isInternalHref('#section')).toBe(true);
      expect(isInternalHref('#')).toBe(true);
      expect(isInternalHref('mailto:a@b.com')).toBe(true);
      expect(isInternalHref('tel:+1234567890')).toBe(true);
    });

    it('treats same-site absolute URLs as internal', () => {
      expect(isInternalHref('https://redreamality.com/blog/')).toBe(true);
      expect(isInternalHref('https://www.redreamality.com/about/')).toBe(true);
      expect(isInternalHref('https://redreamality.github.io/cn/')).toBe(true);
      expect(isInternalHref('http://localhost:4321/')).toBe(true);
      expect(isInternalHref('http://127.0.0.1:4321/blog/')).toBe(true);
    });

    it('treats external http(s) as not internal', () => {
      expect(isInternalHref('https://github.com/redreamality')).toBe(false);
      expect(isInternalHref('http://example.com')).toBe(false);
    });
  });

  describe('sanitizeOutboundUrl', () => {
    it('allows external http(s) and returns normalized URL', () => {
      expect(sanitizeOutboundUrl('https://github.com/foo')).toBe('https://github.com/foo');
      expect(sanitizeOutboundUrl('http://example.com/a?b=1')).toBe('http://example.com/a?b=1');
    });

    it('rejects javascript/data/vbscript and protocol-relative', () => {
      expect(sanitizeOutboundUrl('javascript:alert(1)')).toBeNull();
      expect(sanitizeOutboundUrl('data:text/html,hi')).toBeNull();
      expect(sanitizeOutboundUrl('vbscript:msgbox(1)')).toBeNull();
      expect(sanitizeOutboundUrl('//evil.example/path')).toBeNull();
    });

    it('returns null for internal hosts', () => {
      expect(sanitizeOutboundUrl('https://redreamality.com/blog/')).toBeNull();
      expect(sanitizeOutboundUrl('https://redreamality.github.io/')).toBeNull();
    });

    it('returns null for missing/invalid', () => {
      expect(sanitizeOutboundUrl('')).toBeNull();
      expect(sanitizeOutboundUrl(null)).toBeNull();
      expect(sanitizeOutboundUrl('not a url')).toBeNull();
    });
  });

  describe('toOutboundHref', () => {
    it('rewrites external URLs through locale /go/', () => {
      const href = 'https://github.com/redreamality/repo';
      expect(toOutboundHref(href, 'en')).toBe(
        `/go/?to=${encodeURIComponent(href)}`,
      );
      expect(toOutboundHref(href, 'zh')).toBe(
        `/cn/go/?to=${encodeURIComponent(href)}`,
      );
      expect(toOutboundHref(href, 'ja')).toBe(
        `/ja/go/?to=${encodeURIComponent(href)}`,
      );
    });

    it('skips internal, mailto/tel, and same-site absolute', () => {
      expect(toOutboundHref('/blog/hello/', 'en')).toBe('/blog/hello/');
      expect(toOutboundHref('https://redreamality.com/blog/', 'zh')).toBe(
        'https://redreamality.com/blog/',
      );
      expect(toOutboundHref('mailto:x@y.z', 'en')).toBe('mailto:x@y.z');
      expect(toOutboundHref('tel:123', 'ja')).toBe('tel:123');
      expect(toOutboundHref('#toc', 'en')).toBe('#toc');
    });

    it('does not rewrite rejected schemes', () => {
      expect(toOutboundHref('javascript:alert(1)', 'en')).toBe('javascript:alert(1)');
      expect(toOutboundHref('//evil.example', 'en')).toBe('//evil.example');
    });

    it('round-trips encoding through the confirm query param', () => {
      const original = 'https://example.com/path?q=a b&x=1#frag';
      const rewritten = toOutboundHref(original, 'en');
      expect(rewritten.startsWith('/go/?to=')).toBe(true);
      const encoded = rewritten.slice('/go/?to='.length);
      const decoded = decodeURIComponent(encoded);
      expect(sanitizeOutboundUrl(decoded)).toBe(new URL(original).toString());
    });
  });
});
