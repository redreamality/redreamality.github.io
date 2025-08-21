import fs from 'fs';
import path from 'path';

// Translation configuration
const TRANSLATION_CONFIG = {
  apiBase: process.env.OPENAI_API_BASE || 'https://gateway.chat.sensedeal.vip/v1',
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.MODEL || 'qwen2.5-32b-instruct'
};

// Debug configuration
console.log('Translation Configuration:');
console.log(`- API Base: ${TRANSLATION_CONFIG.apiBase}`);
console.log(`- Model: ${TRANSLATION_CONFIG.model}`);
console.log(`- API Key: ${TRANSLATION_CONFIG.apiKey ? '[CONFIGURED]' : '[MISSING]'}`);

// Test API connectivity
async function testAPI() {
  try {
    console.log('Testing API connectivity...');
    const testResponse = await fetch(`${TRANSLATION_CONFIG.apiBase}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TRANSLATION_CONFIG.apiKey}`,
      },
    });
    console.log(`API test response: ${testResponse.status} ${testResponse.statusText}`);
    if (testResponse.ok) {
      const models = await testResponse.json();
      console.log('Available models:', models.data ? models.data.map(m => m.id).slice(0, 5) : 'Unable to parse models');
    }
  } catch (error) {
    console.log('API test failed:', error.message);
  }
}

// Run API test
await testAPI();

// Content analysis functions
function analyzeContent(filePath, content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) return null;

  const frontmatter = frontmatterMatch[1];
  const bodyContent = frontmatterMatch[2];

  // Extract metadata
  const titleMatch = frontmatter.match(/title:\s*['"](.*)['"]/) || frontmatter.match(/title:\s*(.*)/);
  const title = titleMatch ? titleMatch[1].trim() : path.basename(filePath, '.md');

  const tagsMatch = frontmatter.match(/tags:\s*\[(.*)\]/);
  const tags = tagsMatch ? tagsMatch[1].split(',').map(tag => tag.trim().replace(/['"]/g, '')) : [];

  // Determine priority
  const priority = calculatePriority(title, tags, bodyContent);

  return {
    filePath,
    title,
    tags,
    priority,
    content,
    frontmatter,
    bodyContent
  };
}

function calculatePriority(title, tags, content) {
  const titleLower = title.toLowerCase();
  const tagsLower = tags.map(tag => tag.toLowerCase());
  const contentLower = content.toLowerCase();

  const highPriorityKeywords = [
    'multi-agent', 'ai', 'machine learning', 'tutorial', 'guide',
    'python', 'javascript', 'development', 'programming', 'technical'
  ];

  const mediumPriorityKeywords = [
    'blockchain', 'trading', 'finance', 'web', 'frontend', 'backend'
  ];

  const hasHighPriority = highPriorityKeywords.some(keyword => 
    titleLower.includes(keyword) || 
    tagsLower.some(tag => tag.includes(keyword)) ||
    contentLower.includes(keyword)
  );

  const hasMediumPriority = mediumPriorityKeywords.some(keyword => 
    titleLower.includes(keyword) || 
    tagsLower.some(tag => tag.includes(keyword)) ||
    contentLower.includes(keyword)
  );

  if (hasHighPriority) return 'high';
  if (hasMediumPriority) return 'medium';
  return 'low';
}

// Translation functions (same as single translation)
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
    return metadata;
  }
}

// Main batch translation function
async function batchTranslate(targetLang, priorityFilter, contentTypeFilter, maxItems) {
  const sourceLang = targetLang === 'en' ? 'zh' : 'en';

  console.log(`Starting batch translation to ${targetLang}...`);
  console.log(`Filters: priority=${priorityFilter}, type=${contentTypeFilter}, max=${maxItems}`);
  console.log(`Source language: ${sourceLang}`);
  const sourceDirectories = [];
  
  // Determine source directories
  if (contentTypeFilter === 'all' || contentTypeFilter === 'blog') {
    sourceDirectories.push(sourceLang === 'zh' ? 'src/content/blog-cn' : 'src/content/blog-en');
  }
  if (contentTypeFilter === 'all' || contentTypeFilter === 'talks') {
    sourceDirectories.push(sourceLang === 'zh' ? 'src/content/talks-cn' : 'src/content/talks-en');
  }

  const candidates = [];
  console.log(`Scanning directories: ${sourceDirectories.join(', ')}`);

  // Scan for translation candidates
  for (const dir of sourceDirectories) {
    if (!fs.existsSync(dir)) {
      console.log(`Directory ${dir} does not exist, skipping...`);
      continue;
    }

    const files = fs.readdirSync(dir).filter(file => file.endsWith('.md'));
    console.log(`Found ${files.length} .md files in ${dir}: ${files.join(', ')}`);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const analysis = analyzeContent(filePath, content);
      
      if (analysis) {
        // Check if translation already exists
        let targetDir;
        if (targetLang === 'en') {
          // Translating to English: blog-cn -> blog-en, talks-cn -> talks-en
          targetDir = dir.replace(/-cn$/, '-en');
        } else {
          // Translating to Chinese: blog-en -> blog-cn, talks-en -> talks-cn
          targetDir = dir.replace(/-en$/, '-cn');
        }
        const targetPath = path.join(targetDir, file);
        
        if (!fs.existsSync(targetPath)) {
          console.log(`  ✓ ${file} needs translation (target: ${targetPath})`);
          candidates.push({
            ...analysis,
            targetPath,
            contentType: dir.includes('blog') ? 'blog' : 'talks'
          });
        } else {
          console.log(`  - ${file} already translated (exists: ${targetPath})`);
        }
      }
    }
  }

  // Filter by priority
  let filteredCandidates = candidates;
  if (priorityFilter !== 'all') {
    filteredCandidates = candidates.filter(c => c.priority === priorityFilter);
  }

  // Sort by priority (high -> medium -> low) and limit
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  filteredCandidates.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  filteredCandidates = filteredCandidates.slice(0, maxItems);

  console.log(`Found ${filteredCandidates.length} items to translate:`);
  filteredCandidates.forEach(c => console.log(`- ${c.title} (${c.priority})`));

  const results = [];

  // Translate each item
  for (let i = 0; i < filteredCandidates.length; i++) {
    const item = filteredCandidates[i];
    console.log(`\nTranslating ${i + 1}/${filteredCandidates.length}: ${item.title}`);

    try {
      // Extract metadata for translation
      const descMatch = item.frontmatter.match(/description:\s*['"](.*)['"]/) || 
                       item.frontmatter.match(/description:\s*(.*)/);
      const metadata = {
        title: item.title,
        description: descMatch ? descMatch[1].trim() : '',
        tags: item.tags
      };

      // Translate content and metadata
      const translatedContent = await translateContent(
        item.bodyContent, 
        sourceLang, 
        targetLang, 
        item.contentType
      );
      
      const translatedMetadata = await translateMetadata(metadata, sourceLang, targetLang);

      // Reconstruct frontmatter
      let newFrontmatter = item.frontmatter;
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

      // Write translated file
      const targetDir = path.dirname(item.targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const translatedFile = `---\n${newFrontmatter}\n---\n\n${translatedContent}`;
      fs.writeFileSync(item.targetPath, translatedFile, 'utf8');

      results.push({
        source: item.filePath,
        target: item.targetPath,
        title: item.title,
        translatedTitle: translatedMetadata.title,
        success: true
      });

      console.log(`✅ Completed: ${item.targetPath}`);

      // Add delay between translations to avoid rate limiting
      if (i < filteredCandidates.length - 1) {
        console.log('Waiting 3 seconds before next translation...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

    } catch (error) {
      console.error(`❌ Failed to translate ${item.title}:`, error);
      results.push({
        source: item.filePath,
        target: item.targetPath,
        title: item.title,
        success: false,
        error: error.message
      });
    }
  }

  // Summary
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n📊 Batch Translation Summary:`);
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`📁 Total files created: ${successful.length}`);

  if (successful.length > 0) {
    console.log('\n✅ Successfully translated:');
    successful.forEach(r => console.log(`- ${r.translatedTitle || r.title}`));
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed translations:');
    failed.forEach(r => console.log(`- ${r.title}: ${r.error}`));
  }

  return results;
}

// Run batch translation
const targetLang = process.argv[2];
const priorityFilter = process.argv[3];
const contentTypeFilter = process.argv[4];
const maxItems = parseInt(process.argv[5]) || 5;

batchTranslate(targetLang, priorityFilter, contentTypeFilter, maxItems)
  .then((results) => {
    const successful = results.filter(r => r.success);
    console.log(`\n🎉 Batch translation completed! ${successful.length} files translated.`);
    
    // Set output for GitHub Actions using environment files
    console.log(`translated_count=${successful.length}` + '\n' + `failed_count=${results.length - successful.length}`);

    // Also write to GitHub Actions output file if available
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `translated_count=${successful.length}\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `failed_count=${results.length - successful.length}\n`);
    }
  })
  .catch((error) => {
    console.error('❌ Batch translation failed:', error);
    process.exit(1);
  });
