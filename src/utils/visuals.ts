import rawManifest from '../data/visuals-manifest.json';
import type { Language } from './i18n';

export type VisualRenderer = 'standalone' | 'interactive-explainer';
export type VisualType = 'visual-story' | 'interactive-explainer';
export type VisualStatus = 'draft' | 'published';
export type VisualCover = 'agents' | 'typhoon';

export interface VisualLocaleRecord {
  title: string;
  description: string;
  source?: string;
  og: {
    title: string;
    description: string;
  };
  artifact?: string;
}

export interface VisualWork {
  slug: string;
  type: VisualType;
  renderer: VisualRenderer;
  publishedAt: string;
  featured: boolean;
  cover: VisualCover;
  tags: string[];
  status: VisualStatus;
  externalResources: string[];
  locales: Record<Language, VisualLocaleRecord>;
}

export interface VisualGalleryItem {
  slug: string;
  type: VisualType;
  renderer: VisualRenderer;
  publishedAt: string;
  featured: boolean;
  cover: VisualCover;
  tags: string[];
  title: string;
  description: string;
  href: string;
  hasCurrentArtifact: boolean;
  availableLanguages: Language[];
}

const languages: Language[] = ['en', 'zh', 'ja'];
const visualTypes: VisualType[] = ['visual-story', 'interactive-explainer'];
const visualStatuses: VisualStatus[] = ['draft', 'published'];

function assertManifest(value: unknown): asserts value is VisualWork[] {
  if (!Array.isArray(value)) throw new TypeError('Visual manifest must be an array.');

  const slugs = new Set<string>();
  for (const work of value as VisualWork[]) {
    if (!work.slug || slugs.has(work.slug)) throw new TypeError(`Invalid or duplicate visual slug: ${work.slug}`);
    slugs.add(work.slug);
    if (!visualTypes.includes(work.type)) throw new TypeError(`${work.slug} has an invalid visual type.`);
    if (!visualStatuses.includes(work.status)) throw new TypeError(`${work.slug} has an invalid status.`);
    if (!Array.isArray(work.tags) || work.tags.length === 0) throw new TypeError(`${work.slug} must declare tags.`);
    if (!Array.isArray(work.externalResources)) throw new TypeError(`${work.slug} must declare an external resource allowlist.`);
    let artifactCount = 0;
    for (const lang of languages) {
      const localized = work.locales?.[lang];
      if (!localized?.title || !localized.description || !localized.og?.title || !localized.og.description) {
        throw new TypeError(`${work.slug} is missing ${lang} gallery metadata.`);
      }
      if (localized.artifact) {
        artifactCount += 1;
        if (!localized.source) throw new TypeError(`${work.slug} is missing the ${lang} artifact source.`);
      }
    }
    if (artifactCount === 0) throw new TypeError(`${work.slug} must publish at least one artifact.`);
  }
}

const manifestValue: unknown = rawManifest;
assertManifest(manifestValue);
const works = manifestValue.filter((work) => work.status === 'published');

export function getVisualPath(slug: string, lang: Language): string {
  const prefix = lang === 'zh' ? '/cn' : lang === 'ja' ? '/ja' : '';
  return `${prefix}/visuals/${slug}/`;
}

export function getVisualGallery(lang: Language): VisualGalleryItem[] {
  return works.map((work) => {
    const localized = work.locales[lang];
    const availableLanguages = languages.filter((candidate) => Boolean(work.locales[candidate].artifact));
    const targetLanguage = localized.artifact ? lang : availableLanguages[0];

    return {
      slug: work.slug,
      type: work.type,
      renderer: work.renderer,
      publishedAt: work.publishedAt,
      featured: work.featured,
      cover: work.cover,
      tags: work.tags,
      title: localized.title,
      description: localized.description,
      href: getVisualPath(work.slug, targetLanguage),
      hasCurrentArtifact: Boolean(localized.artifact),
      availableLanguages,
    };
  });
}

export function getVisualWork(slug: string): VisualWork | undefined {
  return works.find((work) => work.slug === slug);
}

export function getVisualWorks(): VisualWork[] {
  return works;
}
