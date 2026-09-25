/**
 * Outbound-link helpers for the /go/ confirm interstitial.
 *
 * Markdown rehype rewrites external http(s) links to `/go/?to=...` (EN path).
 * Layout runs a tiny client script that prefixes `/cn` or `/ja` when the page
 * path is under those locales. Astro components that know `lang` should call
 * `toOutboundHref(href, lang)` directly.
 */

export const INTERNAL_HOSTS = new Set([
  'redreamality.com',
  'www.redreamality.com',
  'redreamality.github.io',
  'localhost',
  '127.0.0.1',
]);

export type OutboundLang = 'en' | 'zh' | 'ja';

const SAFE_PROTOCOLS = new Set(['http:', 'https:']);
const SKIP_SCHEMES = /^(mailto:|tel:)/i;

function normalizeHost(hostname: string): string {
  return hostname.replace(/\.$/, '').toLowerCase();
}

/**
 * Relative paths, hash links, same-host absolute URLs, mailto/tel → internal
 * (do not rewrite). mailto/tel are left unchanged by callers.
 */
export function isInternalHref(href: string): boolean {
  if (href == null) return true;
  const raw = String(href).trim();
  if (!raw || raw === '#') return true;
  if (raw.startsWith('#')) return true;
  if (SKIP_SCHEMES.test(raw)) return true;
  // Protocol-relative or absolute without a safe scheme handled elsewhere
  if (raw.startsWith('//')) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) {
    try {
      const url = new URL(raw);
      if (!SAFE_PROTOCOLS.has(url.protocol)) return false;
      return INTERNAL_HOSTS.has(normalizeHost(url.hostname));
    } catch {
      return false;
    }
  }
  // Relative path (/, ./, ../, bare path)
  return true;
}

/**
 * Only allow http/https after `new URL()`. Rejects javascript/data/vbscript
 * and protocol-relative URLs without a scheme. Returns null when invalid or
 * when the host is internal.
 */
export function sanitizeOutboundUrl(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;

  // Reject scheme-less protocol-relative and dangerous schemes early
  if (trimmed.startsWith('//')) return null;
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('blob:')
  ) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (!SAFE_PROTOCOLS.has(url.protocol)) return null;
  if (INTERNAL_HOSTS.has(normalizeHost(url.hostname))) return null;

  return url.toString();
}

function goPrefix(lang: OutboundLang): string {
  if (lang === 'zh') return '/cn/go/';
  if (lang === 'ja') return '/ja/go/';
  return '/go/';
}

/**
 * Rewrite external http(s) hrefs to the locale confirm page.
 * Returns the original href when internal or invalid (including mailto/tel).
 */
export function toOutboundHref(href: string, lang: OutboundLang = 'en'): string {
  if (href == null) return href;
  const raw = String(href).trim();
  if (!raw) return href;

  if (SKIP_SCHEMES.test(raw)) return href;
  if (isInternalHref(raw)) return href;

  const safe = sanitizeOutboundUrl(raw);
  if (!safe) return href;

  return `${goPrefix(lang)}?to=${encodeURIComponent(safe)}`;
}
