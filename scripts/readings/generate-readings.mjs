import fs from 'fs';
import path from 'path';

const DEFAULT_INDEX_PATH = 'src/pages/readings/index.mdx';
const DEFAULT_CN_INDEX_PATH = 'src/pages/cn/readings/index.mdx';

const args = new Set(process.argv.slice(2));
const force = args.has('--force');
const onlyMissing = !args.has('--all');

const maxArg = process.argv.find((a) => a.startsWith('--max='));
const maxItems = maxArg ? Number(maxArg.split('=')[1]) : Infinity;

const indexPath = process.env.READINGS_INDEX_PATH || DEFAULT_INDEX_PATH;
const cnIndexPath = process.env.READINGS_CN_INDEX_PATH || DEFAULT_CN_INDEX_PATH;

const LLM_CONFIG = {
  apiBase: process.env.OPENAI_API_BASE || 'https://gateway.chat.sensedeal.vip/v1',
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.MODEL || 'qwen2.5-32b-instruct-int4',
};

const hasLLM = Boolean(LLM_CONFIG.apiKey);

function splitFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: '', body: markdown };
  return { frontmatter: match[1], body: match[2] };
}

function parseTableRow(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return null;
  const cells = trimmed
    .slice(1, -1)
    .split('|')
    .map((c) => c.trim());
  return cells;
}

function isSeparatorRow(cells) {
  return cells.every((c) => /^:?-{3,}:?$/.test(c) || c === '---');
}

function extractMarkdownLinkText(text) {
  const match = text.match(/\[([^\]]+)\]\([^\)]+\)/);
  if (match) return match[1];

  const bracketOnly = text.match(/\[([^\]]+)\]/);
  if (bracketOnly) return bracketOnly[1];

  return text;
}

function extractMarkdownLinkUrl(text) {
  const match = text.match(/\[[^\]]+\]\(([^\)]+)\)/);
  if (match) return match[1];
  return text;
}

function normalizeTags(tagsCell) {
  const cleaned = tagsCell
    .replace(/\s+/g, ' ')
    .replace(/^\[|\]$/g, '')
    .trim();

  if (!cleaned) return [];

  return cleaned
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.replace(/^#/, ''));
}

function toIsoDate(dateString) {
  const trimmed = dateString.trim();
  if (!trimmed) return new Date().toISOString();

  const date = new Date(trimmed);
  if (!Number.isNaN(date.valueOf())) return date.toISOString();

  const ymd = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) {
    const date2 = new Date(`${ymd[1]}-${ymd[2]}-${ymd[3]}T00:00:00.000Z`);
    if (!Number.isNaN(date2.valueOf())) return date2.toISOString();
  }

  return new Date().toISOString();
}

function yamlSingleQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function buildFrontmatter({ title, description, pubDate, url, tags, lang, translatedFrom }) {
  const lines = [
    '---',
    `title: ${yamlSingleQuote(title)}`,
    `description: ${yamlSingleQuote(description)}`,
    `pubDate: ${pubDate}`,
    `url: ${yamlSingleQuote(url)}`,
  ];

  if (tags?.length) {
    const tagsString = tags.map((t) => yamlSingleQuote(t)).join(', ');
    lines.push(`tags: [${tagsString}]`);
  }

  if (lang) lines.push(`lang: ${yamlSingleQuote(lang)}`);
  if (translatedFrom) lines.push(`translatedFrom: ${yamlSingleQuote(translatedFrom)}`);

  lines.push('---');
  return lines.join('\n');
}

async function fetchReadableContent(url) {
  const candidates = [
    `https://r.jina.ai/${url}`,
    url,
  ];

  for (const candidateUrl of candidates) {
    try {
      const res = await fetch(candidateUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ReadingsBot/1.0)',
          Accept: 'text/plain,text/html;q=0.9,*/*;q=0.8',
        },
      });

      if (!res.ok) continue;
      const text = await res.text();
      if (!text.trim()) continue;

      return text;
    } catch {
      // ignore and continue
    }
  }

  return '';
}

async function chat(messages, { temperature = 0.3, max_tokens = 3000 } = {}) {
  if (!hasLLM) {
    throw new Error('OPENAI_API_KEY is missing');
  }

  const res = await fetch(`${LLM_CONFIG.apiBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LLM_CONFIG.apiKey}`,
      'User-Agent': 'Mozilla/5.0 (compatible; ReadingsBot/1.0)',
    },
    body: JSON.stringify({
      model: LLM_CONFIG.model,
      messages,
      temperature,
      max_tokens,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LLM API error: ${res.status} ${res.statusText} - ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim();
}

function tryParseJson(text) {
  if (!text) return null;
  const cleaned = text.replace(/```json\n?|```\n?/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function generateEnglishNote({ title, url, tags, pubDateISO }) {
  if (!hasLLM) {
    return {
      title,
      description: `Reading note for: ${title}`,
      tags,
      markdown: `## Links\n\n- Source: <${url}>\n\n> Note: this entry is a placeholder because \`OPENAI_API_KEY\` is not configured for the generation workflow.`,
    };
  }

  const readable = await fetchReadableContent(url);
  const clipped = readable.slice(0, 20000);

  const system =
    'You are a technical writer. Produce concise, structured reading notes in Markdown.';

  const user = `Turn the following web page into a Markdown reading note.

Requirements:
- Output JSON only.
- JSON schema: { "description": string, "tags": string[], "markdown": string }
- description: <= 160 characters.
- markdown: Use headings and bullet points. Avoid copying long passages.

Page title: ${title}
Page URL: ${url}
Existing tags: ${tags.join(', ')}
Saved date: ${pubDateISO}

Content:\n${clipped}`;

  const resultText = await chat(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    { temperature: 0.2, max_tokens: 2500 }
  );

  const parsed = tryParseJson(resultText);
  if (parsed && parsed.description && parsed.markdown) {
    return {
      title,
      description: String(parsed.description),
      tags: Array.isArray(parsed.tags) && parsed.tags.length ? parsed.tags : tags,
      markdown: String(parsed.markdown),
    };
  }

  const fallbackMarkdown = resultText || `## Links\n\n- Source: <${url}>`;
  return {
    title,
    description: `Reading note for: ${title}`,
    tags,
    markdown: fallbackMarkdown,
  };
}

async function translateJsonMetadataToZh({ title, description, tags }) {
  if (!hasLLM) {
    return {
      title,
      description,
      tags,
    };
  }

  const system = 'You are a professional translator. Translate JSON values only.';
  const user = `Translate the following JSON from English to Chinese.

Return JSON only. Keep the same keys.

${JSON.stringify({ title, description, tags })}`;

  const resultText = await chat(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    { temperature: 0.2, max_tokens: 800 }
  );

  const parsed = tryParseJson(resultText);
  if (parsed && parsed.title && parsed.description) {
    return {
      title: String(parsed.title),
      description: String(parsed.description),
      tags: Array.isArray(parsed.tags) ? parsed.tags : tags,
    };
  }

  return {
    title,
    description,
    tags,
  };
}

async function translateMarkdownToZh(markdown) {
  if (!hasLLM) return markdown;

  const system =
    'You are a professional translator. Translate Markdown from English to Chinese while preserving all Markdown structure.';

  const user = `Translate the following Markdown to Chinese.

IMPORTANT:
- Preserve headings, lists, links, code blocks, and formatting.
- Return Markdown only.

${markdown}`;

  return chat(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    { temperature: 0.2, max_tokens: 3000 }
  );
}

function parseBookmarksFromIndex(indexMarkdown) {
  const { body } = splitFrontmatter(indexMarkdown);
  const lines = body.split(/\r?\n/);

  const headerLineIndex = lines.findIndex((line) => {
    const cells = parseTableRow(line);
    if (!cells) return false;
    return cells.some((c) => c.toLowerCase() === 'slug') && cells.some((c) => c.toLowerCase() === 'title');
  });

  if (headerLineIndex === -1) {
    throw new Error(`Cannot find bookmarks table header in ${indexPath}`);
  }

  const headerCells = parseTableRow(lines[headerLineIndex]);
  if (!headerCells) throw new Error('Invalid table header');

  const headerMap = headerCells.map((c) => c.toLowerCase());

  const rows = [];
  for (let i = headerLineIndex + 1; i < lines.length; i += 1) {
    const rowCells = parseTableRow(lines[i]);
    if (!rowCells) break;
    if (isSeparatorRow(rowCells)) continue;

    const record = {};
    for (let j = 0; j < headerMap.length; j += 1) {
      record[headerMap[j]] = rowCells[j] ?? '';
    }
    rows.push(record);

    if (rows.length >= maxItems) break;
  }

  return rows
    .map((r) => {
      const slug = (r.slug || '').trim();
      if (!slug) return null;

      const titleCell = r.title || '';
      const title = extractMarkdownLinkText(titleCell).trim() || slug;

      const sourceCell = r.source || r.url || '';
      const url = extractMarkdownLinkUrl(sourceCell).trim();

      const tags = normalizeTags(r.tags || '');
      const pubDateISO = toIsoDate(r.added || r.date || '');

      return {
        slug,
        title,
        url,
        tags,
        pubDateISO,
      };
    })
    .filter(Boolean);
}

function buildReadingMarkdown({ lang, note, bookmark }) {
  const fm = buildFrontmatter({
    title: note.title,
    description: note.description,
    pubDate: bookmark.pubDateISO,
    url: bookmark.url,
    tags: note.tags,
    lang,
    translatedFrom: lang === 'zh' ? bookmark.slug : undefined,
  });

  return `${fm}\n\n${note.markdown}\n`;
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeIfChanged(filePath, content) {
  if (fs.existsSync(filePath)) {
    const current = fs.readFileSync(filePath, 'utf8');
    if (current === content) return false;
  }

  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

function generateChineseIndex(bookmarks) {
  const header = `---\nlayout: ../../../layouts/MarkdownPageLayout.astro\ntitle: '阅读收藏'\ndescription: '我收藏的网页链接，以及自动生成的中英文笔记。'\n---\n\n<!-- AUTO-GENERATED: do not edit this file directly. Edit \/readings\/index.mdx instead. -->\n\n这里用于存放我收藏的网页链接。\n\n## 收藏列表\n\n| Slug | 标题 | 原文 | 标签 | 添加日期 |\n| --- | --- | --- | --- | --- |\n`;

  const rows = bookmarks
    .map((b) => {
      const title = `[${b.title}](/cn/readings/${b.slug})`;
      const tags = b.tags.join(', ');
      const date = b.pubDateISO.slice(0, 10);
      return `| ${b.slug} | ${title} | ${b.url} | ${tags} | ${date} |`;
    })
    .join('\n');

  return `${header}${rows}\n`;
}

async function main() {
  console.log('📚 Generating readings…');
  console.log(`- index: ${indexPath}`);
  console.log(`- force: ${force}`);
  console.log(`- onlyMissing: ${onlyMissing}`);
  console.log(`- maxItems: ${Number.isFinite(maxItems) ? maxItems : '∞'}`);
  console.log(`- LLM: ${hasLLM ? 'enabled' : 'disabled (OPENAI_API_KEY missing)'}`);

  const indexRaw = fs.readFileSync(indexPath, 'utf8');
  const bookmarks = parseBookmarksFromIndex(indexRaw);

  if (!bookmarks.length) {
    console.log('No bookmarks found, exiting.');
    return;
  }

  let changed = 0;

  for (const bookmark of bookmarks) {
    const enPath = path.join('src/content/readings-en', `${bookmark.slug}.md`);
    const zhPath = path.join('src/content/readings-cn', `${bookmark.slug}.md`);

    const enExists = fs.existsSync(enPath);
    const zhExists = fs.existsSync(zhPath);

    const shouldGenerateEn = force || !enExists;
    const shouldGenerateZh = force || !zhExists;

    if (onlyMissing && !shouldGenerateEn && !shouldGenerateZh) {
      continue;
    }

    console.log(`\n- ${bookmark.slug}`);

    let enNote;
    if (shouldGenerateEn) {
      console.log('  • generating EN');
      enNote = await generateEnglishNote(bookmark);
      const enMd = buildReadingMarkdown({ lang: 'en', note: enNote, bookmark });
      if (writeIfChanged(enPath, enMd)) changed += 1;
    } else {
      console.log('  • EN exists (skip)');
      const current = fs.readFileSync(enPath, 'utf8');
      const { frontmatter, body } = splitFrontmatter(current);
      enNote = {
        title: bookmark.title,
        description: bookmark.title,
        tags: bookmark.tags,
        markdown: body.trim(),
      };

      const descMatch = frontmatter.match(/description:\s*'([\s\S]*?)'/);
      if (descMatch) enNote.description = descMatch[1].replace(/''/g, "'");
    }

    if (shouldGenerateZh) {
      console.log('  • generating ZH');
      const metaZh = await translateJsonMetadataToZh({
        title: bookmark.title,
        description: enNote.description,
        tags: enNote.tags,
      });

      const zhMarkdown = await translateMarkdownToZh(enNote.markdown);
      const zhNote = {
        title: metaZh.title,
        description: metaZh.description,
        tags: metaZh.tags,
        markdown: zhMarkdown,
      };

      const zhMd = buildReadingMarkdown({ lang: 'zh', note: zhNote, bookmark });
      if (writeIfChanged(zhPath, zhMd)) changed += 1;
    } else {
      console.log('  • ZH exists (skip)');
    }
  }

  const cnIndex = generateChineseIndex(bookmarks);
  if (writeIfChanged(cnIndexPath, cnIndex)) changed += 1;

  console.log(`\n✅ Done. Files changed: ${changed}`);
}

main().catch((err) => {
  console.error('❌ Failed to generate readings:', err);
  process.exit(1);
});
