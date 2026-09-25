/**
 * Rehype plugin: rewrite external http(s) <a href> to `/go/?to=ENCODED`.
 *
 * Always uses the EN path form. On CN/JA pages, Layout.astro runs a tiny
 * client script that prefixes `/cn` or `/ja` onto `/go/?to=` links so the
 * static confirm pages stay locale-correct without per-build rehype options.
 */
import { toOutboundHref } from '../utils/outbound';

type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

function walk(node: HastNode, visit: (n: HastNode) => void): void {
  visit(node);
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      walk(child, visit);
    }
  }
}

export default function rehypeOutboundLinks() {
  return (tree: HastNode) => {
    walk(tree, (node) => {
      if (node.type !== 'element' || node.tagName !== 'a') return;
      const props = node.properties;
      if (!props) return;

      const href = props.href;
      if (typeof href !== 'string' || !href) return;

      const next = toOutboundHref(href, 'en');
      if (next !== href) {
        props.href = next;
        // Interstitial opens in the same tab; keep noopener if already present.
        const rel = props.rel;
        if (typeof rel === 'string' && !/\bnofollow\b/i.test(rel)) {
          props.rel = `${rel} nofollow`.trim();
        } else if (Array.isArray(rel) && !rel.some((r) => String(r).toLowerCase() === 'nofollow')) {
          props.rel = [...rel, 'nofollow'];
        } else if (rel == null) {
          props.rel = ['noopener', 'noreferrer', 'nofollow'];
        }
      }
    });
  };
}
