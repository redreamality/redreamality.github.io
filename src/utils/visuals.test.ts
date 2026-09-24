import { describe, expect, it } from 'vitest';
import { getHomepageVisuals, getLatestVisual, getVisualWork } from './visuals';

describe('getLatestVisual', () => {
  it.each([
    ['en', '/visuals/bayes-lab-result/', 'Same Lab Result—Why Do Two People Reach Opposite Conclusions?'],
    ['zh', '/cn/visuals/bayes-lab-result/', '同一张化验单，为什么两人结论相反？'],
    ['ja', '/ja/visuals/bayes-lab-result/', '同じ検査結果なのに、なぜ二人の結論は真逆なのか？'],
  ] as const)('returns the newest published %s artifact', (lang, href, title) => {
    expect(getLatestVisual(lang)).toMatchObject({ slug: 'bayes-lab-result', href, title, hasCurrentArtifact: true });
  });
});

describe('getHomepageVisuals', () => {
  it('returns every current-language artifact in newest-first order', () => {
    expect(getHomepageVisuals('en').map((visual) => visual.slug)).toEqual([
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
