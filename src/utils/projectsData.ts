import type { Language } from './i18n';

export type ProjectType = 'project' | 'paper' | 'tool' | 'list' | 'app';

export interface Project {
  slug: string;
  type: ProjectType;
  title: string; // proper noun — kept identical across languages
  desc: Record<Language, string>;
  github?: string;
  demo?: string;
  paper?: string;
  venue?: string; // for papers: conference / journal
  language?: string; // primary programming language
  stars?: number;
  forks?: number;
  status?: 'active' | 'alpha' | 'beta' | 'wip' | 'archived';
  techStack?: string[];
  featured?: boolean;
  year?: number;
}

// Group display order + localized headings.
export const projectGroups: { type: ProjectType; label: Record<Language, string> }[] = [
  { type: 'project', label: { en: 'Flagship Projects', zh: '旗舰项目', ja: '主要プロジェクト' } },
  { type: 'paper', label: { en: 'Research & Papers', zh: '研究与论文', ja: '研究と論文' } },
  { type: 'tool', label: { en: 'Tools & Utilities', zh: '工具与实用程序', ja: 'ツールとユーティリティ' } },
  { type: 'app', label: { en: 'Web Apps', zh: 'Web 应用', ja: 'Web アプリ' } },
  { type: 'list', label: { en: 'Curated Lists', zh: '精选清单', ja: 'キュレーションリスト' } },
];

export const projects: Project[] = [
  {
    slug: 'the-agent-builder',
    type: 'project',
    title: 'The Agent Builder',
    desc: {
      en: 'A full AI-agent development platform that shifts AI from "code generation" to "requirement clarification & planning" — concept to shipped product.',
      zh: '完整的 AI 智能体开发平台，将 AI 能力从「代码生成」转向「需求澄清与规划设计」，从源头解决开发痛点。',
      ja: 'AIの力を「コード生成」から「要件明確化と計画設計」へと転換する、コンセプトから実装までのAIエージェント開発プラットフォーム。',
    },
    demo: 'https://the-agent-builder.com/',
    status: 'alpha',
    techStack: ['AI Agents', 'Planning', 'LLM'],
    featured: true,
    year: 2025,
  },
  {
    slug: 'gtplanner',
    type: 'project',
    title: 'GTPlanner',
    desc: {
      en: 'The open-source planning engine behind The Agent Builder — turns natural language into structured PRDs for "vibe coding".',
      zh: 'The Agent Builder 的开源规划引擎，将自然语言转换为结构化 PRD，专为「氛围编程」设计。',
      ja: 'The Agent Builder のオープンソース計画エンジン。自然言語を構造化された PRD に変換する「バイブコーディング」向けツール。',
    },
    github: 'https://github.com/OpenSQZ/GTPlanner',
    demo: 'https://the-agent-builder.com/',
    language: 'Python',
    stars: 18,
    forks: 12,
    status: 'active',
    techStack: ['Python', 'PocketFlow', 'FastAPI', 'MCP'],
    featured: true,
    year: 2025,
  },
  {
    slug: 'webke',
    type: 'paper',
    title: 'WebKE',
    desc: {
      en: 'Knowledge triple extraction from semi-structured web using a pre-trained markup language model (HTMLBERT).',
      zh: '使用预训练标记语言模型（HTMLBERT）从半结构化网页中抽取知识三元组。',
      ja: '事前学習済みマークアップ言語モデル（HTMLBERT）を用いた半構造化ウェブからの知識トリプル抽出。',
    },
    github: 'https://github.com/redreamality/webke',
    venue: 'CIKM 2021',
    language: 'Python',
    stars: 13,
    forks: 3,
    techStack: ['Python', 'BERT', 'Knowledge Graph'],
    featured: true,
    year: 2021,
  },
  {
    slug: 'rere-relation-extraction',
    type: 'paper',
    title: 'RERE',
    desc: {
      en: 'Revisiting the negative data of distantly supervised relation extraction — tackling noisy negatives.',
      zh: '《重新审视远程监督关系抽取的负样本》论文实现，解决远程监督中的噪声负数据问题。',
      ja: '遠距離監督関係抽出のネガティブデータを再考し、ノイズの多い負例に対処する論文の実装。',
    },
    github: 'https://github.com/redreamality/RERE-relation-extraction',
    venue: 'Research Paper',
    language: 'Python',
    stars: 20,
    forks: 4,
    techStack: ['Python', 'NLP', 'Relation Extraction'],
    year: 2021,
  },
  {
    slug: 'cpu-collective-loss',
    type: 'paper',
    title: 'Collective Loss Function (cPU)',
    desc: {
      en: 'Research implementation of collective loss functions for machine-learning optimization.',
      zh: '用于机器学习优化的集体损失函数的研究实现。',
      ja: '機械学習最適化のための集合的損失関数の研究実装。',
    },
    github: 'https://github.com/redreamality/cPU',
    venue: 'Research',
    language: 'Python',
    techStack: ['Python', 'Optimization'],
  },
  {
    slug: 'learning-to-rank',
    type: 'tool',
    title: 'Learning to Rank',
    desc: {
      en: 'A Python framework for Learning-to-Rank (LTR) algorithms with multiple ranking models and evaluation metrics.',
      zh: 'Learning to Rank（LTR）算法的 Python 框架，提供多种排序模型与评估指标。',
      ja: '複数のランキングモデルと評価指標を備えた Learning-to-Rank（LTR）アルゴリズムの Python フレームワーク。',
    },
    github: 'https://github.com/redreamality/learning-to-rank',
    language: 'Python',
    stars: 14,
    forks: 3,
    techStack: ['Python', 'Machine Learning', 'Ranking'],
  },
  {
    slug: 'pocketflow-tracing',
    type: 'tool',
    title: 'PocketFlow Tracing',
    desc: {
      en: 'Tracing and debugging for PocketFlow apps — workflow execution insight and performance monitoring.',
      zh: 'PocketFlow 应用的追踪与调试工具，提供工作流执行洞察与性能监控。',
      ja: 'PocketFlow アプリケーション向けのトレーシングとデバッグ — ワークフロー実行の可視化と性能監視。',
    },
    github: 'https://github.com/redreamality/pocketflow-tracing',
    language: 'Python',
    stars: 1,
    forks: 1,
    techStack: ['Python', 'Observability'],
  },
  {
    slug: 'pocketflow-fastapi-template',
    type: 'tool',
    title: 'PocketFlow FastAPI Template',
    desc: {
      en: 'A minimal production-ready template integrating FastAPI, PocketFlow, and pocketflow-tracing.',
      zh: '集成 FastAPI、PocketFlow 与 pocketflow-tracing 的最小可用、生产就绪模板。',
      ja: 'FastAPI、PocketFlow、pocketflow-tracing を統合した最小限の本番対応テンプレート。',
    },
    github: 'https://github.com/redreamality/pocketflow-fastapi-template',
    language: 'Python',
    stars: 3,
    techStack: ['Python', 'FastAPI', 'PocketFlow'],
  },
  {
    slug: 'git-latexdiff',
    type: 'tool',
    title: 'Git LaTeX Diff',
    desc: {
      en: 'Diff LaTeX files against previous versions with visual previews — track changes in academic papers easily.',
      zh: '将 LaTeX 文件与历史版本做差异比较并生成可视化预览，轻松追踪论文与文档的修改。',
      ja: 'LaTeX ファイルを過去のバージョンと差分比較し、視覚的なプレビューを生成。論文の変更追跡を容易に。',
    },
    github: 'https://github.com/redreamality/git-latexdiff',
    language: 'Batchfile',
    stars: 18,
    forks: 5,
    techStack: ['LaTeX', 'Git'],
  },
  {
    slug: 'llm-spec',
    type: 'tool',
    title: 'LLM Specification Template',
    desc: {
      en: 'A structured template for Large Language Model requirement specifications (大模型需求规格说明书模板).',
      zh: '大模型需求规格说明书模板，为 LLM 项目规划提供结构化方法。',
      ja: '大規模言語モデルの要件仕様書テンプレート。LLM プロジェクト計画に構造化されたアプローチを提供。',
    },
    github: 'https://github.com/redreamality/LLM-spec',
    techStack: ['LLM', 'Spec'],
  },
  {
    slug: 'pydeploy',
    type: 'tool',
    title: 'Python Deployment Tools',
    desc: {
      en: 'Deployment tools and configurations for Python applications.',
      zh: 'Python 应用的部署工具与配置。',
      ja: 'Python アプリケーション向けのデプロイツールと設定。',
    },
    github: 'https://github.com/redreamality/pydeploy',
    language: 'Nginx',
    techStack: ['Python', 'Nginx', 'DevOps'],
  },
  {
    slug: 'multi-agent-system-slides',
    type: 'tool',
    title: 'Multi-Agent System Slides',
    desc: {
      en: 'Interactive slides introducing Multi-Agent Systems (MAS), built with modern web tech.',
      zh: '介绍多智能体系统（MAS）的交互式幻灯片，使用现代 Web 技术构建。',
      ja: 'マルチエージェントシステム（MAS）を紹介するインタラクティブなスライド。最新の Web 技術で構築。',
    },
    github: 'https://github.com/redreamality/multi-agent-system-slides',
    language: 'Vue',
    techStack: ['Vue', 'Slidev'],
  },
  {
    slug: 'gtplanner-slides',
    type: 'tool',
    title: 'GTPlanner Slides',
    desc: {
      en: 'Presentation slides for the GTPlanner project — planning algorithms and methodology.',
      zh: 'GTPlanner 项目的演讲幻灯片，展示规划算法与方法论。',
      ja: 'GTPlanner プロジェクトのプレゼンスライド — 計画アルゴリズムと方法論。',
    },
    github: 'https://github.com/redreamality/gtplanner-slides',
    language: 'Vue',
    techStack: ['Vue', 'Slidev'],
  },
  {
    slug: 'wificard',
    type: 'app',
    title: 'WiFi Card Generator',
    desc: {
      en: 'Generate QR codes for WiFi sharing — clean, privacy-focused, no data stored.',
      zh: '生成 WiFi 共享二维码，界面简洁、注重隐私、不存储任何数据。',
      ja: 'WiFi 共有用の QR コードを生成。クリーンでプライバシー重視、データ保存なし。',
    },
    github: 'https://github.com/redreamality/wificard',
    language: 'TypeScript',
    stars: 7,
    techStack: ['TypeScript', 'QR'],
  },
  {
    slug: 'ai-chatbot',
    type: 'app',
    title: 'AI Chatbot',
    desc: {
      en: 'A modern AI chatbot with multi-model support and conversation management.',
      zh: '现代化的 AI 聊天机器人，支持多种语言模型与对话管理。',
      ja: 'マルチモデル対応と会話管理を備えたモダンな AI チャットボット。',
    },
    github: 'https://github.com/redreamality/ai-chatbot',
    language: 'TypeScript',
    techStack: ['TypeScript', 'LLM'],
  },
  {
    slug: 'epub2txt',
    type: 'app',
    title: 'EPUB to Text Converter',
    desc: {
      en: 'A FastAPI server for ebook conversion — EPUB to text with a clean API.',
      zh: '用于电子书转换的 FastAPI 服务，支持 EPUB 转文本，API 简洁。',
      ja: '電子書籍変換用の FastAPI サーバー。EPUB をテキストに変換するクリーンな API。',
    },
    github: 'https://github.com/redreamality/epub2txt',
    language: 'Python',
    techStack: ['Python', 'FastAPI'],
  },
  {
    slug: 'wechat-text-emotion',
    type: 'app',
    title: 'WeChat Text Emotion',
    desc: {
      en: 'A tool for creating WeChat text-based emoticons (制作微信文字表情).',
      zh: '制作微信文字表情的小工具。',
      ja: 'WeChat のテキストベース絵文字（制作微信文字表情）を作成するツール。',
    },
    github: 'https://github.com/redreamality/wechat-text-emotion',
    language: 'Python',
    techStack: ['Python'],
  },
  {
    slug: 'benchmark-papers',
    type: 'list',
    title: 'Benchmark Papers',
    desc: {
      en: 'A curated collection of important LLM benchmark papers and evaluation resources.',
      zh: 'AI/LLM 基准测试论文与评估资源的精选合集。',
      ja: '重要な LLM ベンチマーク論文と評価リソースのキュレーションコレクション。',
    },
    demo: 'https://redreamality.com/benchmark-papers',
    techStack: ['LLM', 'Benchmarks'],
    featured: true,
  },
  {
    slug: 'awesome-manus',
    type: 'list',
    title: 'Awesome Manus',
    desc: {
      en: 'A curated list around the Manus stack: multimodal models, orchestration, multi-agent systems, tooling.',
      zh: '围绕 Manus 技术栈的精选清单：多模态模型、工作流编排、多智能体系统与工具集成。',
      ja: 'Manus スタック関連のキュレーションリスト：マルチモーダルモデル、オーケストレーション、マルチエージェント、ツール群。',
    },
    github: 'https://github.com/redreamality/awesome-manus',
    language: 'Markdown',
    stars: 1,
    techStack: ['Awesome List'],
  },
  {
    slug: 'machine-learning-terms',
    type: 'list',
    title: 'Machine Learning Terms',
    desc: {
      en: 'A comprehensive glossary of machine-learning terms and concepts for students and practitioners.',
      zh: '面向学生与从业者的机器学习术语与概念词汇表。',
      ja: '学生と実務者のための機械学習用語・概念の包括的な用語集。',
    },
    github: 'https://github.com/redreamality/machine-learning-terms',
    techStack: ['Glossary', 'ML'],
  },
];

