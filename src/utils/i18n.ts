import { getCollection } from 'astro:content';

export type Language = 'zh' | 'en';

export interface I18nConfig {
  defaultLanguage: Language;
  languages: Language[];
  labels: Record<Language, Record<string, string>>;
}

export const i18nConfig: I18nConfig = {
  defaultLanguage: 'en',
  languages: ['en', 'zh'],
  labels: {
    zh: {
      // Navigation
      home: '首页',
      blog: '博客',
      talks: '演讲',
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
    },
    en: {
      // Navigation
      home: 'Home',
      blog: 'Blog',
      talks: 'Talks',
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
  return 'en'; // Default to English
}

/**
 * Get localized path
 */
export function getLocalizedPath(path: string, lang: Language): string {
  // Remove existing language prefix
  const cleanPath = path.replace(/^\/(cn|en)/, '');

  if (lang === 'zh') {
    return cleanPath === '' || cleanPath === '/' ? '/cn' : `/cn${cleanPath}`;
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
    const collectionName = lang === 'zh' ? 'blog-cn' : 'blog-en';
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
    const collectionName = lang === 'zh' ? 'talks-cn' : 'talks-en';
    const talks = await getCollection(collectionName);
    return talks.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  } catch (error) {
    // If collection doesn't exist, return empty array
    return [];
  }
}

/**
 * Get all unique tags for a specific language
 */
export async function getTags(lang: Language): Promise<string[]> {
  const posts = await getBlogPosts(lang);
  const allTags = posts.flatMap(post => post.data.tags || []);
  return [...new Set(allTags)].sort();
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
export async function getTranslationStatus(slug: string, type: 'blog' | 'talks') {
  const status = {
    zh: false,
    en: false,
    originalLang: 'zh' as Language
  };

  try {
    // Check Chinese version
    const zhCollection = type === 'blog' ? 'blog-cn' : 'talks-cn';
    const zhPosts = await getCollection(zhCollection as any);
    status.zh = zhPosts.some(post => post.slug === slug);

    // Check English version
    const enCollection = type === 'blog' ? 'blog-en' : 'talks-en';
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
  type: 'blog' | 'talks',
  lang: Language
): Promise<any> {
  try {
    // Try language-specific collection first
    const collectionName = `${type}-${lang === 'zh' ? 'cn' : 'en'}` as const;
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
  alternates.push({
    lang: 'en',
    url: new URL(enPath, site).toString()
  });

  // Add Chinese version
  const zhPath = getLocalizedPath(currentPath, 'zh');
  alternates.push({
    lang: 'zh',
    url: new URL(zhPath, site).toString()
  });

  return alternates;
}

/**
 * Get locale string for meta tags
 */
export function getLocaleString(lang: Language): string {
  return lang === 'zh' ? 'zh_CN' : 'en_US';
}

/**
 * Get language code for HTML lang attribute
 */
export function getLanguageCode(lang: Language): string {
  return lang === 'zh' ? 'zh-CN' : 'en';
}

/**
 * Generate language-aware canonical URLs
 */
export function getCanonicalURL(path: string, lang: Language, site: string): string {
  const localizedPath = getLocalizedPath(path, lang);
  return new URL(localizedPath, site).toString();
}
