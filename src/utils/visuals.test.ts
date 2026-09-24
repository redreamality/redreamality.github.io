import { describe, expect, it } from 'vitest';
import { getHomepageVisuals, getLatestVisual, getVisualWork } from './visuals';

describe('getLatestVisual', () => {
  it.each([
    ['en', '/visuals/enso-food-prices/', 'Why Pacific Warming Shows Up in Grocery Prices'],
    ['zh', '/cn/visuals/enso-food-prices/', '太平洋变暖，为什么你家菜价先涨？'],
    ['ja', '/ja/visuals/enso-food-prices/', '太平洋が暖まると、なぜ食卓の値段が先に上がるのか'],
  ] as const)('returns the newest published %s artifact', (lang, href, title) => {
    expect(getLatestVisual(lang)).toMatchObject({ slug: 'enso-food-prices', href, title, hasCurrentArtifact: true });
  });
});

describe('getHomepageVisuals', () => {
  it('returns every current-language artifact in newest-first order', () => {
    expect(getHomepageVisuals('en').map((visual) => visual.slug)).toEqual([
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
