/**
 * Project columns (nightly logs) — single source of truth for column metadata.
 *
 * Each column is its own content collection per locale (e.g.
 * `money-machine-nightly-cn`, file name = `YYYY-MM-DD.md`) and lives under the
 * projects section: index `/[lang]/projects/<slug>/`, entries
 * `/[lang]/projects/<slug>/<YYYY-MM-DD>/`. Pages exist only for locales whose
 * collection has at least one entry. Entries are not blog posts: they never
 * appear in blog lists, blog RSS, related articles or the home page.
 */
import type { Language } from '../utils/i18n';

export interface SeriesConfig {
  slug: string;
  /** Column title per locale; a locale without its own title falls back to `en` → `zh`. */
  title: Partial<Record<Language, string>>;
  /** One-line description (cards / fallbacks). */
  description: Partial<Record<Language, string>>;
  /** Longer meta description for the index page (aim for >= 150 chars to avoid generic padding). */
  seoDescription?: Partial<Record<Language, string>>;
  /** Short intro paragraph(s) shown at the top of the column index. */
  intro: Partial<Record<Language, string[]>>;
  /** Optional pinned link shown on the index (e.g. the essay that started the column). */
  pinned?: Partial<Record<Language, { href: string; title: string }>>;
}

export const SERIES = {
  'money-machine-nightly': {
    slug: 'money-machine-nightly',
    title: {
      zh: '赚钱机器夜报',
      en: 'Money Machine Nightly',
    },
    description: {
      zh: '一个 AI agent 试着自己赚钱，每晚记一篇：查了哪些线、跑通了什么、卡在哪。',
      en: 'An AI agent trying to earn money on its own, logged every night: what it checked, what worked, and where it got stuck.',
    },
    seoDescription: {
      zh: '赚钱机器夜报：一个 AI agent 被要求不借任何人的身份、不花钱、尽量不靠人插手，自己去赚钱。这里每晚记一篇它的流水账：当天查了哪些赏金板、比赛和任务市场，哪条线跑通了，卡在钥匙、登记、信誉、身份与税还是支付轨道哪一层，人一共出场了几次。数字来自它自己的运行日志或当天核对的公开数据，不公开私钥、收款地址和任何身份信息。',
      en: 'Money Machine Nightly: an AI agent was told to earn money on its own with no borrowed identity, no budget, and as little human help as possible. Each night it logs which bounty boards, competitions, and task markets it checked, what worked, which layer blocked it, and how many times a human had to step in.',
    },
    intro: {
      zh: [
        '我让一个 AI agent 自己去赚钱：不借任何人的身份，不花钱，尽量不用我插手。这里是它每晚的流水账，查了哪些线、跑通了什么、卡在哪一层。',
        '文中的数字都来自它自己的运行日志，或它当天抓取核对的公开数据；私钥、收款地址和任何能指向具体身份的信息都不会出现在这里。',
      ],
      en: [
        'I asked an AI agent to earn money on its own: no borrowed identity, no spending, and as little help from me as possible. This is its nightly log of what it checked, what worked, and which layer it got stuck on.',
        'Numbers come from its own run logs or from public data it fetched and checked that day. Private keys, receiving addresses, and anything that points to a real identity are never published here.',
      ],
    },
    pinned: {
      zh: {
        href: '/cn/garden/meditations/agent-identity-infrastructure-long-road/',
        title: '钱包谁都能生成：agent 身份基础设施为什么任重道远',
      },
      en: {
        href: '/garden/meditations/agent-identity-infrastructure-long-road/',
        title: 'Anyone Can Generate a Wallet: Why Agent Identity Infrastructure Still Has a Long Way to Go',
      },
    },
  },
} as const satisfies Record<string, SeriesConfig>;

export type SeriesSlug = keyof typeof SERIES;

export function getSeriesConfig(slug: string | undefined | null): SeriesConfig | undefined {
  if (!slug) return undefined;
  return (SERIES as Record<string, SeriesConfig>)[slug];
}

export function getSeriesTitle(config: SeriesConfig, lang: Language): string {
  return config.title[lang] ?? config.title.en ?? config.title.zh ?? config.slug;
}
