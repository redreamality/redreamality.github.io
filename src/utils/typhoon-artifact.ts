import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import typhoonSource from '../assets/html-pages/typhoon-zh.html?raw';
import { typhoonTranslations } from '../data/typhoon-translations';
import type { Language } from './i18n';
import { assertExternalResourcesAllowed } from './visual-resource-policy';

export interface TyphoonArtifactFragment {
  body: string;
  style: string;
}

function scopeArtifactStyle(source: string): string {
  const stylesheet = postcss.parse(source);
  const prefixSelectors = selectorParser((selectors) => {
    selectors.each((selector) => {
      const first = selector.nodes[0];
      const targetsRoot =
        (first?.type === 'pseudo' && first.value === ':root') ||
        (first?.type === 'tag' && (first.value === 'html' || first.value === 'body'));

      if (targetsRoot) {
        first.replaceWith(selectorParser.className({ value: 'typhoon-visual' }));
        return;
      }

      selector.prepend(selectorParser.combinator({ value: ' ' }));
      selector.prepend(selectorParser.className({ value: 'typhoon-visual' }));
    });
  });

  stylesheet.walkRules((rule) => {
    if (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
    rule.selector = prefixSelectors.processSync(rule.selector);
  });

  return `${stylesheet.toString()}\n
.dark .typhoon-visual {
  color-scheme: dark;
  --paper: #0f1720;
  --paper-raised: #17242d;
  --ink: #e8f0f3;
  --muted: #a8b8bf;
  --line: #334853;
  --ocean: #64c4dc;
  --ocean-deep: #74bfd2;
  --cyan: #67d2d8;
  --gold: #f4bd5f;
  --coral: #f2877c;
  --blue: #7da3dc;
  --indigo: #8995d1;
  --violet: #a98dcc;
  --shadow: 0 1.5rem 4rem rgba(0, 0, 0, 0.34);
}`;
}

function applyTranslations(source: string, lang: Language): string {
  if (lang === 'zh') return source;

  return Object.entries(typhoonTranslations[lang])
    .sort(([left], [right]) => right.length - left.length)
    .reduce((output, [original, translated]) => output.replaceAll(original, translated), source);
}

export function getTyphoonArtifactFragment(lang: Language, externalResources: string[]): TyphoonArtifactFragment {
  assertExternalResourcesAllowed(typhoonSource, externalResources, `typhoon (${lang})`);
  const localized = applyTranslations(typhoonSource, lang);
  const style = localized.match(/<style data-bundle="article">([\s\S]*?)<\/style>/)?.[1];
  const rawBody = localized.match(/<body>([\s\S]*?)<\/body>/)?.[1];

  if (!style || !rawBody) throw new Error(`Unable to extract the ${lang} Typhoon artifact.`);

  const body = rawBody
    .replace(/\s*<header class="site-header">[\s\S]*?<\/header>\s*/i, '\n')
    .replace('href="#article"', 'href="#typhoon-article"')
    .replace(/\s*<main id="article">\s*/i, '\n')
    .replace(/\s*<\/main>\s*(?=<script data-bundle="runtime">)/i, '\n');

  return { body, style: scopeArtifactStyle(style) };
}
