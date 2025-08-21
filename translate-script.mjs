import fs from 'fs';
import path from 'path';

// Translation configuration
const TRANSLATION_CONFIG = {
  apiBase: process.env.OPENAI_API_BASE || 'https://gateway.chat.sensedeal.vip/v1',
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.MODEL || 'qwen2.5-32b-instruct-int4'
};

// Debug configuration
console.log('Translation Configuration:');
console.log(`- API Base: ${TRANSLATION_CONFIG.apiBase}`);
console.log(`- Model: ${TRANSLATION_CONFIG.model}`);
console.log(`- API Key: ${TRANSLATION_CONFIG.apiKey ? '[CONFIGURED]' : '[MISSING]'}`);

// Parse markdown content
function parseMarkdownContent(markdown) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);

  if (match) {
    return {
      frontmatter: match[1],
      content: match[2].trim(),
    };
  }

  return {
    frontmatter: '',
    content: markdown,
  };
}

// Extract metadata from frontmatter
function extractMetadata(frontmatter) {
  const metadata = {};
  
  const titleMatch = frontmatter.match(/title:\s*['"](.*)['"]/) || frontmatter.match(/title:\s*(.*)/);
  if (titleMatch) metadata.title = titleMatch[1].trim();
  
  const descMatch = frontmatter.match(/description:\s*['"](.*)['"]/) || frontmatter.match(/description:\s*(.*)/);
  if (descMatch) metadata.description = descMatch[1].trim();
  
  const tagsMatch = frontmatter.match(/tags:\s*\[(.*)\]/);
  if (tagsMatch) {
    metadata.tags = tagsMatch[1].split(',').map(tag => tag.trim().replace(/['"]/g, ''));
  }
  
  return metadata;
}

// Translate content using LLM API
async function translateContent(content, fromLang, toLang, contentType) {
  const fromLangName = fromLang === 'zh' ? 'Chinese' : 'English';
  const toLangName = toLang === 'zh' ? 'Chinese' : 'English';

  const systemPrompt = `You are a professional translator specializing in technical content translation from ${fromLangName} to ${toLangName}.

Your task is to translate ${contentType} content while:
- Maintaining technical accuracy and terminology
- Preserving code examples and technical concepts
- Ensuring natural flow in the target language
- Keeping all Markdown formatting intact
- Translating comments in code blocks when appropriate
- Maintaining the same tone and style`;

  const userPrompt = `Translate the following ${contentType} content from ${fromLangName} to ${toLangName}:

IMPORTANT: Preserve all Markdown formatting, code blocks, links, and structure exactly as they appear.

${content}`;

  try {
    console.log(`Making API request to: ${TRANSLATION_CONFIG.apiBase}/chat/completions`);
    console.log(`Using model: ${TRANSLATION_CONFIG.model}`);

    const response = await fetch(`${TRANSLATION_CONFIG.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TRANSLATION_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: TRANSLATION_CONFIG.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error Response: ${errorText}`);
      throw new Error(`Translation API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim();
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

// Translate metadata
async function translateMetadata(metadata, fromLang, toLang) {
  const fromLangName = fromLang === 'zh' ? 'Chinese' : 'English';
  const toLangName = toLang === 'zh' ? 'Chinese' : 'English';

  const metadataText = JSON.stringify({
    title: metadata.title || '',
    description: metadata.description || '',
    tags: metadata.tags || [],
  });

  const prompt = `Translate the following JSON metadata from ${fromLangName} to ${toLangName}. Maintain the JSON structure and translate only the values:

${metadataText}

Return only the translated JSON without any additional text or formatting.`;

  try {
    const response = await fetch(`${TRANSLATION_CONFIG.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TRANSLATION_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: TRANSLATION_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator. Translate the provided JSON metadata accurately while preserving the structure.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Metadata translation API error: ${response.status}`);
    }

    const data = await response.json();
    const translatedText = data.choices?.[0]?.message?.content?.trim();
    return JSON.parse(translatedText);
  } catch (error) {
    console.error('Metadata translation error:', error);
    return metadata; // Return original if translation fails
  }
}

// Main translation function
async function translateFile(inputPath, targetLang, contentType, autoCommit) {
  console.log(`Translating ${inputPath} to ${targetLang}...`);

  // Read the original file
  const originalContent = fs.readFileSync(inputPath, 'utf8');
  const { frontmatter, content } = parseMarkdownContent(originalContent);
  
  // Determine source language
  const sourceLang = inputPath.includes('-en/') || inputPath.includes('/en/') ? 'en' : 'zh';
  
  if (sourceLang === targetLang) {
    console.log('Source and target languages are the same. Skipping translation.');
    return;
  }

  // Extract metadata
  const metadata = extractMetadata(frontmatter);
  
  // Translate content and metadata
  console.log('Translating content...');
  const translatedContent = await translateContent(content, sourceLang, targetLang, contentType);
  
  console.log('Translating metadata...');
  const translatedMetadata = await translateMetadata(metadata, sourceLang, targetLang);

  // Reconstruct frontmatter with translated metadata
  let newFrontmatter = frontmatter;
  if (translatedMetadata.title) {
    newFrontmatter = newFrontmatter.replace(
      /title:\s*['"].*['"]/, 
      `title: '${translatedMetadata.title.replace(/'/g, "''")}'`
    );
  }
  if (translatedMetadata.description) {
    newFrontmatter = newFrontmatter.replace(
      /description:\s*['"].*['"]/, 
      `description: '${translatedMetadata.description.replace(/'/g, "''")}'`
    );
  }
  if (translatedMetadata.tags && translatedMetadata.tags.length > 0) {
    const tagsString = translatedMetadata.tags.map(tag => `'${tag.replace(/'/g, "''")}'`).join(', ');
    newFrontmatter = newFrontmatter.replace(/tags:\s*\[.*\]/, `tags: [${tagsString}]`);
  }

  // Construct output path
  const outputPath = inputPath.replace(
    sourceLang === 'zh' ? /\/(blog|talks)\// : /\/(blog|talks)-en\//,
    targetLang === 'en' ? `/$1-en/` : `/$1/`
  );

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write translated file
  const translatedFile = frontmatter ? 
    `---\n${newFrontmatter}\n---\n\n${translatedContent}` : 
    translatedContent;

  fs.writeFileSync(outputPath, translatedFile, 'utf8');
  console.log(`Translation completed: ${outputPath}`);

  return outputPath;
}

// Run translation
const contentPath = process.argv[2];
const targetLang = process.argv[3];
const contentType = process.argv[4];
const autoCommit = process.argv[5] === 'true';

translateFile(contentPath, targetLang, contentType, autoCommit)
  .then((outputPath) => {
    console.log('Translation successful!');
    if (outputPath) {
      console.log(`translated_file=${outputPath}`);
      // Also write to GitHub Actions output file if available
      if (process.env.GITHUB_OUTPUT) {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `translated_file=${outputPath}\n`);
      }
    }
  })
  .catch((error) => {
    console.error('Translation failed:', error);
    process.exit(1);
  });
