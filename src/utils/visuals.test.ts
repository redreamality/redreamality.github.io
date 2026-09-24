import { describe, expect, it } from 'vitest';
import { getHomepageVisuals, getLatestVisual, getVisualWork } from './visuals';

describe('getLatestVisual', () => {
  it.each([
    ['en', '/visuals/r0-herd-immunity/', 'Even a Fierce Virus: Why Does Spread Self-Extinguish Past a Coverage Threshold?'],
    ['zh', '/cn/visuals/r0-herd-immunity/', '病毒再猛，为什么接种到某个点疫情会自己熄？'],
    ['ja', '/ja/visuals/r0-herd-immunity/', 'どんなに強いウイルスでも、接種がある閾値を超えると流行はなぜ自ら収束するのか？'],
  ] as const)('returns the newest published %s artifact', (lang, href, title) => {
    expect(getLatestVisual(lang)).toMatchObject({ slug: 'r0-herd-immunity', href, title, hasCurrentArtifact: true });
  });
});

describe('getHomepageVisuals', () => {
  it('returns every current-language artifact in newest-first order', () => {
    expect(getHomepageVisuals('en').map((visual) => visual.slug)).toEqual([
      'r0-herd-immunity',
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
    ['r0-herd-immunity', 'r0-herd-immunity'],
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
