import { describe, expect, it } from 'vitest';
import remarkDemoteH1 from './remark-demote-h1';

describe('remarkDemoteH1', () => {
  it('demotes depth-1 headings to depth 2', () => {
    const tree = {
      type: 'root',
      children: [
        { type: 'heading', depth: 1, children: [] },
        { type: 'heading', depth: 2, children: [] },
        {
          type: 'blockquote',
          children: [{ type: 'heading', depth: 1, children: [] }],
        },
      ],
    };
    remarkDemoteH1()(tree);
    expect(tree.children[0].depth).toBe(2);
    expect(tree.children[1].depth).toBe(2);
    expect(tree.children[2].children[0].depth).toBe(2);
  });
});
