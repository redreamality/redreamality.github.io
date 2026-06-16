import type { Language } from './i18n';

import architectureShowcaseEn from '../assets/html-pages/agent-architecture-en.html?raw';
import architectureShowcaseZh from '../assets/html-pages/agent-architecture-zh.html?raw';
import architectureShowcaseJa from '../assets/html-pages/agent-architecture-ja.html?raw';

export interface HtmlPageEntry {
  slug: string;
  lang: Language;
  title: string;
  description: string;
  html: string;
}

const htmlPages: HtmlPageEntry[] = [
  {
    slug: 'agent-architecture-showcase',
    lang: 'en',
    title: 'Agent Architecture Showcase',
    description: 'A standalone HTML demo page that visualizes a multi-agent content workflow with responsive cards and timeline states.',
    html: architectureShowcaseEn,
  },
  {
    slug: 'agent-architecture-showcase',
    lang: 'zh',
    title: 'Agent 架构展示页',
    description: '一个独立 HTML 演示页，用响应式卡片和流程时间线展示多智能体内容工作流。',
    html: architectureShowcaseZh,
  },
  {
    slug: 'agent-architecture-showcase',
    lang: 'ja',
    title: 'エージェント・アーキテクチャ展示ページ',
    description: 'レスポンシブカードとプロセスタイムラインで、マルチエージェントのコンテンツ制作ワークフローを可視化する独立 HTML デモページ。',
    html: architectureShowcaseJa,
  },
];

export function getHtmlPages(lang: Language): HtmlPageEntry[] {
  return htmlPages.filter((page) => page.lang === lang);
}

export function getHtmlPageBySlug(
  lang: Language,
  slug: string,
): HtmlPageEntry | undefined {
  return htmlPages.find((page) => page.lang === lang && page.slug === slug);
}
