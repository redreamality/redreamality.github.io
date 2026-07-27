import { describe, expect, it } from 'vitest';
import { getLatestVisual, getVisualWork } from './visuals';

describe('getLatestVisual', () => {
  it.each([
    ['en', '/visuals/air-conditioner/', 'How Air Conditioners Work'],
    ['zh', '/cn/visuals/air-conditioner/', '空调的工作原理'],
    ['ja', '/ja/visuals/air-conditioner/', 'エアコンの仕組み'],
  ] as const)('returns the newest published %s artifact', (lang, href, title) => {
    expect(getLatestVisual(lang)).toMatchObject({ slug: 'air-conditioner', href, title, hasCurrentArtifact: true });
  });
});

describe('visual artifact registration', () => {
  it.each([
    ['air-conditioner', 'air-conditioner'],
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
