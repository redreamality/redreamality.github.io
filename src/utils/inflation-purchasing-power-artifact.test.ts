import postcss from 'postcss';
import { describe, expect, it } from 'vitest';
import { getInflationPurchasingPowerArtifactFragment } from './inflation-purchasing-power-artifact';

describe('getInflationPurchasingPowerArtifactFragment', () => {
  it('keeps inflation-purchasing-power styles scoped and removes standalone site chrome', () => {
    const artifact = getInflationPurchasingPowerArtifactFragment('en', []);

    const stylesheet = postcss.parse(artifact.style);
    stylesheet.walkRules((rule) => {
      if (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
      for (const selector of rule.selectors) {
        expect(selector.trim()).toMatch(/^(?:\.inflation-purchasing-power-visual|\.dark \.inflation-purchasing-power-visual)(?:\b|[\s.:#[>+~])/);
      }
    });
    expect(artifact.body).not.toContain('class="site-header"');
    expect(artifact.body).not.toContain('<main id="article">');
    expect(artifact.body).toContain('When more money');
    expect(artifact.body).toContain('data-demo="inf-overview"');
    expect(artifact.body).toContain('data-demo="inf-relative"');
    expect(artifact.body).toContain('Nominal units can multiply while real claims on goods thin out');
  });
});
