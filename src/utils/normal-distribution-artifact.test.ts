import postcss from 'postcss';
import { describe, expect, it } from 'vitest';
import { getNormalDistributionArtifactFragment } from './normal-distribution-artifact';

describe('getNormalDistributionArtifactFragment', () => {
  it('keeps normal-distribution styles scoped and removes standalone site chrome', () => {
    const artifact = getNormalDistributionArtifactFragment('en', []);

    const stylesheet = postcss.parse(artifact.style);
    stylesheet.walkRules((rule) => {
      if (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
      for (const selector of rule.selectors) {
        expect(selector.trim()).toMatch(/^(?:\.normal-distribution-visual|\.dark \.normal-distribution-visual)(?:\b|[\s.:#[>+~])/);
      }
    });
    expect(artifact.body).not.toContain('class="site-header"');
    expect(artifact.body).not.toContain('<main id="article">');
    expect(artifact.body).toContain('about average');
    expect(artifact.body).toContain('data-demo="nd-overview"');
    expect(artifact.body).toContain('data-demo="nd-tails"');
    expect(artifact.body).toContain('68');
  });
});
