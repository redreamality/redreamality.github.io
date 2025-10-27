import type { Language } from '../../utils/i18n';
import type { ContentMetadata, TranslationConfig } from '../../utils/translation';
import { TranslationService, reconstructMarkdown } from '../../utils/translation';

const DEFAULT_TRANSLATION_CONFIG: TranslationConfig = {
  apiBase: 'https://gateway.chat.sensedeal.vip/v1',
  apiKey: 'b9df99ea41435fa7be5ce346b486c33e',
  model: 'qwen2.5-32b-instruct-int4',
};

const CONTENT_DIRECTORY_MAP = {
  blog: {
    en: 'src/content/blog-en',
    zh: 'src/content/blog-cn',
  },
  talks: {
    en: 'src/content/talks-en',
    zh: 'src/content/talks-cn',
  },
} as const;

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  zh: 'Chinese (中文)',
};

function resolveTranslationConfig(): TranslationConfig {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_TRANSLATION_CONFIG };
  }

  try {
    const storage = window.localStorage;
    const apiBase = storage.getItem('translation-api-base') || DEFAULT_TRANSLATION_CONFIG.apiBase;
    const apiKey = storage.getItem('translation-api-key') || DEFAULT_TRANSLATION_CONFIG.apiKey;
    const model = storage.getItem('translation-model') || DEFAULT_TRANSLATION_CONFIG.model;

    return { apiBase, apiKey, model };
  } catch (error) {
    console.warn('Unable to access translation config from localStorage. Using defaults.', error);
    return { ...DEFAULT_TRANSLATION_CONFIG };
  }
}

function encodeToBase64(content: string): string {
  return btoa(unescape(encodeURIComponent(content)));
}

async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (data && typeof data.message === 'string') {
      return data.message;
    }
    return JSON.stringify(data);
  } catch {
    try {
      return await response.text();
    } catch {
      return `${response.status} ${response.statusText}`;
    }
  }
}

export interface AutoTranslateParams {
  slug: string;
  contentType: 'blog' | 'talks';
  sourceLanguage: Language;
  targetLanguage: Language;
  originalContent: string;
  originalFrontmatter: string;
  metadata: ContentMetadata;
  githubToken: string;
}

export interface AutoTranslateResult {
  success: boolean;
  targetPath?: string;
  translatedMarkdown?: string;
  error?: string;
}

export async function autoTranslateContentAndCreateFile(params: AutoTranslateParams): Promise<AutoTranslateResult> {
  const config = resolveTranslationConfig();

  if (!config.apiKey) {
    return {
      success: false,
      error: 'Translation API key is missing. Please configure translation settings.',
    };
  }

  const translationService = new TranslationService(config);

  const translationResult = await translationService.translateBlogPost({
    content: params.originalContent,
    fromLang: params.sourceLanguage,
    toLang: params.targetLanguage,
    contentType: params.contentType,
    preserveFormatting: true,
    metadata: params.metadata,
  });

  if (!translationResult.success || !translationResult.translatedContent) {
    return {
      success: false,
      error: translationResult.error || 'Translation failed without a specific error message.',
    };
  }

  const translatedMetadata = translationResult.translatedMetadata || params.metadata;

  const translatedMarkdown = reconstructMarkdown(
    params.originalFrontmatter,
    translationResult.translatedContent,
    translatedMetadata
  );

  const targetDir = CONTENT_DIRECTORY_MAP[params.contentType]?.[params.targetLanguage];
  if (!targetDir) {
    return {
      success: false,
      error: 'Unsupported content type or language for translation.',
    };
  }

  const targetPath = `${targetDir}/${params.slug}.md`;

  const commitTitle = translatedMetadata.title || params.metadata.title;
  const commitMessage = params.contentType === 'blog'
    ? `Add translated blog post (${params.targetLanguage}): ${commitTitle}`
    : `Add translated talk (${params.targetLanguage}): ${commitTitle}`;

  try {
    const response = await fetch(`https://api.github.com/repos/redreamality/redreamality.github.io/contents/${targetPath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${params.githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: commitMessage,
        content: encodeToBase64(translatedMarkdown),
      }),
    });

    if (response.status === 201) {
      return {
        success: true,
        targetPath,
        translatedMarkdown,
      };
    }

    const errorMessage = await parseErrorResponse(response);
    return {
      success: false,
      error: errorMessage,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown network error occurred while uploading translation.',
    };
  }
}
