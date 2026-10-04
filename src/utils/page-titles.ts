import type { Language } from './i18n';

// Only listing pages receive editorial SEO titles; content titles remain explicit.
// Target ~50–60 characters for Bing/Google; always ≤70; always include Redreamality.
const titles: Record<string, Record<Language, string>> = {
  '/': {
    en: 'Redreamality | AI Agents, Software Engineering & Open Source',
    zh: 'Redreamality | 个人博客：AI Agent、软件工程与开源实践分享',
    ja: 'Redreamality｜AIエージェント・ソフトウェア開発・オープンソースのブログ',
  },
  '/blog': {
    en: 'AI Agents & Software Development Blog | Redreamality',
    zh: 'AI Agent 与软件开发技术博客：深度教程与工程实践 | Redreamality',
    ja: 'AIエージェントとソフトウェア開発の技術ブログと実践 | Redreamality',
  },
  '/projects': {
    en: 'Open-Source Projects & Developer Tools | Redreamality',
    zh: '开源项目与开发者工具：研究课题与作品展示 | Redreamality',
    ja: 'オープンソースのプロジェクトと開発者向けツール集 | Redreamality',
  },
  '/visuals': {
    en: 'Interactive Explanations & Simulations | Redreamality',
    zh: '交互式原理图解与模拟器：动手理解关键概念 | Redreamality',
    ja: 'インタラクティブ図解とシミュレーションで学ぶ | Redreamality',
  },
  '/garden': {
    en: 'Digital Garden: Notes, Questions & Talks | Redreamality',
    zh: '数字花园首页：阅读笔记、问题、演讲与沉思录 | Redreamality',
    ja: 'デジタルガーデン：ノート・問い・講演・瞑想録 | Redreamality',
  },
  '/garden/chaos': {
    en: 'AI & Technology News Digest and Analysis | Redreamality',
    zh: '底噪栏目：AI 与技术热点追踪、摘要与解读 | Redreamality',
    ja: 'カオス：AI・技術ニュースのダイジェストと解説 | Redreamality',
  },
  '/garden/notes': {
    en: 'Reading Notes, Book Insights & Takeaways | Redreamality',
    zh: '阅读笔记栏目：读书心得、方法工具与洞见 | Redreamality',
    ja: '読書ノート：本からの学び・方法・洞察のまとめ | Redreamality',
  },
  '/garden/questions': {
    en: 'Questions on AI, Trading & Finance | Redreamality',
    zh: '问答栏目：AI、交易与金融问题的简明框架 | Redreamality',
    ja: 'Q&A：AI・トレード・金融の疑問と解説ノート | Redreamality',
  },
  '/garden/talks': {
    en: 'Technical Talks & Presentations | Redreamality',
    zh: '演讲栏目：技术分享幻灯片、讲稿与资料 | Redreamality',
    ja: '講演資料：技術プレゼンのスライドと配布物 | Redreamality',
  },
  '/garden/meditations': {
    en: 'Reflections on AI, Engineering & Life | Redreamality',
    zh: '沉思录栏目：AI、工程实践与生活的随笔 | Redreamality',
    ja: '瞑想録：AI・エンジニアリング・暮らしの考察 | Redreamality',
  },
  '/tags': {
    en: 'Browse Technical Articles by Topic | Redreamality',
    zh: '标签知识地图：按主题浏览全部技术文章 | Redreamality',
    ja: 'タグ一覧：テーマ別に技術記事を探すページ | Redreamality',
  },
  '/about': {
    en: 'About Remy (Redreamality) | Software & AI Engineering',
    zh: '关于 Remy（Redreamality）：软件开发与 AI 研究者',
    ja: 'Remy（Redreamality）について｜ソフトウェアとAI',
  },
  '/privacy': {
    en: 'Privacy: Analytics, Cookies, and Ads | Redreamality',
    zh: '隐私说明：本站统计、Cookie 与广告的实际情况 | Redreamality',
    ja: 'プライバシー：分析・Cookie・広告の扱い | Redreamality',
  },
};

export function getPageTitle(pathname: string, lang: Language, fallback: string): string {
  const path = pathname.replace(/^\/(?:cn|ja)(?=\/|$)/, '').replace(/\/+$/, '') || '/';
  return Object.hasOwn(titles, path) ? titles[path][lang] : fallback;
}
