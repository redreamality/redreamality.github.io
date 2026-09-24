import postcss from 'postcss';
import { describe, expect, it } from 'vitest';
import { getBayesLabResultArtifactFragment } from './bayes-lab-result-artifact';

describe('getBayesLabResultArtifactFragment', () => {
  it('keeps bayes-lab-result styles scoped and removes standalone site chrome', () => {
    const artifact = getBayesLabResultArtifactFragment('en', []);

    const stylesheet = postcss.parse(artifact.style);
    stylesheet.walkRules((rule) => {
      if (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
      for (const selector of rule.selectors) {
        expect(selector.trim()).toMatch(/^(?:\.bayes-lab-result-visual|\.dark \.bayes-lab-result-visual)(?:\b|[\s.:#[>+~])/);
      }
    });
    expect(artifact.body).not.toContain('class="site-header"');
    expect(artifact.body).not.toContain('<main id="article">');
    expect(artifact.body).toContain('Same lab result');
    expect(artifact.body).toContain('data-demo="bayes-overview"');
    expect(artifact.body).toContain('data-demo="bayes-contrast"');
    expect(artifact.body).toContain('Posterior = prior');
  });
});
