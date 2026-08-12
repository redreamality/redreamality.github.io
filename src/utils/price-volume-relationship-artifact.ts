import priceVolumeEn from '../assets/html-pages/price-volume-relationship/en/index.html?raw';
import priceVolumeJa from '../assets/html-pages/price-volume-relationship/ja/index.html?raw';
import priceVolumeZh from '../assets/html-pages/price-volume-relationship/zh/index.html?raw';
import type { Language } from './i18n';
import { scopeVisualStyle } from './scope-visual-style';
import { assertExternalResourcesAllowed } from './visual-resource-policy';

export interface PriceVolumeRelationshipArtifactFragment {
  body: string;
  style: string;
}

const sources: Record<Language, string> = {
  en: priceVolumeEn,
  zh: priceVolumeZh,
  ja: priceVolumeJa,
};

const themeStyle = `
.price-volume-relationship-visual {
  color-scheme: light;
  --visual-ink: var(--ink);
  --visual-muted: var(--muted);
  --visual-line: var(--line);
  --visual-ocean: #087ea4;
  --visual-warm: #d89016;
  --visual-coral: #d65f54;
  --visual-paper: var(--paper);
  --visual-surface: var(--surface);
  background: radial-gradient(circle at 20% 0, #dff3ef 0, transparent 30rem), var(--paper);
}

.price-volume-relationship-visual .plain-language strong {
  border: 1px solid color-mix(in srgb, var(--warm) 55%, var(--line));
  color: var(--ink);
  background: color-mix(in srgb, var(--warm) 18%, var(--surface));
}

.dark .price-volume-relationship-visual {
  color-scheme: dark;
  --paper: #081117;
  --surface: #101d25;
  --ink: #eef9fb;
  --muted: #a6bbc3;
  --line: #334b56;
  --ocean: #55c7e7;
  --warm: #f3b84c;
  --coral: #ff8175;
  --visual-ink: var(--ink);
  --visual-muted: var(--muted);
  --visual-line: var(--line);
  --visual-ocean: var(--ocean);
  --visual-warm: var(--warm);
  --visual-coral: var(--coral);
  --visual-paper: var(--paper);
  --visual-surface: var(--surface);
  background: radial-gradient(circle at 20% 0, #12313a 0, transparent 30rem), var(--paper);
}`;

export function getPriceVolumeRelationshipArtifactFragment(
  lang: Language,
  externalResources: string[],
): PriceVolumeRelationshipArtifactFragment {
  const source = sources[lang];
  assertExternalResourcesAllowed(source, externalResources, `price-volume-relationship (${lang})`);

  const style = source.match(/<style data-prototype-bundle="article">([\s\S]*?)<\/style>/)?.[1];
  const rawBody = source.match(/<body>([\s\S]*?)<\/body>/)?.[1];
  if (!style || !rawBody) throw new Error(`Unable to extract the ${lang} Price Volume Relationship artifact.`);

  const body = rawBody
    .replace(/\s*<a class="skip-link"[\s\S]*?<\/a>\s*/i, '\n')
    .replace(/\s*<header class="site-header">[\s\S]*?<\/header>\s*/i, '\n')
    .replace(/\s*<main id="article">\s*/i, '\n')
    .replace(/\s*<\/main>\s*(?=<script>)/i, '\n');

  return {
    body,
    style: scopeVisualStyle(style, 'price-volume-relationship-visual', themeStyle),
  };
}