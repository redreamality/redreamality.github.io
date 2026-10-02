import type { Language } from './i18n';

export const notesCopy = {
  en: {
    title: 'Reading Notes', description: 'Reading notes and collected source summaries.',
    search: 'Search notes', clear: 'Clear', kinds: 'Note type', all: 'All',
    manual: 'Reading notes', library: 'Library summaries', count: '{count} notes',
    empty: 'No notes match your search.', ai: 'AI summary · Qwen',
    chinese: 'Summary in Chinese', indexed: 'Indexed', written: 'Written',
    source: 'Original source', back: 'Back to notes',
    partial: 'Partial summary: only part of the source was summarized.',
    coverage: '{summarized} of {total} characters summarized',
  },
  zh: {
    title: '阅读笔记', description: '阅读笔记与收录资料的摘要。',
    search: '搜索笔记', clear: '清除', kinds: '笔记类型', all: '全部',
    manual: '阅读笔记', library: '资料摘要', count: '{count} 篇笔记',
    empty: '没有找到匹配的笔记。', ai: 'AI 摘要 · Qwen',
    chinese: '中文摘要', indexed: '收录', written: '写于',
    source: '查看原文', back: '返回笔记',
    partial: '摘要覆盖不完整：仅总结了部分原文。',
    coverage: '已总结 {summarized} / {total} 字符',
  },
  ja: {
    title: '読書ノート', description: '読書ノートと収集した資料の要約。',
    search: 'ノートを検索', clear: 'クリア', kinds: 'ノートの種類', all: 'すべて',
    manual: '読書ノート', library: '資料の要約', count: '{count} 件のノート',
    empty: '一致するノートがありません。', ai: 'AI 要約 · Qwen',
    chinese: '要約は中国語', indexed: '収録日', written: '作成日',
    source: '原文を読む', back: 'ノート一覧へ',
    partial: '部分的な要約：原文の一部のみを要約しています。',
    coverage: '{total} 文字中 {summarized} 文字を要約',
  },
} satisfies Record<Language, Record<string, string>>;

export const notesPrefix = (lang: Language) => lang === 'zh' ? '/cn' : lang === 'ja' ? '/ja' : '';
export const notesPath = (lang: Language) => `${notesPrefix(lang)}/garden/notes/`;
export const libraryNotePath = (id: string, lang: Language) => `${notesPath(lang)}library/${id}/`;
export function noteDate(date: string, lang: Language) {
  return new Date(date).toLocaleDateString(
    lang === 'zh' ? 'zh-CN' : lang === 'ja' ? 'ja-JP' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' },
  );
}
