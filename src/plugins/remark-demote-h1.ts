/**
 * Remark plugin: demote markdown H1 nodes to H2.
 *
 * Page templates already render frontmatter `title` as the sole page H1.
 * Content files that start with `# Heading` would otherwise create duplicate H1s
 * (a Bing/Google SEO issue). Demoting at parse time also keeps Astro's
 * `headings` TOC metadata consistent (depth 2 instead of 1).
 */
type MdastNode = {
  type: string;
  depth?: number;
  children?: MdastNode[];
};

function walk(node: MdastNode, visit: (n: MdastNode) => void): void {
  visit(node);
  if (Array.isArray(node.children)) {
    for (const child of node.children) walk(child, visit);
  }
}

export default function remarkDemoteH1() {
  return (tree: MdastNode) => {
    walk(tree, (node) => {
      if (node.type === 'heading' && node.depth === 1) {
        node.depth = 2;
      }
    });
  };
}
