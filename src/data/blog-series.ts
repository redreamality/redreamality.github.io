/**
 * Blog series (recurring reports published as normal blog posts).
 *
 * A post joins a series with frontmatter `series: <key>` (optionally
 * `seriesOrder: <n>`; otherwise posts are ordered by pubDate). The key must
 * exist here. Each locale lists only its own posts.
 */
import type { Language } from '../utils/i18n';

export interface BlogSeriesConfig {
  title: Record<Language, string>;
}

export const BLOG_SERIES = {
  'agent-harness': {
    title: { zh: 'Agent Harness 动态', en: 'Agent Harness Updates', ja: 'Agent Harness 動向' },
  },
  pstack: {
    title: { zh: 'pstack 实测', en: 'pstack Hands-on', ja: 'pstack 実地検証' },
  },
  openspec: {
    title: { zh: 'OpenSpec 实测', en: 'OpenSpec Hands-on', ja: 'OpenSpec 実地検証' },
  },
  'hot-skill': {
    title: { zh: '热门 Skill 实测', en: 'Hot Skill Tests', ja: '注目 Skill 実地検証' },
  },
  rsi: {
    title: { zh: '递归自我改进（RSI）动态', en: 'Recursive Self-Improvement Updates', ja: '再帰的自己改善（RSI）動向' },
  },
} satisfies Record<string, BlogSeriesConfig>;

export type BlogSeriesKey = keyof typeof BLOG_SERIES;
export const BLOG_SERIES_KEYS = Object.keys(BLOG_SERIES) as [BlogSeriesKey, ...BlogSeriesKey[]];
