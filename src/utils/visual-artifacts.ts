import agentArchitectureEn from '../assets/html-pages/agent-architecture-en.html?raw';
import agentArchitectureZh from '../assets/html-pages/agent-architecture-zh.html?raw';
import agentArchitectureJa from '../assets/html-pages/agent-architecture-ja.html?raw';
import typhoonZh from '../assets/html-pages/typhoon-zh.html?raw';
import type { Language } from './i18n';
import { getVisualPath, getVisualWork, getVisualWorks, type VisualWork } from './visuals';
import { assertExternalResourcesAllowed } from './visual-resource-policy';

const artifactSources: Record<string, string> = {
  'agent-architecture-en': agentArchitectureEn,
  'agent-architecture-zh': agentArchitectureZh,
  'agent-architecture-ja': agentArchitectureJa,
  'typhoon-zh': typhoonZh,
};

const languageCodes: Record<Language, string> = {
  en: 'en',
  zh: 'zh-CN',
  ja: 'ja',
};

const languageLabels: Record<Language, string> = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
};

const chromeCopy: Record<Language, { back: string; languages: string }> = {
  en: { back: 'Back to Visuals', languages: 'Available languages' },
  zh: { back: '返回可视化专区', languages: '可用语言' },
  ja: { back: 'ビジュアル一覧へ戻る', languages: '利用可能な言語' },
};

const missingCopy: Record<Language, { title: string; body: string; continue: string }> = {
  en: {
    title: 'Translation unavailable',
    body: 'This visual is not yet available in the requested language.',
    continue: 'Return to Visuals',
  },
  zh: {
    title: '该语言版本暂不可用',
    body: '这个可视化作品尚未提供所请求的语言版本。',
    continue: '返回可视化专区',
  },
  ja: {
    title: 'この言語版はまだありません',
    body: 'このビジュアル作品は、選択した言語ではまだ利用できません。',
    continue: 'ビジュアル一覧へ戻る',
  },
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function galleryPath(lang: Language): string {
  return lang === 'zh' ? '/cn/visuals/' : lang === 'ja' ? '/ja/visuals/' : '/visuals/';
}

function availableLanguages(work: VisualWork): Language[] {
  return (['en', 'zh', 'ja'] as Language[]).filter((lang) => Boolean(work.locales[lang].artifact));
}

function siteUrl(site: string, path: string): string {
  return new URL(path, site).toString();
}

function injectArtifactChrome(html: string, work: VisualWork, lang: Language, site: string): string {
  const available = availableLanguages(work);
  const localized = work.locales[lang];
  const canonicalPath = getVisualPath(work.slug, lang);
  const canonicalUrl = siteUrl(site, canonicalPath);
  const alternates = available
    .map((candidate) => `<link rel="alternate" hreflang="${candidate}" href="${siteUrl(site, getVisualPath(work.slug, candidate))}">`)
    .join('\n');

  const headInjection = `
<meta name="description" content="${escapeHtml(localized.description)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(localized.og.title)}">
<meta property="og:description" content="${escapeHtml(localized.og.description)}">
<meta property="og:url" content="${escapeHtml(canonicalUrl)}">
<link rel="canonical" href="${escapeHtml(canonicalUrl)}">
${alternates}
<style data-visual-site-chrome>
  .visual-site-chrome{position:fixed;z-index:2147483647;left:max(12px,env(safe-area-inset-left));bottom:max(12px,env(safe-area-inset-bottom));display:flex;align-items:center;gap:8px;max-width:calc(100vw - 24px);padding:8px;border:1px solid rgba(255,255,255,.28);border-radius:999px;background:rgba(15,23,42,.88);box-shadow:0 12px 36px rgba(15,23,42,.3);backdrop-filter:blur(14px);font:600 12px/1.2 Inter,ui-sans-serif,system-ui,sans-serif;color:white}
  .visual-site-chrome a{display:inline-flex;align-items:center;min-height:32px;padding:0 11px;border-radius:999px;color:white;text-decoration:none;white-space:nowrap}
  .visual-site-chrome a:hover,.visual-site-chrome a:focus-visible{background:rgba(255,255,255,.16);outline:none}
  .visual-site-chrome a[aria-current="page"]{background:white;color:#0f172a}
  .visual-site-chrome__languages{display:flex;gap:2px;border-left:1px solid rgba(255,255,255,.2);padding-left:6px}
  @media(max-width:520px){.visual-site-chrome{right:12px;overflow-x:auto}.visual-site-chrome__back{font-size:0}.visual-site-chrome__back::before{content:"←";font-size:14px}}
</style>`;

  const languageLinks = available.map((candidate) => {
    const current = candidate === lang ? ' aria-current="page"' : '';
    return `<a href="${getVisualPath(work.slug, candidate)}" hreflang="${candidate}"${current}>${languageLabels[candidate]}</a>`;
  }).join('');

  const bodyInjection = `<aside class="visual-site-chrome" aria-label="${escapeHtml(chromeCopy[lang].languages)}">
  <a class="visual-site-chrome__back" href="${galleryPath(lang)}">← ${escapeHtml(chromeCopy[lang].back)}</a>
  <span class="visual-site-chrome__languages">${languageLinks}</span>
</aside>`;

  let output = html
    .replace(/<meta\b(?=[^>]*\bname=(["'])description\1)[^>]*>\s*/gi, '')
    .replace(/<meta\b(?=[^>]*\bproperty=(["'])og:(?:title|description|url|type)\1)[^>]*>\s*/gi, '')
    .replace(/<link\b(?=[^>]*\brel=(["'])canonical\1)[^>]*>\s*/gi, '')
    .replace(/<link\b(?=[^>]*\brel=(["'])alternate\1)(?=[^>]*\bhreflang=)[^>]*>\s*/gi, '')
    .replace(/<html([^>]*?)lang=(["'])[^"']*\2([^>]*)>/i, `<html$1lang="${languageCodes[lang]}"$3>`);
  output = output.replace('</head>', `${headInjection}\n</head>`);
  output = output.replace(/<body([^>]*)>/i, `<body$1>\n${bodyInjection}`);
  return output;
}

function renderMissingLocaleRedirect(work: VisualWork, lang: Language): string {
  const available = availableLanguages(work);
  const target = `${galleryPath(lang)}?missing=${encodeURIComponent(work.slug)}&available=${available.join(',')}#${encodeURIComponent(work.slug)}`;
  const c = missingCopy[lang];

  return `<!DOCTYPE html>
<html lang="${languageCodes[lang]}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex">
  <title>${escapeHtml(c.title)}</title>
  <script>location.replace(${JSON.stringify(target)});</script>
</head>
<body>
  <main>
    <h1>${escapeHtml(c.title)}</h1>
    <p>${escapeHtml(c.body)}</p>
    <a href="${escapeHtml(target)}">${escapeHtml(c.continue)}</a>
  </main>
</body>
</html>`;
}

export function getVisualStaticPaths() {
  return getVisualWorks().map((work) => ({ params: { slug: work.slug } }));
}

export function createVisualResponse(slug: string, lang: Language, site: string): Response {
  const work = getVisualWork(slug);
  if (!work) return new Response('Not found', { status: 404 });

  const artifactId = work.locales[lang].artifact;
  if (!artifactId) {
    return new Response(renderMissingLocaleRedirect(work, lang), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const source = artifactSources[artifactId];
  if (!source) throw new Error(`Missing visual artifact source: ${artifactId}`);
  assertExternalResourcesAllowed(source, work.externalResources, `${work.slug} (${lang})`);

  return new Response(injectArtifactChrome(source, work, lang, site), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
