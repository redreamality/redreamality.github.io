import postcss from 'postcss';
import { describe, expect, it } from 'vitest';
import { getLoopEngineeringArtifactFragment } from './loop-engineering-artifact';

describe('getLoopEngineeringArtifactFragment', () => {
  it('keeps Loop Engineering styles scoped and removes standalone site chrome', () => {
    const artifact = getLoopEngineeringArtifactFragment('en', []);

    const stylesheet = postcss.parse(artifact.style);
    stylesheet.walkRules((rule) => {
      if (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
      for (const selector of rule.selectors) {
        expect(selector.trim()).toMatch(/^(?:\.loop-engineering-visual|\.dark \.loop-engineering-visual)(?:\b|[\s.:#[>+~])/);
      }
    });
    expect(artifact.body).not.toContain('class="site-header"');
    expect(artifact.body).not.toContain('<main id="article">');
    expect(artifact.body).toContain('<h1>Loop Engineering</h1>');
    expect(artifact.body).toContain('data-demo="outer-loop"');
    expect(artifact.body).toContain('data-demo="evidence-gate"');
    expect(artifact.body).toContain('Who decides whether the work is done?');
  });
});
