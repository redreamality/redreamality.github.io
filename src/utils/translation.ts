import type { Language } from './i18n';

export interface TranslationConfig {
  apiBase: string;
  apiKey: string;
  model: string;
}

export interface TranslationRequest {
  content: string;
  fromLang: Language;
  toLang: Language;
  contentType: 'blog' | 'talks' | 'general';
  preserveFormatting?: boolean;
}

export interface TranslationResult {
  success: boolean;
  translatedContent?: string;
  originalContent: string;
  fromLang: Language;
  toLang: Language;
  error?: string;
  metadata?: {
    model: string;
    tokensUsed?: number;
    processingTime?: number;
  };
}

export interface ContentMetadata {
  title: string;
  description: string;
  tags?: string[];
  frontmatter?: Record<string, any>;
}

export interface BlogTranslationRequest extends TranslationRequest {
  metadata: ContentMetadata;
}

export interface BlogTranslationResult extends TranslationResult {
  translatedMetadata?: ContentMetadata;
}

/**
 * Translation service using LLM API for high-quality content translation
 */
export class TranslationService {
  private config: TranslationConfig;

  constructor(config: TranslationConfig) {
    this.config = config;
  }

  /**
   * Translate general content
   */
  async translateContent(request: TranslationRequest): Promise<TranslationResult> {
    const startTime = Date.now();

    try {
      const prompt = this.buildTranslationPrompt(request);
      
      const response = await fetch(`${this.config.apiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(request.contentType, request.fromLang, request.toLang)
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const translatedContent = data.choices?.[0]?.message?.content;

      if (!translatedContent) {
        throw new Error('No translation content received from API');
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        translatedContent: translatedContent.trim(),
        originalContent: request.content,
        fromLang: request.fromLang,
        toLang: request.toLang,
        metadata: {
          model: this.config.model,
          tokensUsed: data.usage?.total_tokens,
          processingTime,
        },
      };

    } catch (error) {
      console.error('Translation error:', error);
      return {
        success: false,
        originalContent: request.content,
        fromLang: request.fromLang,
        toLang: request.toLang,
        error: error instanceof Error ? error.message : 'Unknown translation error',
      };
    }
  }

  /**
   * Translate blog post with metadata
   */
  async translateBlogPost(request: BlogTranslationRequest): Promise<BlogTranslationResult> {
    const startTime = Date.now();

    try {
      // First translate the metadata
      const metadataResult = await this.translateMetadata(request.metadata, request.fromLang, request.toLang);
      
      // Then translate the content
      const contentResult = await this.translateContent({
        content: request.content,
        fromLang: request.fromLang,
        toLang: request.toLang,
        contentType: request.contentType,
        preserveFormatting: request.preserveFormatting,
      });

      if (!contentResult.success) {
        return {
          ...contentResult,
          translatedMetadata: metadataResult.success ? metadataResult.translatedMetadata : undefined,
        } as BlogTranslationResult;
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        translatedContent: contentResult.translatedContent,
        originalContent: request.content,
        fromLang: request.fromLang,
        toLang: request.toLang,
        translatedMetadata: metadataResult.success ? metadataResult.translatedMetadata : undefined,
        metadata: {
          model: this.config.model,
          tokensUsed: (contentResult.metadata?.tokensUsed || 0) + (metadataResult.metadata?.tokensUsed || 0),
          processingTime,
        },
      };

    } catch (error) {
      console.error('Blog translation error:', error);
      return {
        success: false,
        originalContent: request.content,
        fromLang: request.fromLang,
        toLang: request.toLang,
        error: error instanceof Error ? error.message : 'Unknown blog translation error',
      };
    }
  }

  /**
   * Translate content metadata (title, description, tags)
   */
  private async translateMetadata(
    metadata: ContentMetadata, 
    fromLang: Language, 
    toLang: Language
  ): Promise<{ success: boolean; translatedMetadata?: ContentMetadata; metadata?: any }> {
    try {
      const metadataText = JSON.stringify({
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags || [],
      });

      const prompt = `Translate the following JSON metadata from ${fromLang === 'zh' ? 'Chinese' : 'English'} to ${toLang === 'zh' ? 'Chinese' : 'English'}. Maintain the JSON structure and translate only the values:

${metadataText}

Return only the translated JSON without any additional text or formatting.`;

      const response = await fetch(`${this.config.apiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: 'You are a professional translator. Translate the provided JSON metadata accurately while preserving the structure.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Metadata translation API error: ${response.status}`);
      }

      const data = await response.json();
      const translatedText = data.choices?.[0]?.message?.content?.trim();

      if (!translatedText) {
        throw new Error('No metadata translation received');
      }

      // Parse the translated JSON
      const translatedMetadata = JSON.parse(translatedText);

      return {
        success: true,
        translatedMetadata: {
          title: translatedMetadata.title,
          description: translatedMetadata.description,
          tags: translatedMetadata.tags,
          frontmatter: metadata.frontmatter,
        },
        metadata: {
          tokensUsed: data.usage?.total_tokens,
        },
      };

    } catch (error) {
      console.error('Metadata translation error:', error);
      return {
        success: false,
      };
    }
  }

  /**
   * Build translation prompt based on content type
   */
  private buildTranslationPrompt(request: TranslationRequest): string {
    const fromLangName = request.fromLang === 'zh' ? 'Chinese' : 'English';
    const toLangName = request.toLang === 'zh' ? 'Chinese' : 'English';

    let prompt = `Translate the following ${request.contentType} content from ${fromLangName} to ${toLangName}:\n\n`;
    
    if (request.preserveFormatting) {
      prompt += 'IMPORTANT: Preserve all Markdown formatting, code blocks, links, and structure exactly as they appear.\n\n';
    }

    prompt += request.content;

    return prompt;
  }

  /**
   * Get system prompt based on content type and languages
   */
  private getSystemPrompt(contentType: string, fromLang: Language, toLang: Language): string {
    const fromLangName = fromLang === 'zh' ? 'Chinese' : 'English';
    const toLangName = toLang === 'zh' ? 'Chinese' : 'English';

    const basePrompt = `You are a professional translator specializing in technical content translation from ${fromLangName} to ${toLangName}.`;

    const contentSpecificPrompts = {
      blog: `
Your task is to translate technical blog posts while:
- Maintaining technical accuracy and terminology
- Preserving code examples and technical concepts
- Ensuring natural flow in the target language
- Keeping all Markdown formatting intact
- Translating comments in code blocks when appropriate
- Maintaining the same tone and style`,

      talks: `
Your task is to translate presentation content while:
- Maintaining the structure and flow of presentations
- Preserving technical terminology and concepts
- Ensuring clarity for the target audience
- Keeping formatting and structure intact
- Translating slide titles and descriptions accurately`,

      general: `
Your task is to translate content while:
- Maintaining accuracy and meaning
- Ensuring natural flow in the target language
- Preserving any formatting or structure
- Adapting cultural references when necessary`
    };

    return basePrompt + (contentSpecificPrompts[contentType as keyof typeof contentSpecificPrompts] || contentSpecificPrompts.general);
  }
}

/**
 * Create translation service instance (for server-side use only)
 */
export function createTranslationService(): TranslationService | null {
  // This should only be used in server-side contexts (GitHub Actions)
  if (typeof process === 'undefined') {
    console.warn('Translation service should only be used server-side');
    return null;
  }

  const config: TranslationConfig = {
    apiBase: process.env.OPENAI_API_BASE || 'https://gateway.chat.sensedeal.vip/v1',
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.MODEL || 'qwen2.5-32b-instruct-int4',
  };

  if (!config.apiKey) {
    console.error('Translation API key not configured');
    return null;
  }

  return new TranslationService(config);
}

/**
 * Utility function to extract frontmatter and content from markdown
 */
export function parseMarkdownContent(markdown: string): { frontmatter: string; content: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);

  if (match) {
    return {
      frontmatter: match[1],
      content: match[2].trim(),
    };
  }

  return {
    frontmatter: '',
    content: markdown,
  };
}

/**
 * Utility function to reconstruct markdown with translated content
 */
export function reconstructMarkdown(
  originalFrontmatter: string,
  translatedContent: string,
  translatedMetadata?: ContentMetadata
): string {
  if (!originalFrontmatter) {
    return translatedContent;
  }

  let frontmatter = originalFrontmatter;

  // Update frontmatter with translated metadata if provided
  if (translatedMetadata) {
    frontmatter = frontmatter
      .replace(/title:\s*['"].*['"]/, `title: '${translatedMetadata.title.replace(/'/g, "''")}'`)
      .replace(/description:\s*['"].*['"]/, `description: '${translatedMetadata.description.replace(/'/g, "''")}'`);

    if (translatedMetadata.tags && translatedMetadata.tags.length > 0) {
      const tagsString = translatedMetadata.tags.map(tag => `'${tag.replace(/'/g, "''")}'`).join(', ');
      frontmatter = frontmatter.replace(/tags:\s*\[.*\]/, `tags: [${tagsString}]`);
    }
  }

  return `---\n${frontmatter}\n---\n\n${translatedContent}`;
}
