import { getCollection } from 'astro:content';

export type Language = 'zh' | 'en' | 'ja';

export interface I18nConfig {
  defaultLanguage: Language;
  languages: Language[];
  labels: Record<Language, Record<string, string>>;
}

export const i18nConfig: I18nConfig = {
  defaultLanguage: 'en',
  languages: ['en', 'zh', 'ja'],
  labels: {
    zh: {
      // Navigation
      home: '首页',
      garden: '花园',
      blog: '博客',
      talks: '演讲',
      questions: '思考问题',
      notes: '阅读笔记',
      projects: '项目',
      about: '关于',
      tags: '标签',
      
      // Content
      readMore: '阅读更多',
      publishedOn: '发布于',
      updatedOn: '更新于',
      author: '作者',
      location: '地点',
      slides: '幻灯片',
      video: '视频',
      
      // Common
      loading: '加载中...',
      error: '错误',
      notFound: '未找到',
      backToHome: '返回首页',
      
      // Blog
      recentPosts: '最新文章',
      allPosts: '所有文章',
      postsTaggedWith: '标签为',
      
      // Talks
      recentTalks: '最新演讲',
      allTalks: '所有演讲',
      
      // Language
      language: '语言',
      switchToEnglish: 'English',
      switchToChinese: '中文',
      toc: '目录',
    },
    en: {
      // Navigation
      home: 'Home',
      garden: 'Garden',
      blog: 'Blog',
      talks: 'Talks',
      questions: 'Questions',
      notes: 'Notes',
      projects: 'Projects',
      about: 'About',
      tags: 'Tags',
      
      // Content
      readMore: 'Read More',
      publishedOn: 'Published on',
      updatedOn: 'Updated on',
      author: 'Author',
      location: 'Location',
      slides: 'Slides',
      video: 'Video',
      
      // Common
      loading: 'Loading...',
      error: 'Error',
      notFound: 'Not Found',
      backToHome: 'Back to Home',
      
      // Blog
      recentPosts: 'Recent Posts',
      allPosts: 'All Posts',
      postsTaggedWith: 'Posts tagged with',
      
      // Talks
      recentTalks: 'Recent Talks',
      allTalks: 'All Talks',
      
      // Language
      language: 'Language',
      switchToEnglish: 'English',
      switchToChinese: '中文',
      toc: 'Table of Contents',
    },
    ja: {
      // Navigation
      home: 'ホーム',
      garden: 'ガーデン',
      blog: 'ブログ',
      talks: 'プレゼンテーション',
      questions: '考察',
      notes: '読書ノート',
      projects: 'プロジェクト',
      about: '私について',
      tags: 'タグ',
      
      // Content
      readMore: '続きを読む',
      publishedOn: '公開日',
      updatedOn: '更新日',
      author: '著者',
      location: '場所',
      slides: 'スライド',
      video: '動画',
      
      // Common
      loading: '読み込み中...',
      error: 'エラー',
      notFound: '見つかりません',
      backToHome: 'ホームに戻る',
      
      // Blog
      recentPosts: '最新記事',
      allPosts: 'すべての記事',
      postsTaggedWith: 'タグ付き記事',
      
      // Talks
      recentTalks: '最新プレゼンテーション',
      allTalks: 'すべてのプレゼンテーション',
      
      // Language
      language: '言語',
      switchToEnglish: 'English',
      switchToChinese: '中文',
      toc: '目次',
    }
  }
};

/**
 * Get translation for a key in the specified language
 */
export function t(key: string, lang: Language = 'en'): string {
  return i18nConfig.labels[lang][key] || key;
}

/**
 * Detect language from URL path
 */
export function detectLanguageFromPath(pathname: string): Language {
  if (pathname.startsWith('/cn/') || pathname === '/cn') {
    return 'zh';
  }
  if (pathname.startsWith('/ja/') || pathname === '/ja') {
    return 'ja';
  }
  return 'en'; // Default to English
}

/**
 * Get localized path
 */
export function getLocalizedPath(path: string, lang: Language): string {
  // Remove existing language prefix
  const cleanPath = path.replace(/^\/(cn|en|ja)/, '');

  if (lang === 'zh') {
    return cleanPath === '' || cleanPath === '/' ? '/cn' : `/cn${cleanPath}`;
  }
  
  if (lang === 'ja') {
    return cleanPath === '' || cleanPath === '/' ? '/ja' : `/ja${cleanPath}`;
  }

  return cleanPath || '/';
}

/**
 * Get alternate language path
 */
export function getAlternateLanguagePath(currentPath: string, targetLang: Language): string {
  return getLocalizedPath(currentPath, targetLang);
}

/**
 * Get blog posts for a specific language
 */
export async function getBlogPosts(lang: Language) {
  try {
    // Get language-specific collection
    const collectionName = lang === 'zh' ? 'blog-cn' : lang === 'ja' ? 'blog-ja' : 'blog-en';
    const posts = await getCollection(collectionName);
    return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
  } catch (error) {
    // If collection doesn't exist, return empty array
    return [];
  }
}

/**
 * Get talks for a specific language
 */
export async function getTalks(lang: Language) {
  try {
    // Get language-specific collection
    const collectionName = lang === 'zh' ? 'talks-cn' : lang === 'ja' ? 'talks-ja' : 'talks-en';
    const talks = await getCollection(collectionName);
    return talks.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  } catch (error) {
    // If collection doesn't exist, return empty array
    return [];
  }
}

/**
 * Get questions for a specific language
 */
export async function getQuestions(lang: Language) {
  try {
    // Get language-specific collection
    const collectionName = lang === 'zh' ? 'questions-cn' : lang === 'ja' ? 'questions-ja' : 'questions-en';
    const questions = await getCollection(collectionName);
    return questions.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  } catch (error) {
    // If collection doesn't exist, return empty array
    return [];
  }
}

/**
 * Get notes for a specific language
 */
export async function getNotes(lang: Language) {
  try {
    // Get language-specific collection
    const collectionName = lang === 'zh' ? 'notes-cn' : lang === 'ja' ? 'notes-ja' : 'notes-en';
    const notes = await getCollection(collectionName);
    return notes.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  } catch (error) {
    // If collection doesn't exist, return empty array
    return [];
  }
}

/**
 * Get projects for a specific language
 */
export async function getProjects(lang: Language) {
  try {
    // Get language-specific collection
    const collectionName = lang === 'zh' ? 'projects-cn' : lang === 'ja' ? 'projects-ja' : 'projects-en';
    const projects = await getCollection(collectionName);
    return projects.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
  } catch (error) {
    // If collection doesn't exist, return empty array
    return [];
  }
}

/**
 * Get tag counts for a specific language
 */
export async function getTagCounts(lang: Language): Promise<Record<string, number>> {
  const posts = await getBlogPosts(lang);
  const allTags = posts.flatMap(post => post.data.tags || []);
  const counts: Record<string, number> = {};
  for (const tag of allTags) {
    counts[tag] = (counts[tag] || 0) + 1;
  }
  return counts;
}

/**
 * Get all unique tags for a specific language, sorted by article count
 * Default minCount is 2 as tags with count 1 don't have dedicated pages
 */
export async function getTags(lang: Language, minCount: number = 2): Promise<string[]> {
  const tagCounts = await getTagCounts(lang);
  const tags = Object.keys(tagCounts).filter(tag => tagCounts[tag] >= minCount);
  
  // Sort by count descending, then alphabetically for tags with same count
  tags.sort((a, b) => {
    if (tagCounts[b] !== tagCounts[a]) {
      return tagCounts[b] - tagCounts[a]; // Higher count first
    }
    return a.localeCompare(b); // Alphabetical for same count
  });
  
  return tags;
}

/**
 * Get posts by tag for a specific language
 */
export async function getPostsByTag(tag: string, lang: Language) {
  const posts = await getBlogPosts(lang);
  return posts.filter(post => post.data.tags?.includes(tag));
}

/**
 * Check if content exists in both languages
 */
export async function getTranslationStatus(slug: string, type: 'blog' | 'talks' | 'projects' | 'questions' | 'notes') {
  const status = {
    zh: false,
    en: false,
    originalLang: 'zh' as Language
  };

  try {
    // Check Chinese version
    const zhCollection = type === 'blog' ? 'blog-cn' : type === 'talks' ? 'talks-cn' : type === 'projects' ? 'projects-cn' : type === 'questions' ? 'questions-cn' : 'notes-cn';
    const zhPosts = await getCollection(zhCollection as any);
    status.zh = zhPosts.some(post => post.slug === slug);

    // Check English version
    const enCollection = type === 'blog' ? 'blog-en' : type === 'talks' ? 'talks-en' : type === 'projects' ? 'projects-en' : type === 'questions' ? 'questions-en' : 'notes-en';
    const enPosts = await getCollection(enCollection as any);
    status.en = enPosts.some(post => post.slug === slug);

    // Check main collection for original language
    const mainPosts = await getCollection(type);
    const mainPost = mainPosts.find(post => post.slug === slug);
    if (mainPost && mainPost.data.lang) {
      status.originalLang = mainPost.data.lang;
    }
  } catch (error) {
    console.warn('Error checking translation status:', error);
  }

  return status;
}

/**
 * Generate static paths for both languages
 */
export async function generateI18nPaths<T>(
  contentGetter: () => Promise<T[]>,
  pathGenerator: (item: T, lang: Language) => { params: any; props: any } | null
): Promise<any[]> {
  const paths = [];
  const content = await contentGetter();

  // Generate English paths (root)
  for (const item of content) {
    const enPath = pathGenerator(item, 'en');
    if (enPath) paths.push(enPath);
  }

  // Generate Chinese paths (/cn/)
  for (const item of content) {
    const cnPath = pathGenerator(item, 'zh');
    if (cnPath) paths.push(cnPath);
  }

  return paths;
}

/**
 * Get content with language fallback
 */
export async function getLocalizedContent(
  slug: string,
  type: 'blog' | 'talks' | 'projects' | 'questions' | 'notes',
  lang: Language
): Promise<any> {
  try {
    // Try language-specific collection first
    const collectionName = `${type}-${lang === 'zh' ? 'cn' : lang === 'ja' ? 'ja' : 'en'}` as const;
    const collection = await getCollection(collectionName);
    const item = collection.find(item => item.slug === slug);
    if (item) return item;
  } catch (error) {
    // Collection doesn't exist, continue to fallback
  }

  try {
    // Fallback to main collection
    const mainCollection = await getCollection(type);
    return mainCollection.find(item =>
      item.slug === slug && (!item.data.lang || item.data.lang === lang)
    );
  } catch (error) {
    return null;
  }
}

/**
 * Get hreflang alternate URLs for a page
 */
export function getHreflangAlternates(currentPath: string, site: string): Array<{lang: string, url: string}> {
  const alternates = [];

  // Add English version
  const enPath = getLocalizedPath(currentPath, 'en');
  const normalizedEnPath = normalizeCanonicalPath(enPath);
  alternates.push({
    lang: 'en',
    url: new URL(normalizedEnPath, site).toString()
  });

  // Add Chinese version
  const zhPath = getLocalizedPath(currentPath, 'zh');
  const normalizedZhPath = normalizeCanonicalPath(zhPath);
  alternates.push({
    lang: 'zh',
    url: new URL(normalizedZhPath, site).toString()
  });

  return alternates;
}

/**
 * Get locale string for meta tags
 */
export function getLocaleString(lang: Language): string {
  return lang === 'zh' ? 'zh_CN' : lang === 'ja' ? 'ja_JP' : 'en_US';
}

/**
 * Get language code for HTML lang attribute
 */
export function getLanguageCode(lang: Language): string {
  return lang === 'zh' ? 'zh-CN' : lang === 'ja' ? 'ja' : 'en';
}

/**
 * Normalize a pathname for canonical URLs when using trailingSlash: 'always'
 */
function normalizeCanonicalPath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';

  // Don't modify direct file URLs (e.g. /rss.xml, /favicon.svg)
  const lastSegment = pathname.split('/').filter(Boolean).pop();
  const isFile = Boolean(lastSegment && lastSegment.includes('.'));
  if (isFile) return pathname;

  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

/**
 * Generate language-aware canonical URLs
 */
export function getCanonicalURL(path: string, lang: Language, site: string): string {
  const localizedPath = getLocalizedPath(path, lang);
  const normalizedPath = normalizeCanonicalPath(localizedPath);
  return new URL(normalizedPath, site).toString();
}
