import { describe, expect, it } from 'vitest';
import { getLatestVisual, getVisualWork } from './visuals';

describe('getLatestVisual', () => {
  it.each([
    ['en', '/visuals/loop-engineering/', 'What Is Loop Engineering?'],
    ['zh', '/cn/visuals/loop-engineering/', '什么是 Loop Engineering？'],
    ['ja', '/ja/visuals/loop-engineering/', 'Loop Engineering とは何か？'],
  ] as const)('returns the newest published %s artifact', (lang, href, title) => {
    expect(getLatestVisual(lang)).toMatchObject({ slug: 'loop-engineering', href, title, hasCurrentArtifact: true });
  });
});

describe('visual artifact registration', () => {
  it.each([
    ['loop-engineering', 'loop-engineering'],
    ['typhoon', 'typhoon'],
  ] as const)('uses one stable artifact ID across locales for %s', (slug, artifact) => {
    const work = getVisualWork(slug);

    expect(work).toBeDefined();
    expect(Object.values(work!.locales).map((locale) => locale.artifact)).toEqual([
      artifact,
      artifact,
      artifact,
    ]);
  });
});
