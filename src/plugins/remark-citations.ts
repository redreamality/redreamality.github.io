/**
 * Remark plugin: turn plain numeric citations (`[27]`, `[3, 5]`, `[2-4]`) into
 * superscript links to the post's reference list, and give each reference
 * entry `id="ref-N"` plus a back-link to its first citation.
 *
 * Reference section = a heading whose text matches REF_HEADING (参考 / 参考文献 /
 * 参考来源 / 参考资料 / 参考ソース / 来源 / 出典 / References / Sources / ...)
 * up to the next heading of the same or higher level. Entries inside it:
 *   - ordered list items (`1. text`; the number is read from source so split
 *     or non-1-start lists keep their real numbers)
 *   - lines starting with `[N]` (separate paragraphs, hard-break lines, or
 *     list items like `- [N] text`)
 * Citations are only converted when every number in the bracket exists as a
 * reference. Code, inline code, math, links, link references, definitions,
 * HTML and MDX expressions are never touched.
 */

type Node = {
  type: string;
  value?: string;
  depth?: number;
  start?: number | null;
  ordered?: boolean;
  url?: string;
  children?: Node[];
  position?: { start: { offset?: number }; end: { offset?: number } };
  data?: Record<string, unknown>;
};

export const REF_HEADING =
  /^(?:\d+[.、]\s*)?(?:参考(?:文献|来源|資料|资料|ソース|链接|リンク|出典)?|(?:主要|引用|資料|数据)?来源|出典|引用(?:文献|来源)?|注释与参考|(?:primary |official |further )?(?:references?|sources|bibliography|citations|works cited|notes and references))\s*$/i;

const SKIP = new Set([
  'code', 'inlineCode', 'math', 'inlineMath', 'link', 'linkReference',
  'definition', 'html', 'mdxjsEsm', 'mdxFlowExpression', 'mdxTextExpression',
  'image', 'imageReference', 'footnoteReference', 'footnoteDefinition', 'heading',
]);

const CITE_RE = /\[(\d{1,3}(?:\s*(?:[,，、;；]|[-–—~])\s*\d{1,3})*)\](?!\()/g;

function toText(n: Node): string {
  if (typeof n.value === 'string') return n.value;
  return (n.children ?? []).map(toText).join('');
}

function el(tag: string, props: Record<string, unknown>, children: Node[]): Node {
  return { type: 'citeNode', data: { hName: tag, hProperties: props }, children };
}
const text = (value: string): Node => ({ type: 'text', value });

interface RefEntry { attach: (backlink: Node) => void }

export default function remarkCitations() {
  return (tree: Node, file?: { value?: unknown }) => {
    const source = typeof file?.value === 'string' ? file.value : String(file?.value ?? '');
    const refs = new Map<number, RefEntry>();
    const refContainers = new Set<Node>();

    // ---- 1. locate reference sections (top-level and nested containers)
    const collectSections = (parent: Node) => {
      const kids = parent.children ?? [];
      for (let i = 0; i < kids.length; i++) {
        const h = kids[i];
        if (h.type !== 'heading' || !REF_HEADING.test(toText(h).trim())) continue;
        for (let j = i + 1; j < kids.length; j++) {
          const n = kids[j];
          if (n.type === 'heading' && (n.depth ?? 6) <= (h.depth ?? 1)) break;
          refContainers.add(n);
          parseRefBlock(n);
        }
      }
    };

    const addRef = (num: number, entry: RefEntry) => {
      if (!refs.has(num)) refs.set(num, entry);
    };

    const parseRefBlock = (n: Node) => {
      if (n.type === 'list') {
        (n.children ?? []).forEach((item, idx) => {
          const first = item.children?.[0];
          // `- [N] text` / `1. [N] text`: bracket label wins
          if (first?.type === 'paragraph' && /^\s*\[\d+\]/.test(firstText(first))) {
            parseRefParagraph(first);
            return;
          }
          if (!n.ordered) return;
          let num = (n.start ?? 1) + idx;
          const off = item.position?.start.offset;
          if (source && off != null) {
            const m = /^\s*(\d+)[.)]/.exec(source.slice(off, off + 12));
            if (m) num = Number(m[1]);
          }
          item.data = { ...(item.data ?? {}), hProperties: { id: `ref-${num}`, className: ['ref-entry'] } };
          addRef(num, {
            attach: (bl) => {
              const last = item.children?.[item.children.length - 1];
              if (last && last.type === 'paragraph') last.children!.push(text(' '), bl);
              else item.children!.push(bl);
            },
          });
        });
      } else if (n.type === 'paragraph') {
        parseRefParagraph(n);
      } else if (n.type === 'blockquote' || n.type === 'containerDirective') {
        (n.children ?? []).forEach(parseRefBlock);
      }
    };

    const firstText = (p: Node) => {
      const c = p.children?.[0];
      return c?.type === 'text' ? c.value ?? '' : '';
    };

    // Split a paragraph into lines (text "\n" or `break` nodes); wrap every
    // line that starts with `[N]` in <span id="ref-N" class="ref-entry">.
    const parseRefParagraph = (p: Node) => {
      const lines: Node[][] = [[]];
      const seps: Node[] = [];
      for (const c of p.children ?? []) {
        if (c.type === 'break') { seps.push(c); lines.push([]); continue; }
        if (c.type === 'text' && c.value!.includes('\n')) {
          const parts = c.value!.split('\n');
          parts.forEach((part, k) => {
            if (k > 0) { seps.push(text('\n')); lines.push([]); }
            if (part) lines[lines.length - 1].push(text(part));
          });
          continue;
        }
        lines[lines.length - 1].push(c);
      }
      let found = false;
      const out: Node[] = [];
      lines.forEach((line, k) => {
        const head = line[0];
        const m = head?.type === 'text' ? /^(\s*)\[(\d+)\]/.exec(head.value!) : null;
        if (m && !refs.has(Number(m[2]))) {
          found = true;
          const num = Number(m[2]);
          const span = el('span', { id: `ref-${num}`, className: ['ref-entry'] }, line);
          addRef(num, { attach: (bl) => span.children!.push(text(' '), bl) });
          out.push(span);
        } else out.push(...line);
        if (k < seps.length) out.push(seps[k]);
      });
      if (found) p.children = out;
    };

    collectSections(tree);
    if (refs.size === 0) return;

    // ---- 2. convert citations in body text
    const counts = new Map<number, number>();
    const citeLink = (num: number, label: string): Node => {
      const k = (counts.get(num) ?? 0) + 1;
      counts.set(num, k);
      return {
        type: 'link',
        url: `#ref-${num}`,
        data: { hProperties: { id: `cite-${num}-${k}` } },
        children: [text(label)],
      };
    };

    const convert = (raw: string): Node | null => {
      const parts = raw.split(/\s*([,，、;；]|[-–—~])\s*/);
      const nums: number[] = [];
      const ops: string[] = [];
      parts.forEach((p, i) => (i % 2 ? ops.push(p) : nums.push(Number(p))));
      if (!nums.every((n) => refs.has(n))) return null;
      if (nums.length === 1) {
        return el('sup', { className: ['cite'] }, [citeLink(nums[0], `[${nums[0]}]`)]);
      }
      const kids: Node[] = [text('[')];
      nums.forEach((n, i) => {
        if (i > 0) kids.push(text(/[-–—~]/.test(ops[i - 1]) ? '–' : ', '));
        kids.push(citeLink(n, String(n)));
      });
      kids.push(text(']'));
      return el('sup', { className: ['cite'] }, kids);
    };

    const walk = (node: Node) => {
      if (SKIP.has(node.type) || refContainers.has(node) || !node.children) return;
      const next: Node[] = [];
      for (const c of node.children) {
        if (c.type !== 'text') { walk(c); next.push(c); continue; }
        const v = c.value!;
        let last = 0;
        let changed = false;
        for (const m of v.matchAll(CITE_RE)) {
          const repl = convert(m[1]);
          if (!repl) continue;
          // drop a single space before the cite ("text [3]" -> "text[3]")
          let end = m.index!;
          if (end > last && v[end - 1] === ' ') end -= 1;
          if (end > last) next.push(text(v.slice(last, end)));
          next.push(repl);
          last = m.index! + m[0].length;
          changed = true;
        }
        if (!changed) next.push(c);
        else if (last < v.length) next.push(text(v.slice(last)));
      }
      node.children = next;
    };
    walk(tree);

    // ---- 3. back-links on cited entries
    for (const [num, entry] of refs) {
      if (!counts.has(num)) continue;
      entry.attach({
        type: 'link',
        url: `#cite-${num}-1`,
        data: { hProperties: { className: ['ref-backlink'], ariaLabel: `Back to citation ${num}` } },
        children: [text('↩')],
      });
    }
  };
}
