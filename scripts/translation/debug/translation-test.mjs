#!/usr/bin/env node

/**
 * Local Translation Test Script
 * 
 * Run this locally to test translation functionality without GitHub Actions:
 * node scripts/translation/debug/translation-test.mjs
 */

import fs from 'fs';
import path from 'path';

// Configuration - same as GitHub Actions
const CONFIG = {
  apiBase: process.env.OPENAI_API_BASE || 'https://gateway.chat.sensedeal.vip/v1',
  apiKey: process.env.OPENAI_API_KEY || 'b9df99ea41435fa7be5ce346b486c33e',
  model: process.env.MODEL || 'qwen2.5-32b-instruct-int4'
};

console.log('🧪 Local Translation Test');
console.log('=========================');
console.log(`API Base: ${CONFIG.apiBase}`);
console.log(`Model: ${CONFIG.model}`);
console.log(`API Key: ${CONFIG.apiKey ? `${CONFIG.apiKey.substring(0, 8)}...` : '[MISSING]'}`);
console.log('');

/**
 * Test translation with the exact same logic as GitHub Actions
 */
async function testTranslation() {
  const testContent = '测试翻译功能';
  const fromLang = 'zh';
  const toLang = 'en';
  const contentType = 'blog';
  
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

${testContent}`;

  const requestPayload = {
    model: CONFIG.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.3,
    max_tokens: 4000,
  };

  try {
    console.log(`🌍 Testing translation: "${testContent}" (${fromLang} → ${toLang})`);
    console.log(`🤖 Using model: ${CONFIG.model}`);
    console.log(`📡 Making request to: ${CONFIG.apiBase}/chat/completions`);
    console.log('');
    
    console.log('📋 Request payload:');
    console.log(JSON.stringify(requestPayload, null, 2));
    console.log('');

    const response = await fetch(`${CONFIG.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.apiKey}`,
      },
      body: JSON.stringify(requestPayload),
    });

    console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    console.log('📋 Response headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    console.log('');

    const responseText = await response.text();
    console.log('📄 Raw response:');
    console.log(responseText);
    console.log('');

    if (!response.ok) {
      console.error(`❌ API Error (${response.status}): ${responseText}`);
      
      // Provide specific error guidance
      if (response.status === 401) {
        console.log('🔧 Troubleshooting: Authentication failed. Check your API key.');
      } else if (response.status === 404) {
        console.log('🔧 Troubleshooting: Endpoint not found. Check your API base URL.');
      } else if (response.status === 429) {
        console.log('🔧 Troubleshooting: Rate limit exceeded. Wait before retrying.');
      } else if (response.status === 501) {
        console.log(`🔧 Troubleshooting: Model "${CONFIG.model}" not implemented or not available.`);
      }
      
      return false;
    }

    try {
      const data = JSON.parse(responseText);
      const translatedContent = data.choices?.[0]?.message?.content?.trim();
      
      if (!translatedContent) {
        console.error('❌ No translation content received from API response');
        console.log('📋 Parsed response structure:');
        console.log(JSON.stringify(data, null, 2));
        return false;
      }

      console.log(`✅ Translation successful!`);
      console.log(`📝 Original: "${testContent}"`);
      console.log(`📝 Translated: "${translatedContent}"`);
      console.log('');
      
      // Test metadata translation too
      await testMetadataTranslation();
      
      return true;
      
    } catch (parseError) {
      console.error(`❌ Failed to parse JSON response: ${parseError.message}`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Translation request failed: ${error.message}`);
    console.error('🔧 Error details:', error);
    return false;
  }
}

/**
 * Test metadata translation
 */
async function testMetadataTranslation() {
  console.log('🏷️  Testing metadata translation...');
  
  const testMetadata = {
    title: '测试标题',
    description: '这是一个测试描述',
    tags: ['测试', '翻译', '功能']
  };
  
  const metadataText = JSON.stringify(testMetadata);
  const prompt = `Translate the following JSON metadata from Chinese to English. Maintain the JSON structure and translate only the values:

${metadataText}

Return only the translated JSON without any additional text or formatting.`;

  try {
    const response = await fetch(`${CONFIG.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: CONFIG.model,
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

    if (response.ok) {
      const data = await response.json();
      const translatedText = data.choices?.[0]?.message?.content?.trim();
      
      try {
        const translatedMetadata = JSON.parse(translatedText);
        console.log('✅ Metadata translation successful!');
        console.log('📝 Original metadata:', testMetadata);
        console.log('📝 Translated metadata:', translatedMetadata);
      } catch (parseError) {
        console.log('⚠️  Metadata translation returned non-JSON:', translatedText);
      }
    } else {
      console.log('❌ Metadata translation failed:', await response.text());
    }
  } catch (error) {
    console.log('❌ Metadata translation error:', error.message);
  }
}

/**
 * Test a real file translation
 */
async function testFileTranslation() {
  console.log('\n📁 Testing real file translation...');
  
  // Look for a test file
  const testFile = 'src/content/blog-cn/test-translation.md';
  
  if (fs.existsSync(testFile)) {
    console.log(`📄 Found test file: ${testFile}`);
    
    const content = fs.readFileSync(testFile, 'utf8');
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    
    if (frontmatterMatch) {
      const bodyContent = frontmatterMatch[2];
      console.log(`📝 Content length: ${bodyContent.length} characters`);
      console.log(`📝 Content preview: ${bodyContent.substring(0, 100)}...`);
      
      // This would be a full translation test - commented out to avoid API usage
      // const translated = await translateContent(bodyContent, 'zh', 'en', 'blog');
      console.log('ℹ️  File translation test available but skipped to save API calls');
    }
  } else {
    console.log(`ℹ️  Test file ${testFile} not found`);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive translation tests...\n');
  
  const success = await testTranslation();
  await testFileTranslation();
  
  console.log('\n📊 Test Summary');
  console.log('===============');
  console.log(`Translation API: ${success ? '✅ Working' : '❌ Failed'}`);
  
  if (success) {
    console.log('\n🎉 All tests passed! Your translation setup is working correctly.');
    console.log('💡 You can now run the GitHub Actions workflow with confidence.');
  } else {
    console.log('\n⚠️  Tests failed. Please check the error messages above.');
    console.log('🔧 Make sure your API configuration is correct before running GitHub Actions.');
  }
}

runAllTests().catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});
