import { describe, expect, it } from 'vitest';
import { getHomepageVisuals, getLatestVisual, getVisualWork } from './visuals';

describe('getLatestVisual', () => {
  it.each([
    ['en', '/visuals/inflation-purchasing-power/', 'When More Money Is Printed, Why Does Your Pocket Feel Thinner?'],
    ['zh', '/cn/visuals/inflation-purchasing-power/', '钱印多了，为什么你口袋里的反而更薄？'],
    ['ja', '/ja/visuals/inflation-purchasing-power/', 'お金を刷れば刷るほど、なぜ懐は薄くなるのか？'],
  ] as const)('returns the newest published %s artifact', (lang, href, title) => {
    expect(getLatestVisual(lang)).toMatchObject({ slug: 'inflation-purchasing-power', href, title, hasCurrentArtifact: true });
  });
});

describe('getHomepageVisuals', () => {
  it('returns every current-language artifact in newest-first order', () => {
    expect(getHomepageVisuals('en').map((visual) => visual.slug)).toEqual([
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
