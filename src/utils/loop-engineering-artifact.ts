import loopEngineeringEn from '../assets/html-pages/loop-engineering/en/index.html?raw';
import loopEngineeringJa from '../assets/html-pages/loop-engineering/ja/index.html?raw';
import loopEngineeringZh from '../assets/html-pages/loop-engineering/zh/index.html?raw';
import type { Language } from './i18n';
import { scopeVisualStyle } from './scope-visual-style';
import { assertExternalResourcesAllowed } from './visual-resource-policy';

export interface LoopEngineeringArtifactFragment {
  body: string;
  style: string;
}

const sources: Record<Language, string> = {
  en: loopEngineeringEn,
  zh: loopEngineeringZh,
  ja: loopEngineeringJa,
};

const themeStyle = `
.loop-engineering-visual {
  color-scheme: light;
  --visual-ink: var(--ink);
  --visual-muted: var(--muted);
  --visual-line: var(--line);
  --visual-ocean: var(--ocean);
  --visual-warm: var(--warm);
  --visual-coral: var(--coral);
  --visual-paper: var(--paper);
  --visual-surface: var(--surface);
}

.dark .loop-engineering-visual {
  color-scheme: dark;
  --paper: #0b0b0e;
  --surface: #18181b;
  --ink: #f4f4f5;
  --muted: #a1a1aa;
  --line: #3f3f46;
  --ocean: #7c87fb;
  --warm: #2dd4bf;
  --coral: #f4b740;
  --visual-ink: var(--ink);
  --visual-muted: var(--muted);
  --visual-line: var(--line);
  --visual-ocean: var(--ocean);
  --visual-warm: var(--warm);
  --visual-coral: var(--coral);
  --visual-paper: var(--paper);
  --visual-surface: var(--surface);
}`;

export function getLoopEngineeringArtifactFragment(
  lang: Language,
  externalResources: string[],
): LoopEngineeringArtifactFragment {
  const source = sources[lang];
  assertExternalResourcesAllowed(source, externalResources, `loop-engineering (${lang})`);

  const style = source.match(/<style data-prototype-bundle="article">([\s\S]*?)<\/style>/)?.[1];
  const rawBody = source.match(/<body>([\s\S]*?)<\/body>/)?.[1];
  if (!style || !rawBody) throw new Error(`Unable to extract the ${lang} Loop Engineering artifact.`);

  const body = rawBody
    .replace(/\s*<a class="skip-link"[\s\S]*?<\/a>\s*/i, '\n')
    .replace(/\s*<header class="site-header">[\s\S]*?<\/header>\s*/i, '\n')
    .replace(/\s*<main id="article">\s*/i, '\n')
    .replace(/\s*<\/main>\s*(?=<script>)/i, '\n');

  return {
    body,
    style: scopeVisualStyle(style, 'loop-engineering-visual', themeStyle),
  };
}
