import { describe, expect, it } from 'vitest';
import { getHomepageVisuals, getLatestVisual, getVisualWork } from './visuals';

describe('getLatestVisual', () => {
  it.each([
    ['en', '/visuals/compound-interest/', '0.1% Extra a Day—How Far Ahead Are You in a Year?'],
    ['zh', '/cn/visuals/compound-interest/', '每天多赚 0.1%，一年后你会差多少？'],
    ['ja', '/ja/visuals/compound-interest/', '毎日0.1%多く増やすと、一年後どれだけ差がつく？'],
  ] as const)('returns the newest published %s artifact', (lang, href, title) => {
    expect(getLatestVisual(lang)).toMatchObject({ slug: 'compound-interest', href, title, hasCurrentArtifact: true });
  });
});

describe('getHomepageVisuals', () => {
  it('returns every current-language artifact in newest-first order', () => {
    expect(getHomepageVisuals('en').map((visual) => visual.slug)).toEqual([
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
