import type { Language } from './i18n';

import architectureShowcaseEn from '../assets/html-pages/agent-architecture-en.html?raw';
import architectureShowcaseZh from '../assets/html-pages/agent-architecture-zh.html?raw';

export interface HtmlPageEntry {
  slug: string;
  lang: Extract<Language, 'en' | 'zh'>;
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
];

export function getHtmlPages(lang: Extract<Language, 'en' | 'zh'>): HtmlPageEntry[] {
  return htmlPages.filter((page) => page.lang === lang);
}

export function getHtmlPageBySlug(
  lang: Extract<Language, 'en' | 'zh'>,
  slug: string,
): HtmlPageEntry | undefined {
  return htmlPages.find((page) => page.lang === lang && page.slug === slug);
}
