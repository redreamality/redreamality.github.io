import postcss from 'postcss';
import { describe, expect, it } from 'vitest';
import { getAirConditionerArtifactFragment } from './air-conditioner-artifact';

describe('getAirConditionerArtifactFragment', () => {
  it('keeps Air Conditioner styles scoped and removes standalone site chrome', () => {
    const artifact = getAirConditionerArtifactFragment('en', []);

    const stylesheet = postcss.parse(artifact.style);
    stylesheet.walkRules((rule) => {
      if (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
      for (const selector of rule.selectors) {
        expect(selector.trim()).toMatch(/^(?:\.air-conditioner-visual|\.dark \.air-conditioner-visual)(?:\b|[\s.:#[>+~])/);
      }
    });
    expect(artifact.body).not.toContain('class="site-header"');
    expect(artifact.body).not.toContain('<main id="article">');
    expect(artifact.body).toContain('<h1>How air conditioning moves heat</h1>');
    expect(artifact.body).toContain('data-demo="ac-cycle-overview"');
    expect(artifact.body).toContain('data-demo="ac-energy-ledger"');
    expect(artifact.body).toContain('Cooling works when every heat-transfer path stays open');
  });
});
