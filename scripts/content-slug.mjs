import { slug as githubSlug } from 'github-slugger';

// Mirrors Astro's glob-loader ID policy; explicit frontmatter slugs take priority.
export function contentSlug(entry, data = {}) {
  if (data.slug) return String(data.slug);
  return entry.replaceAll('\\', '/').replace(/\.mdx?$/, '')
    .split('/').map(segment => githubSlug(segment)).join('/').replace(/\/index$/, '');
}
