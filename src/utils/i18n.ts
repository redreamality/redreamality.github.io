import { getCollection } from 'astro:content';

export type Language = 'zh' | 'en';

export interface I18nConfig {
  defaultLanguage: Language;
  languages: Language[];
  labels: Record<Language, Record<string, string>>;
}

export const i18nConfig: I18nConfig = {
  defaultLanguage: 'zh',
  languages: ['zh', 'en'],
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
export function t(key: string, lang: Language = 'zh'): string {
  return i18nConfig.labels[lang][key] || key;
}

/**
 * Detect language from URL path
 */
export function detectLanguageFromPath(pathname: string): Language {
  if (pathname.startsWith('/en/') || pathname === '/en') {
    return 'en';
  }
  return 'zh'; // Default to Chinese
}

/**
 * Get localized path
 */
export function getLocalizedPath(path: string, lang: Language): string {
  // Remove existing language prefix
  const cleanPath = path.replace(/^\/(en|zh)/, '');
  
  if (lang === 'en') {
    return `/en${cleanPath}`;
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
    // Try to get language-specific collection first
    const collectionName = `blog-${lang}` as const;
    const posts = await getCollection(collectionName);
    if (posts && posts.length > 0) {
      return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
    }
  } catch (error) {
    // Collection doesn't exist or is empty, continue to fallback
  }

  try {
    // Fallback to main blog collection and filter by language
    const allPosts = await getCollection('blog');
    return allPosts
      .filter(post => !post.data.lang || post.data.lang === lang)
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
  } catch (error) {
    // If all fails, return empty array
    return [];
  }
}

/**
 * Get talks for a specific language
 */
export async function getTalks(lang: Language) {
  try {
    // Try to get language-specific collection first
    const collectionName = `talks-${lang}` as const;
    const talks = await getCollection(collectionName);
    if (talks && talks.length > 0) {
      return talks.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
    }
  } catch (error) {
    // Collection doesn't exist or is empty, continue to fallback
  }

  try {
    // Fallback to main talks collection and filter by language
    const allTalks = await getCollection('talks');
    return allTalks
      .filter(talk => !talk.data.lang || talk.data.lang === lang)
      .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  } catch (error) {
    // If all fails, return empty array
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
