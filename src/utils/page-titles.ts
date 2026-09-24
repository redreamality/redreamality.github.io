import type { Language } from './i18n';

// Only listing pages receive editorial SEO titles; content titles remain explicit.
const titles: Record<string, Record<Language, string>> = {
  '/': {
    en: 'Redreamality | AI Agents, Software Engineering & Open Source',
    zh: 'Redreamality | AI Agent、软件工程与开源实践',
    ja: 'Redreamality | AIエージェント・ソフトウェア開発・オープンソース',
  },
  '/blog': {
    en: 'AI Agents & Software Development Blog | Redreamality',
    zh: 'AI Agent 与软件开发技术博客 | Redreamality',
    ja: 'AIエージェントとソフトウェア開発ブログ | Redreamality',
  },
  '/projects': {
    en: 'Open-Source Projects & Developer Tools | Redreamality',
    zh: '开源项目与开发者工具 | Redreamality',
    ja: 'オープンソースプロジェクトと開発ツール | Redreamality',
  },
  '/visuals': {
    en: 'Interactive Explanations & Simulations | Redreamality',
    zh: '交互式原理图解与模拟器 | Redreamality',
    ja: 'インタラクティブな図解とシミュレーション | Redreamality',
  },
  '/garden': {
    en: 'Digital Garden: Notes, Questions & Talks | Redreamality',
    zh: '数字花园：阅读笔记、问题与演讲 | Redreamality',
    ja: 'デジタルガーデン：読書ノート・問い・講演 | Redreamality',
  },
  '/garden/chaos': {
    en: 'AI & Technology News Digest | Redreamality',
    zh: '底噪：AI 与技术热点追踪 | Redreamality',
    ja: 'AI・技術ニュースダイジェスト | Redreamality',
  },
  '/garden/notes': {
    en: 'Reading Notes & Book Insights | Redreamality',
    zh: '阅读笔记与读书心得 | Redreamality',
    ja: '読書ノートと本からの学び | Redreamality',
  },
  '/garden/questions': {
    en: 'Questions on AI, Trading & Finance | Redreamality',
    zh: 'AI、交易与金融问题解答 | Redreamality',
    ja: 'AI・トレード・金融の疑問と解説 | Redreamality',
  },
  '/garden/talks': {
    en: 'Technical Talks & Presentations | Redreamality',
    zh: '技术演讲与分享资料 | Redreamality',
    ja: '技術講演とプレゼンテーション資料 | Redreamality',
  },
  '/garden/meditations': {
    en: 'Reflections on AI, Engineering & Life | Redreamality',
    zh: '沉思录：AI、工程与生活思考 | Redreamality',
    ja: '瞑想録：AI・エンジニアリング・暮らしの考察 | Redreamality',
  },
  '/tags': {
    en: 'Browse Technical Articles by Topic | Redreamality',
    zh: '按主题浏览技术文章 | Redreamality',
    ja: 'テーマ別に技術記事を探す | Redreamality',
  },
  '/about': {
    en: 'About Remy (Redreamality) | Software & AI',
    zh: '关于 Remy（Redreamality）| 软件开发与 AI',
    ja: 'Remy（Redreamality）について | ソフトウェア開発とAI',
  },
};

export function getPageTitle(pathname: string, lang: Language, fallback: string): string {
  const path = pathname.replace(/^\/(?:cn|ja)(?=\/|$)/, '').replace(/\/+$/, '') || '/';
  return Object.hasOwn(titles, path) ? titles[path][lang] : fallback;
}
