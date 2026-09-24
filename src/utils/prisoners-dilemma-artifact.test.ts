import postcss from 'postcss';
import { describe, expect, it } from 'vitest';
import { getPrisonersDilemmaArtifactFragment } from './prisoners-dilemma-artifact';

describe('getPrisonersDilemmaArtifactFragment', () => {
  it('keeps prisoners-dilemma styles scoped and removes standalone site chrome', () => {
    const artifact = getPrisonersDilemmaArtifactFragment('en', []);

    const stylesheet = postcss.parse(artifact.style);
    stylesheet.walkRules((rule) => {
      if (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
      for (const selector of rule.selectors) {
        expect(selector.trim()).toMatch(/^(?:\.prisoners-dilemma-visual|\.dark \.prisoners-dilemma-visual)(?:\b|[\s.:#[>+~])/);
      }
    });
    expect(artifact.body).not.toContain('class="site-header"');
    expect(artifact.body).not.toContain('<main id="article">');
    expect(artifact.body).toContain('<h1>Why two people who want less jail time both get more</h1>');
    expect(artifact.body).toContain('data-demo="pd-overview"');
    expect(artifact.body).toContain('data-demo="pd-repeat"');
    expect(artifact.body).toContain('Private best replies can stack into a shared loss');
  });
});
