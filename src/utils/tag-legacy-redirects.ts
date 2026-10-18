import { normalizeTag } from './tag-taxonomy';

/**
 * Raw frontmatter tags that used to be emitted verbatim as tag routes
 * (e.g. "/tags/System One/") but now normalize to a different slug
 * ("/tags/system-one/"). Returns [legacyRoute, canonicalSlug] pairs whose
 * canonical slug has a real page, so the old URL can serve a redirect stub.
 */
export function getLegacyTagRedirects(
  rawTags: readonly string[],
  routeTags: readonly string[],
): Array<{ legacy: string; canonical: string }> {
  const live = new Set(routeTags);
  const seen = new Set<string>();
  const out: Array<{ legacy: string; canonical: string }> = [];
  for (const rawTag of rawTags) {
    const legacy = rawTag.trim();
    if (!/\s/.test(legacy) || seen.has(legacy)) continue;
    const canonical = normalizeTag(legacy);
    if (canonical === legacy || !live.has(canonical) || live.has(legacy)) continue;
    seen.add(legacy);
    out.push({ legacy, canonical });
  }
  return out;
}
