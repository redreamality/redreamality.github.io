import airConditionerEn from '../assets/html-pages/air-conditioner/en/index.html?raw';
import airConditionerJa from '../assets/html-pages/air-conditioner/ja/index.html?raw';
import airConditionerZh from '../assets/html-pages/air-conditioner/zh/index.html?raw';
import type { Language } from './i18n';
import { scopeVisualStyle } from './scope-visual-style';
import { assertExternalResourcesAllowed } from './visual-resource-policy';

export interface AirConditionerArtifactFragment {
  body: string;
  style: string;
}

const sources: Record<Language, string> = {
  en: airConditionerEn,
  zh: airConditionerZh,
  ja: airConditionerJa,
};

const themeStyle = `
.air-conditioner-visual {
  color-scheme: light;
  --visual-ink: var(--ink);
  --visual-muted: var(--muted);
  --visual-line: var(--line);
  --visual-ocean: #1677a6;
  --visual-warm: #ef9f3b;
  --visual-coral: #db5c4f;
  --visual-paper: var(--paper);
  --visual-surface: var(--surface);
}

.dark .air-conditioner-visual {
  color-scheme: dark;
  --paper: #0b0d10;
  --surface: #171b21;
  --ink: #f5f7fa;
  --muted: #a9b4c0;
  --line: #3b4652;
  --ocean: #61c4f2;
  --warm: #f6b95f;
  --coral: #ff7b6d;
  --visual-ink: var(--ink);
  --visual-muted: var(--muted);
  --visual-line: var(--line);
  --visual-ocean: var(--ocean);
  --visual-warm: var(--warm);
  --visual-coral: var(--coral);
  --visual-paper: var(--paper);
  --visual-surface: var(--surface);
}`;

export function getAirConditionerArtifactFragment(
  lang: Language,
  externalResources: string[],
): AirConditionerArtifactFragment {
  const source = sources[lang];
  assertExternalResourcesAllowed(source, externalResources, `air-conditioner (${lang})`);

  const style = source.match(/<style data-prototype-bundle="article">([\s\S]*?)<\/style>/)?.[1];
  const rawBody = source.match(/<body>([\s\S]*?)<\/body>/)?.[1];
  if (!style || !rawBody) throw new Error(`Unable to extract the ${lang} Air Conditioner artifact.`);

  const body = rawBody
    .replace(/\s*<a class="skip-link"[\s\S]*?<\/a>\s*/i, '\n')
    .replace(/\s*<header class="site-header">[\s\S]*?<\/header>\s*/i, '\n')
    .replace(/\s*<main id="article">\s*/i, '\n')
    .replace(/\s*<\/main>\s*(?=<script>)/i, '\n');

  return {
    body,
    style: scopeVisualStyle(style, 'air-conditioner-visual', themeStyle),
  };
}
