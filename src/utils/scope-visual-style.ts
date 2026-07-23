import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

export function scopeVisualStyle(source: string, rootClass: string, appendedStyle = ''): string {
  const stylesheet = postcss.parse(source);
  const prefixSelectors = selectorParser((selectors) => {
    selectors.each((selector) => {
      const first = selector.nodes[0];
      const targetsRoot =
        (first?.type === 'pseudo' && first.value === ':root') ||
        (first?.type === 'tag' && (first.value === 'html' || first.value === 'body'));

      if (targetsRoot) {
        first.replaceWith(selectorParser.className({ value: rootClass }));
        return;
      }

      selector.prepend(selectorParser.combinator({ value: ' ' }));
      selector.prepend(selectorParser.className({ value: rootClass }));
    });
  });

  stylesheet.walkRules((rule) => {
    if (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
    rule.selector = prefixSelectors.processSync(rule.selector);
  });

  return `${stylesheet.toString()}${appendedStyle ? `\n${appendedStyle}` : ''}`;
}
