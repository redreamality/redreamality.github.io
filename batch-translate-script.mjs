import fs from 'fs';
import path from 'path';

// Translation configuration
const TRANSLATION_CONFIG = {
  apiBase: process.env.OPENAI_API_BASE || 'https://gateway.chat.sensedeal.vip/v1',
  apiKey: process.env.OPENAI_API_KEY || 'b9df99ea41435fa7be5ce346b486c33e',
  model: process.env.MODEL || 'qwen2.5-32b-instruct-int4'
};

console.log('🔧 Translation Configuration:');
console.log(`- API Base: ${TRANSLATION_CONFIG.apiBase}`);
console.log(`- Model: ${TRANSLATION_CONFIG.model}`);
console.log(`- API Key: ${TRANSLATION_CONFIG.apiKey ? '[CONFIGURED]' : '[MISSING]'}`);

// Test API connectivity first
async function testAPIConnectivity() {
  console.log('\n🌐 Testing API connectivity...');
  
  try {
    // Test base URL
    const baseResponse = await fetch(TRANSLATION_CONFIG.apiBase);
    console.log(`✅ Base URL accessible: ${baseResponse.status} ${baseResponse.statusText}`);
  } catch (error) {
    console.log(`❌ Base URL inaccessible: ${error.message}`);
    return false;
  }

  try {
    // Test models endpoint
    console.log('📋 Testing models endpoint...');
    const modelsResponse = await fetch(`${TRANSLATION_CONFIG.apiBase}/models`, {
      headers: {
        'Authorization': `Bearer ${TRANSLATION_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Models endpoint: ${modelsResponse.status} ${modelsResponse.statusText}`);
    
    if (modelsResponse.ok) {
      const modelsData = await modelsResponse.json();
      const models = modelsData.data || [];
      console.log(`✅ Found ${models.length} models`);
      
      const availableModels = models.map(m => m.id).slice(0, 5);
      console.log(`Available models (first 5): ${JSON.stringify(availableModels)}`);
      
      const targetModel = TRANSLATION_CONFIG.model;
      const modelExists = models.some(m => m.id === targetModel);
      console.log(`Target model "${targetModel}": ${modelExists ? '✅ Found' : '❌ Not found'}`);
      
      if (!modelExists) {
        const suggestedModels = ['deepseek-chat', 'gpt-4o', 'gpt-4o-mini'];
        const availableSuggested = suggestedModels.filter(model => 
          models.some(m => m.id === model)
        );
        console.log(`⚠️  Consider using one of these available models: ${JSON.stringify(availableSuggested)}`);
      }
    }
  } catch (error) {
    console.log(`❌ Models endpoint error: ${error.message}`);
  }

  try {
    // Test chat completions
    console.log('💬 Testing chat completions...');
    const chatResponse = await fetch(`${TRANSLATION_CONFIG.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TRANSLATION_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: TRANSLATION_CONFIG.model,
        messages: [
          { role: 'user', content: 'Hello, this is a test.' }
        ],
        max_tokens: 10
      })
    });

    console.log(`Chat test: ${chatResponse.status} ${chatResponse.statusText}`);
    
    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.log(`❌ Chat completions failed: ${errorText}`);
      return false;
    }
    
    console.log('✅ Chat completions working');
    return true;
    
  } catch (error) {
    console.log(`❌ Chat completions error: ${error.message}`);
    return false;
  }
}

// Translation function (simplified version)
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

  const requestPayload = {
    model: TRANSLATION_CONFIG.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.3,
    max_tokens: 4000,
  };

  console.log(`Making API request to: ${TRANSLATION_CONFIG.apiBase}/chat/completions`);
  console.log(`Using model: ${TRANSLATION_CONFIG.model}`);

  const response = await fetch(`${TRANSLATION_CONFIG.apiBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TRANSLATION_CONFIG.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestPayload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim();
}

// Main batch translation function
async function batchTranslate(targetLang, priorityFilter, contentTypeFilter, maxItems) {
  const sourceLang = targetLang === 'en' ? 'zh' : 'en';

  console.log(`\nStarting batch translation to ${targetLang}...`);
  console.log(`Filters: priority=${priorityFilter}, type=${contentTypeFilter}, max=${maxItems}`);
  console.log(`Source language: ${sourceLang}`);
  
  // For testing, just translate a simple test content
  const testContent = sourceLang === 'zh' ? '这是一个测试内容' : 'This is test content';
  
  try {
    console.log(`Translating test content...`);
    const translated = await translateContent(testContent, sourceLang, targetLang, 'blog');
    
    if (translated) {
      console.log(`✅ Translation successful!`);
      console.log(`Original: ${testContent}`);
      console.log(`Translated: ${translated}`);
      return [{ success: true, file: 'test-content' }];
    } else {
      console.log(`❌ Translation failed - no content returned`);
      return [{ success: false, file: 'test-content', error: 'No content returned' }];
    }
  } catch (error) {
    console.log(`❌ Translation failed: ${error.message}`);
    return [{ success: false, file: 'test-content', error: error.message }];
  }
}

// Main execution
async function main() {
  const [targetLang, priorityFilter, contentTypeFilter, maxItems] = process.argv.slice(2);
  
  console.log('🚀 Local Batch Translation Test');
  console.log('================================');
  
  // Test API connectivity first
  const apiWorking = await testAPIConnectivity();
  
  if (!apiWorking) {
    console.log('❌ API tests failed. Aborting translation process.');
    process.exit(1);
  }
  
  console.log('✅ API tests passed. Proceeding with translation...');
  
  const results = await batchTranslate(
    targetLang || 'en',
    priorityFilter || 'all',
    contentTypeFilter || 'all',
    parseInt(maxItems) || 5
  );
  
  const successful = results.filter(r => r.success);
  console.log(`\n🎉 Batch translation completed! ${successful.length} files translated.`);
  
  if (successful.length === 0) {
    console.log('❌ No translations were successful. Check the error messages above.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
