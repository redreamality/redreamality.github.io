import { getCollection } from 'astro:content';
import type { Language } from './i18n';

export interface ContentItem {
  slug: string;
  title: string;
  pubDate?: Date;
  date?: Date;
  description: string;
  tags?: string[];
  language: Language;
  collection: string;
}

export interface TranslationStatus {
  slug: string;
  title: string;
  type: 'blog' | 'talks';
  zh: {
    exists: boolean;
    collection?: string;
    title?: string;
    pubDate?: Date;
  };
  en: {
    exists: boolean;
    collection?: string;
    title?: string;
    pubDate?: Date;
  };
  needsTranslation: {
    toEnglish: boolean;
    toChinese: boolean;
  };
  priority: 'high' | 'medium' | 'low';
}

export interface ContentSyncReport {
  totalContent: number;
  translatedContent: number;
  missingTranslations: number;
  translationCoverage: number;
  blogStats: {
    total: number;
    translated: number;
    coverage: number;
  };
  talksStats: {
    total: number;
    translated: number;
    coverage: number;
  };
  items: TranslationStatus[];
  recommendations: string[];
}

/**
 * Get all content items from all collections
 */
async function getAllContentItems(): Promise<ContentItem[]> {
  const items: ContentItem[] = [];
  
  // Define collection mappings
  const collections = [
    { name: 'blog-cn', type: 'blog' as const, lang: 'zh' as Language },
    { name: 'blog-en', type: 'blog' as const, lang: 'en' as Language },
    { name: 'talks-cn', type: 'talks' as const, lang: 'zh' as Language },
    { name: 'talks-en', type: 'talks' as const, lang: 'en' as Language },
  ];

  for (const collection of collections) {
    try {
      const posts = await getCollection(collection.name as any);
      
      for (const post of posts) {
        items.push({
          slug: post.slug,
          title: post.data.title,
          pubDate: post.data.pubDate,
          date: post.data.date,
          description: post.data.description || '',
          tags: post.data.tags || [],
          language: collection.lang,
          collection: collection.name,
        });
      }
    } catch (error) {
      // Collection doesn't exist or is empty, continue
      console.warn(`Collection ${collection.name} not found or empty`);
    }
  }

  return items;
}

/**
 * Determine content priority based on various factors
 */
function calculateContentPriority(item: ContentItem): 'high' | 'medium' | 'low' {
  const title = item.title.toLowerCase();
  const tags = item.tags?.map(tag => tag.toLowerCase()) || [];
  
  // High priority keywords
  const highPriorityKeywords = [
    'multi-agent', 'ai', 'machine learning', 'tutorial', 'guide',
    'python', 'javascript', 'development', 'programming', 'technical'
  ];
  
  // Medium priority keywords
  const mediumPriorityKeywords = [
    'blockchain', 'trading', 'finance', 'web', 'frontend', 'backend'
  ];

  // Check title and tags for priority keywords
  const hasHighPriority = highPriorityKeywords.some(keyword => 
    title.includes(keyword) || tags.some(tag => tag.includes(keyword))
  );
  
  const hasMediumPriority = mediumPriorityKeywords.some(keyword => 
    title.includes(keyword) || tags.some(tag => tag.includes(keyword))
  );

  // Recent content gets higher priority
  const isRecent = item.pubDate && 
    (Date.now() - item.pubDate.getTime()) < (365 * 24 * 60 * 60 * 1000); // Within 1 year

  if (hasHighPriority || isRecent) {
    return 'high';
  } else if (hasMediumPriority) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Generate comprehensive content synchronization report
 */
export async function generateContentSyncReport(): Promise<ContentSyncReport> {
  const allItems = await getAllContentItems();
  
  // Group items by slug and type
  const contentMap = new Map<string, {
    slug: string;
    type: 'blog' | 'talks';
    zh?: ContentItem;
    en?: ContentItem;
  }>();

  for (const item of allItems) {
    const type = item.collection.includes('blog') ? 'blog' : 'talks';
    const key = `${type}:${item.slug}`;
    
    if (!contentMap.has(key)) {
      contentMap.set(key, {
        slug: item.slug,
        type,
      });
    }
    
    const entry = contentMap.get(key)!;
    if (item.language === 'zh') {
      entry.zh = item;
    } else {
      entry.en = item;
    }
  }

  // Generate translation status for each content item
  const translationStatuses: TranslationStatus[] = [];
  
  for (const [, entry] of contentMap) {
    const zhExists = !!entry.zh;
    const enExists = !!entry.en;
    
    const priority = entry.zh ? calculateContentPriority(entry.zh) : 
                    entry.en ? calculateContentPriority(entry.en) : 'low';

    translationStatuses.push({
      slug: entry.slug,
      title: entry.zh?.title || entry.en?.title || entry.slug,
      type: entry.type,
      zh: {
        exists: zhExists,
        collection: entry.zh?.collection,
        title: entry.zh?.title,
        pubDate: entry.zh?.pubDate || entry.zh?.date,
      },
      en: {
        exists: enExists,
        collection: entry.en?.collection,
        title: entry.en?.title,
        pubDate: entry.en?.pubDate || entry.en?.date,
      },
      needsTranslation: {
        toEnglish: zhExists && !enExists,
        toChinese: enExists && !zhExists,
      },
      priority,
    });
  }

  // Calculate statistics
  const totalContent = translationStatuses.length;
  const translatedContent = translationStatuses.filter(
    item => item.zh.exists && item.en.exists
  ).length;
  const missingTranslations = totalContent - translatedContent;
  const translationCoverage = totalContent > 0 ? (translatedContent / totalContent) * 100 : 0;

  // Blog statistics
  const blogItems = translationStatuses.filter(item => item.type === 'blog');
  const blogTranslated = blogItems.filter(item => item.zh.exists && item.en.exists).length;
  const blogCoverage = blogItems.length > 0 ? (blogTranslated / blogItems.length) * 100 : 0;

  // Talks statistics
  const talksItems = translationStatuses.filter(item => item.type === 'talks');
  const talksTranslated = talksItems.filter(item => item.zh.exists && item.en.exists).length;
  const talksCoverage = talksItems.length > 0 ? (talksTranslated / talksItems.length) * 100 : 0;

  // Generate recommendations
  const recommendations: string[] = [];
  
  const highPriorityMissing = translationStatuses.filter(
    item => item.priority === 'high' && (item.needsTranslation.toEnglish || item.needsTranslation.toChinese)
  );
  
  if (highPriorityMissing.length > 0) {
    recommendations.push(`Translate ${highPriorityMissing.length} high-priority items first`);
  }
  
  if (translationCoverage < 50) {
    recommendations.push('Focus on increasing overall translation coverage');
  }
  
  if (blogCoverage < talksCoverage) {
    recommendations.push('Prioritize blog post translations');
  } else if (talksCoverage < blogCoverage) {
    recommendations.push('Prioritize talk translations');
  }

  const englishOnlyItems = translationStatuses.filter(item => !item.zh.exists && item.en.exists);
  if (englishOnlyItems.length > 0) {
    recommendations.push(`Consider translating ${englishOnlyItems.length} English-only items to Chinese`);
  }

  return {
    totalContent,
    translatedContent,
    missingTranslations,
    translationCoverage: Math.round(translationCoverage * 100) / 100,
    blogStats: {
      total: blogItems.length,
      translated: blogTranslated,
      coverage: Math.round(blogCoverage * 100) / 100,
    },
    talksStats: {
      total: talksItems.length,
      translated: talksTranslated,
      coverage: Math.round(talksCoverage * 100) / 100,
    },
    items: translationStatuses.sort((a, b) => {
      // Sort by priority, then by type, then by title
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (a.type !== b.type) {
        return a.type.localeCompare(b.type);
      }
      return a.title.localeCompare(b.title);
    }),
    recommendations,
  };
}

/**
 * Get items that need translation to a specific language
 */
export async function getItemsNeedingTranslation(targetLang: Language): Promise<TranslationStatus[]> {
  const report = await generateContentSyncReport();
  
  return report.items.filter(item => {
    if (targetLang === 'en') {
      return item.needsTranslation.toEnglish;
    } else {
      return item.needsTranslation.toChinese;
    }
  });
}

/**
 * Get high-priority items that need translation
 */
export async function getHighPriorityTranslations(): Promise<TranslationStatus[]> {
  const report = await generateContentSyncReport();
  
  return report.items.filter(item => 
    item.priority === 'high' && 
    (item.needsTranslation.toEnglish || item.needsTranslation.toChinese)
  );
}
