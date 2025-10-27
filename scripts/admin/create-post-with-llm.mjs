import fs from 'fs';
import path from 'path';

const CONFIG = {
  apiBase: process.env.OPENAI_API_BASE || 'https://gateway.chat.sensedeal.vip/v1',
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.MODEL || 'qwen2.5-32b-instruct-int4'
};

const title = (process.env.POST_TITLE || '').trim();
const contentBase64 = process.env.POST_CONTENT_BASE64 || '';
const providedSlug = (process.env.POST_SLUG || '').trim();
const languageHint = (process.env.POST_LANGUAGE_HINT || '').trim();

if (!title) {
  console.error('POST_TITLE is required');
  process.exit(1);
}

if (!contentBase64) {
  console.error('POST_CONTENT_BASE64 is required');
  process.exit(1);
}

if (!CONFIG.apiKey) {
  console.error('OPENAI_API_KEY is not configured');
  process.exit(1);
}

const decodedContent = Buffer.from(contentBase64, 'base64').toString('utf-8');

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function detectLanguage(content, hint) {
  if (hint === 'en' || hint === 'zh') {
    return hint;
  }
  const hasChinese = /[\u4e00-\u9fff]/.test(content);
  return hasChinese ? 'zh' : 'en';
}

function escapeYamlValue(value) {
  return value.replace(/'/g, "''");
}

function collectExistingTags() {
  const contentDir = path.join(process.cwd(), 'src', 'content');
  const blogDirs = [path.join(contentDir, 'blog-en'), path.join(contentDir, 'blog-cn')];
  const tags = new Set();

  for (const dir of blogDirs) {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue;
    for (const entry of fs.readdirSync(dir)) {
      if (!entry.endsWith('.md') && !entry.endsWith('.mdx')) continue;
      const filePath = path.join(dir, entry);
      const content = fs.readFileSync(filePath, 'utf-8');
      const tagMatch = content.match(/tags:\s*\[(.*?)\]/);
      if (tagMatch) {
        tagMatch[1]
          .split(',')
          .map(tag => tag.trim().replace(/['"]/g, ''))
          .filter(Boolean)
          .forEach(tag => tags.add(tag));
      }
    }
  }

  return Array.from(tags).sort();
}

async function requestMetadata({ title, content, existingTags }) {
  const tagsGuidance = existingTags.length > 0 ? existingTags.join(', ') : 'no predefined tags';

  const systemPrompt = [
    'You are an editorial and SEO assistant for a technical blog.',
    'Generate supporting metadata for the provided article using the following rules:',
    '1. Craft an SEO-friendly description (120-160 characters) that includes high-intent search keywords. Keep the description in the article\'s original language.',
    '2. Suggest 2-5 concise tags that best describe the article. Prefer tags from this existing list to avoid duplicates: ' + tagsGuidance + '.',
    '   If none of the existing tags apply, add at most one concise new tag that does not duplicate the meaning of an existing tag.',
    '3. Detect the source language: respond with "en" for English or "zh" for Simplified Chinese.',
    'Return ONLY a valid JSON object matching this TypeScript type: {"description": string, "tags": string[], "language": "en" | "zh"}.',
    'Do not include markdown code fences, explanations, or additional keys.'
  ].join('\n');

  const userPrompt = `Title: ${title}\n\nContent:\n${content.slice(0, 8000)}`;

  console.log('Calling LLM for metadata generation...');
  const response = await fetch(`${CONFIG.apiBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.apiKey}`
    },
    body: JSON.stringify({
      model: CONFIG.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 800
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;

  if (!rawContent) {
    throw new Error('LLM response did not include metadata.');
  }

  const cleaned = rawContent.replace(/```json|```/gi, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    console.error('Raw metadata response:', rawContent);
    throw new Error('Failed to parse metadata JSON.');
  }

  const description = typeof parsed.description === 'string'
    ? parsed.description.trim().replace(/\s+/g, ' ')
    : '';

  if (!description) {
    throw new Error('Metadata description is missing.');
  }

  const tags = Array.isArray(parsed.tags)
    ? parsed.tags
        .map(tag => String(tag).trim())
        .filter(Boolean)
    : [];

  const normalisedTags = [];
  for (const tag of tags) {
    if (!normalisedTags.some(existing => existing.toLowerCase() === tag.toLowerCase())) {
      normalisedTags.push(tag);
    }
    if (normalisedTags.length >= 5) {
      break;
    }
  }

  const existingLookup = new Map(existingTags.map(tag => [tag.toLowerCase(), tag]));
  const finalTags = [];
  for (const tag of normalisedTags) {
    const canonical = existingLookup.get(tag.toLowerCase()) || tag;
    if (!finalTags.some(existing => existing.toLowerCase() === canonical.toLowerCase())) {
      finalTags.push(canonical);
    }
    if (finalTags.length >= 5) {
      break;
    }
  }

  const language = parsed.language === 'zh' || parsed.language === 'en' ? parsed.language : undefined;

  return {
    description,
    tags: finalTags,
    language
  };
}

async function main() {
  const slug = providedSlug || slugify(title);
  const existingTags = collectExistingTags();
  const metadata = await requestMetadata({ title, content: decodedContent, existingTags });

  const finalLanguage = metadata.language || detectLanguage(decodedContent, languageHint);
  const targetDir = path.join(process.cwd(), 'src', 'content', finalLanguage === 'zh' ? 'blog-cn' : 'blog-en');
  const filename = `${slug}.md`;
  const targetPath = path.join(targetDir, filename);

  if (fs.existsSync(targetPath)) {
    console.error(`Target file already exists: ${targetPath}`);
    process.exit(1);
  }

  fs.mkdirSync(targetDir, { recursive: true });

  const frontmatterLines = [
    '---',
    `title: '${escapeYamlValue(title)}'`,
    `pubDate: ${new Date().toISOString()}`,
    `description: '${escapeYamlValue(metadata.description)}'`,
    `author: 'Remy'`,
    `tags: [${metadata.tags.map(tag => `'${escapeYamlValue(tag)}'`).join(', ')}]`,
    '---',
    ''
  ];

  const finalContent = `${frontmatterLines.join('\n')}${decodedContent.trimStart()}\n`;
  fs.writeFileSync(targetPath, finalContent, 'utf-8');

  const summary = {
    slug,
    path: path.relative(process.cwd(), targetPath),
    language: finalLanguage,
    metadata
  };

  console.log('Metadata generation summary:', JSON.stringify(summary, null, 2));
}

main().catch(error => {
  console.error('Failed to generate blog post metadata:', error);
  process.exit(1);
});
