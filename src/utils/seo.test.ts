import { describe, expect, it } from 'vitest';
import {
  resolveDocumentTitle,
  resolveMetaDescription,
  truncateTitle,
  SEO_TITLE_MAX,
  SEO_DESC_TARGET_MIN,
  SEO_DESC_TARGET_MAX,
} from './seo';

describe('truncateTitle', () => {
  it('leaves short titles alone', () => {
    expect(truncateTitle('Hello world')).toBe('Hello world');
  });

  it('cuts on word boundaries under the max', () => {
    const long =
      'Anthropic Claude Code Review: Multi-Agent AI Systems Are Now Reviewing Your Pull Requests';
    const out = truncateTitle(long, 70);
    expect(out.length).toBeLessThanOrEqual(70);
    expect(out).not.toMatch(/\s$/);
  });
});

describe('resolveDocumentTitle', () => {
  it('appends brand for mid-length titles', () => {
    const out = resolveDocumentTitle('OpenSpec Tutorial: CLI Commands and Agents.md', 'en');
    expect(out).toBe('OpenSpec Tutorial: CLI Commands and Agents.md | Redreamality');
    expect(out.length).toBeLessThanOrEqual(SEO_TITLE_MAX);
  });

  it('adds a topic hint when still short after branding', () => {
    const out = resolveDocumentTitle('谁养鱼', 'zh');
    expect(out).toContain('Redreamality');
    expect(out.length).toBeGreaterThanOrEqual(20);
    expect(out.length).toBeLessThanOrEqual(SEO_TITLE_MAX);
  });

  it('can borrow a description snippet for very short CJK titles', () => {
    const out = resolveDocumentTitle('谁养鱼', 'zh', SEO_TITLE_MAX, {
      description: '使用 Python 解决经典的谁养鱼逻辑谜题，并说明约束满足与回溯搜索。',
    });
    expect(out).toContain('谁养鱼');
    expect(out).toContain('Redreamality');
    expect(out.length).toBeGreaterThanOrEqual(45);
    expect(out.length).toBeLessThanOrEqual(SEO_TITLE_MAX);
  });

  it('does not double-brand listing titles', () => {
    const listing = 'AI Agents & Software Development Blog | Redreamality';
    expect(resolveDocumentTitle(listing, 'en')).toBe(listing);
  });

  it('caps long titles at 70 without brand', () => {
    const long =
      'The Agentic Shift: Ralph Wiggum Loop vs Open Spec Methodologies in Autonomous Software Engineering';
    const out = resolveDocumentTitle(long, 'en');
    expect(out.length).toBeLessThanOrEqual(SEO_TITLE_MAX);
    expect(out).not.toContain('Redreamality');
  });
});

describe('resolveMetaDescription', () => {
  it('leaves adequate descriptions alone', () => {
    const desc = 'A'.repeat(155);
    expect(resolveMetaDescription(desc, 'Title', 'en')).toBe(desc);
  });

  it('expands thin descriptions into the 150–160 window', () => {
    const out = resolveMetaDescription('短描述测试', '谁养鱼', 'zh');
    expect(out.length).toBeGreaterThanOrEqual(SEO_DESC_TARGET_MIN - 10);
    expect(out.length).toBeLessThanOrEqual(SEO_DESC_TARGET_MAX);
    expect(out).toContain('Redreamality');
  });

  it('expands English thin descriptions without inventing article claims', () => {
    const out = resolveMetaDescription('Set PYTHONPATH on Windows.', 'PYTHONPATH Guide', 'en');
    expect(out.startsWith('Set PYTHONPATH on Windows.')).toBe(true);
    expect(out.length).toBeGreaterThanOrEqual(SEO_DESC_TARGET_MIN - 5);
    expect(out.length).toBeLessThanOrEqual(SEO_DESC_TARGET_MAX);
  });
});
