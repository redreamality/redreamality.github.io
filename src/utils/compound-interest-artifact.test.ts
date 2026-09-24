import postcss from 'postcss';
import { describe, expect, it } from 'vitest';
import { getCompoundInterestArtifactFragment } from './compound-interest-artifact';

describe('getCompoundInterestArtifactFragment', () => {
  it('keeps compound-interest styles scoped and removes standalone site chrome', () => {
    const artifact = getCompoundInterestArtifactFragment('en', []);

    const stylesheet = postcss.parse(artifact.style);
    stylesheet.walkRules((rule) => {
      if (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
      for (const selector of rule.selectors) {
        expect(selector.trim()).toMatch(/^(?:\.compound-interest-visual|\.dark \.compound-interest-visual)(?:\b|[\s.:#[>+~])/);
      }
    });
    expect(artifact.body).not.toContain('class="site-header"');
    expect(artifact.body).not.toContain('<main id="article">');
    expect(artifact.body).toContain('0.1% extra a day');
    expect(artifact.body).toContain('data-demo="ci-overview"');
    expect(artifact.body).toContain('data-demo="ci-paths"');
    expect(artifact.body).toContain('Compounding is multiplication over time');
  });
});
