import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { getLegacyBlogRedirectPaths } from '../../scripts/legacy-blog-redirects.mjs';

describe('legacy Chaos blog redirects', () => {
  it('derives each locale from its actual collection instead of a copied slug list', () => {
    const paths = getLegacyBlogRedirectPaths(resolve('src/content'));
    for (const prefix of ['', '/cn', '/ja']) {
      expect(paths.has(`${prefix}/blog/aws-ai-registry-for-agents-spec/`)).toBe(true);
      expect(paths.has(`${prefix}/garden/chaos/aws-ai-registry-for-agents-spec/`)).toBe(false);
      expect(paths.has(`${prefix}/blog/browser-extension-development/`)).toBe(false);
    }
    expect(paths.size).toBeGreaterThan(0);
  });
});
