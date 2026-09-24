import postcss from 'postcss';
import { describe, expect, it } from 'vitest';
import { getEnsoFoodPricesArtifactFragment } from './enso-food-prices-artifact';

describe('getEnsoFoodPricesArtifactFragment', () => {
  it('keeps ENSO food-prices styles scoped and removes standalone site chrome', () => {
    const artifact = getEnsoFoodPricesArtifactFragment('en', []);

    const stylesheet = postcss.parse(artifact.style);
    stylesheet.walkRules((rule) => {
      if (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
      for (const selector of rule.selectors) {
        expect(selector.trim()).toMatch(/^(?:\.enso-food-prices-visual|\.dark \.enso-food-prices-visual)(?:\b|[\s.:#[>+~])/);
      }
    });
    expect(artifact.body).not.toContain('class="site-header"');
    expect(artifact.body).not.toContain('<main id="article">');
    expect(artifact.body).toContain('<h1>Why Pacific warming shows up in grocery prices</h1>');
    expect(artifact.body).toContain('data-demo="enso-overview"');
    expect(artifact.body).toContain('data-demo="enso-not-typhoon"');
    expect(artifact.body).toContain('Grocery prices feel ENSO when heat, rain, harvests, and freight line up');
  });
});
