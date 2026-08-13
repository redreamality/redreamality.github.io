import type { Language } from './i18n';
import type { VisualType } from './visuals';

export interface HomeStrings {
  kicker: string;
  title: string;
  subtitle: string;
  // hero entry cards
  projectsTitle: string;
  projectsDesc: string;
  visualsTitle: string;
  visualsDesc: string;
  blogTitle: string;
  blogDesc: string;
  meditationsTitle: string;
  meditationsDesc: string;
  talksTitle: string;
  talksDesc: string;
  visualsSectionTitle: string;
  visualTypeLabels: Record<VisualType, string>;
  openVisual: string;
  viewAllVisuals: string;
  // section headers
  recentBlogTitle: string;
  recentMeditationsTitle: string;
  recentTalksTitle: string;
  recentQuestionsTitle: string;
  recentChaosTitle: string;
  recentNotesTitle: string;
  // empty states
  noMeditationsMessage: string;
  noQuestionsMessage: string;
  noChaosMessage: string;
  noNotesMessage: string;
  // shared
  viewAll: string;
}

export const homeContent: Record<Language, HomeStrings> = {
  en: {
    kicker: 'AI Engineer · Independent Thinker',
    title: "Remy (Redreamality)",
    subtitle: 'Building with AI agents, and thinking out loud — projects, writing, talks, and reflections in one place.',
    projectsTitle: 'Projects',
    projectsDesc: 'Open-source work, tools, and research papers',
    visualsTitle: 'Visuals',
    visualsDesc: 'Interactive explanations and visual stories',
    blogTitle: 'Blog',
    blogDesc: 'Technical articles, tutorials, and analysis',
    meditationsTitle: 'Meditations',
    meditationsDesc: 'Personal reflections on engineering and time',
    talksTitle: 'Talks',
    talksDesc: 'Presentations and slides',
    visualsSectionTitle: 'Visuals',
    visualTypeLabels: {
      'interactive-explainer': 'Interactive explainer',
      'visual-story': 'Visual story',
    },
    openVisual: 'Explore the visual',
    viewAllVisuals: 'View all visuals',
    recentBlogTitle: 'Recent Blog Posts',
    recentMeditationsTitle: 'From the Meditations',
    recentTalksTitle: 'Recent Talks',
    recentQuestionsTitle: 'Recent Questions',
    recentChaosTitle: 'Chaos (Signals)',
    recentNotesTitle: 'Reading Notes',
    noMeditationsMessage: 'No reflections yet.',
    noQuestionsMessage: 'No questions yet.',
    noChaosMessage: 'No signals yet.',
    noNotesMessage: 'No notes yet.',
    viewAll: 'View all',
  },
  zh: {
    kicker: 'AI 工程师 · 独立思考者',
    title: 'Remy（Redreamality）',
    subtitle: '用 AI 智能体构建，也把思考写下来——项目、文章、演讲与感悟，都在这里。',
    projectsTitle: '项目',
    projectsDesc: '开源作品、工具与研究论文',
    visualsTitle: '可视化',
    visualsDesc: '交互图解与视觉故事',
    blogTitle: '博客',
    blogDesc: '技术文章、教程与分析',
    meditationsTitle: '沉思录',
    meditationsDesc: '关于工程与时间的个人感悟',
    talksTitle: '演讲',
    talksDesc: '演讲与幻灯片',
    visualsSectionTitle: '可视化',
    visualTypeLabels: {
      'interactive-explainer': '交互图解',
      'visual-story': '视觉故事',
    },
    openVisual: '打开可视化',
    viewAllVisuals: '查看全部可视化',
    recentBlogTitle: '最新博客',
    recentMeditationsTitle: '沉思录摘选',
    recentTalksTitle: '最新演讲',
    recentQuestionsTitle: '最新思考问题',
    recentChaosTitle: '底噪（信号）',
    recentNotesTitle: '阅读笔记',
    noMeditationsMessage: '暂无感悟。',
    noQuestionsMessage: '暂无思考问题。',
    noChaosMessage: '暂无信号。',
    noNotesMessage: '暂无阅读笔记。',
    viewAll: '查看全部',
  },
  ja: {
    kicker: 'AIエンジニア · 思索者',
    title: 'Remy（Redreamality）',
    subtitle: 'AIエージェントでつくり、考えを書き留める——プロジェクト、記事、講演、そして思索を一か所に。',
    projectsTitle: 'プロジェクト',
    projectsDesc: 'オープンソース作品・ツール・研究論文',
    visualsTitle: 'ビジュアル',
    visualsDesc: 'インタラクティブな解説と視覚ストーリー',
    blogTitle: 'ブログ',
    blogDesc: '技術記事・チュートリアル・分析',
    meditationsTitle: '瞑想録',
    meditationsDesc: '工学と時間についての個人的な思索',
    talksTitle: '講演',
    talksDesc: 'プレゼンテーションとスライド',
    visualsSectionTitle: 'ビジュアル',
    visualTypeLabels: {
      'interactive-explainer': 'インタラクティブ解説',
      'visual-story': 'ビジュアルストーリー',
    },
    openVisual: 'ビジュアルを開く',
    viewAllVisuals: 'すべてのビジュアルを見る',
    recentBlogTitle: '最新ブログ',
    recentMeditationsTitle: '瞑想録より',
    recentTalksTitle: '最新の講演',
    recentQuestionsTitle: '最新の考察',
    recentChaosTitle: 'カオス（シグナル）',
    recentNotesTitle: '読書ノート',
    noMeditationsMessage: 'まだ思索はありません。',
    noQuestionsMessage: 'まだ考察はありません。',
    noChaosMessage: 'まだシグナルはありません。',
    noNotesMessage: 'まだ読書ノートはありません。',
    viewAll: 'すべて表示',
  },
};

/** Locale string for Date.toLocaleDateString. */
export function localeFor(lang: Language): string {
  return lang === 'zh' ? 'zh-CN' : lang === 'ja' ? 'ja-JP' : 'en-US';
}
