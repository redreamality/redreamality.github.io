import { describe, expect, it } from 'vitest';
import { getHomepageVisuals, getLatestVisual, getVisualWork } from './visuals';

describe('getLatestVisual', () => {
  it.each([
    ['en', '/visuals/normal-distribution/', 'In a World of "About Average," Why Do Extremes Keep Showing Up?'],
    ['zh', '/cn/visuals/normal-distribution/', '为什么「差不多平均」的世界里，极端值总出现？'],
    ['ja', '/ja/visuals/normal-distribution/', '「だいたい平均」の世界で、なぜ極端な値はいつも現れるのか？'],
  ] as const)('returns the newest published %s artifact', (lang, href, title) => {
    expect(getLatestVisual(lang)).toMatchObject({ slug: 'normal-distribution', href, title, hasCurrentArtifact: true });
  });
});

describe('getHomepageVisuals', () => {
  it('returns every current-language artifact in newest-first order', () => {
    expect(getHomepageVisuals('en').map((visual) => visual.slug)).toEqual([
      'normal-distribution',
      'bayes-lab-result',
      'compound-interest',
      'inflation-purchasing-power',
      'butterfly-effect',
      'prisoners-dilemma',
      'enso-food-prices',
      'price-volume-relationship',
      'air-conditioner',
      'loop-engineering',
      'typhoon',
    ]);
    expect(getHomepageVisuals('en').every((visual) => visual.hasCurrentArtifact)).toBe(true);
  });
});

describe('visual artifact registration', () => {
  it.each([
    ['air-conditioner', 'air-conditioner'],
    ['loop-engineering', 'loop-engineering'],
    ['price-volume-relationship', 'price-volume-relationship'],
    ['typhoon', 'typhoon'],
    ['enso-food-prices', 'enso-food-prices'],
    ['prisoners-dilemma', 'prisoners-dilemma'],
    ['butterfly-effect', 'butterfly-effect'],
    ['inflation-purchasing-power', 'inflation-purchasing-power'],
    ['compound-interest', 'compound-interest'],
    ['bayes-lab-result', 'bayes-lab-result'],
    ['normal-distribution', 'normal-distribution'],
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
