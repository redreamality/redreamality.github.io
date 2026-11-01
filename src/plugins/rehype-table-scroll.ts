/**
 * Rehype plugin: wrap every Markdown/MDX <table> in a horizontally scrollable
 * `.content-table-scroll` region (styled in src/styles/global.css), so wide
 * tables scroll inside the article instead of widening the whole page on
 * narrow (mobile) viewports. Tables already wrapped by hand are left alone.
 */
type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

const WRAPPER_CLASS = 'content-table-scroll';

function hasWrapperClass(node: HastNode | undefined): boolean {
  if (!node || node.type !== 'element') return false;
  const cls = node.properties?.className;
  const list = Array.isArray(cls) ? cls : typeof cls === 'string' ? cls.split(/\s+/) : [];
  return list.includes(WRAPPER_CLASS);
}

function textOf(node: HastNode): string {
  if (node.type === 'text') return node.value ?? '';
  return (node.children ?? []).map(textOf).join('');
}

function headerLabel(table: HastNode): string {
  const cells: string[] = [];
  const visit = (n: HastNode) => {
    if (n.type === 'element' && n.tagName === 'th') {
      const t = textOf(n).replace(/\s+/g, ' ').trim();
      if (t) cells.push(t);
      return;
    }
    if (n.type === 'element' && n.tagName === 'tbody') return;
    (n.children ?? []).forEach(visit);
  };
  visit(table);
  const label = cells.join(' / ');
  return label.length > 120 ? `${label.slice(0, 117)}…` : label || 'Table';
}

function walk(parent: HastNode): void {
  const children = parent.children;
  if (!Array.isArray(children)) return;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.type === 'element' && child.tagName === 'table' && !hasWrapperClass(parent)) {
      children[i] = {
        type: 'element',
        tagName: 'div',
        properties: {
          className: [WRAPPER_CLASS],
          role: 'region',
          ariaLabel: headerLabel(child),
          tabIndex: 0,
        },
        children: [child],
      };
      continue; // tables are not nested in Markdown content
    }
    walk(child);
  }
}

export default function rehypeTableScroll() {
  return (tree: HastNode) => {
    walk(tree);
  };
}
