#!/usr/bin/env node

/**
 * Translation API Debug Tool
 * 
 * This script helps debug translation API issues by:
 * 1. Testing API connectivity and authentication
 * 2. Listing available models
 * 3. Testing a simple translation request
 * 4. Providing detailed error information
 */

import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  apiBase: process.env.OPENAI_API_BASE || 'https://gateway.chat.sensedeal.vip/v1',
  apiKey: process.env.OPENAI_API_KEY || 'b9df99ea41435fa7be5ce346b486c33e',
  model: process.env.MODEL || 'qwen2.5-32b-instruct-int4'
};

console.log('🔧 Translation API Debug Tool');
console.log('================================');
console.log(`API Base: ${CONFIG.apiBase}`);
console.log(`Model: ${CONFIG.model}`);
console.log(`API Key: ${CONFIG.apiKey ? `${CONFIG.apiKey.substring(0, 8)}...` : '[MISSING]'}`);
console.log('');

/**
 * Test basic API connectivity
 */
async function testConnectivity() {
  console.log('🌐 Testing API Connectivity...');
  
  try {
    const response = await fetch(CONFIG.apiBase, {
      method: 'GET',
      headers: {
        'User-Agent': 'Translation-Debug/1.0'
      }
    });
    
    console.log(`✅ Base URL accessible: ${response.status} ${response.statusText}`);
    
    if (response.status === 404) {
      console.log('ℹ️  404 is expected for base URL - this is normal');
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Base URL not accessible: ${error.message}`);
    return false;
  }
}

/**
 * Test models endpoint
 */
async function testModelsEndpoint() {
  console.log('\n📋 Testing Models Endpoint...');
  
  try {
    const response = await fetch(`${CONFIG.apiBase}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Models endpoint accessible');
      
      if (data.data && Array.isArray(data.data)) {
        console.log(`📊 Found ${data.data.length} models`);
        console.log('Available models:');
        data.data.slice(0, 10).forEach(model => {
          const isTarget = model.id === CONFIG.model;
          console.log(`  ${isTarget ? '🎯' : '  '} ${model.id}`);
        });
        
        const hasTargetModel = data.data.some(model => model.id === CONFIG.model);
        if (hasTargetModel) {
          console.log(`✅ Target model "${CONFIG.model}" is available`);
        } else {
          console.log(`⚠️  Target model "${CONFIG.model}" not found in available models`);
        }
      } else {
        console.log('⚠️  Unexpected models response format');
        console.log('Response:', JSON.stringify(data, null, 2));
      }
      
      return true;
    } else {
      const errorText = await response.text();
      console.log(`❌ Models endpoint error: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Models endpoint failed: ${error.message}`);
    return false;
  }
}

/**
 * Test chat completions endpoint with a simple request
 */
async function testChatCompletions() {
  console.log('\n💬 Testing Chat Completions Endpoint...');
  
  const testRequest = {
    model: CONFIG.model,
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant. Respond with exactly "API_TEST_SUCCESS" to confirm the API is working.'
      },
      {
        role: 'user',
        content: 'Test API connection'
      }
    ],
    temperature: 0.1,
    max_tokens: 50
  };
  
  try {
    console.log(`Making request to: ${CONFIG.apiBase}/chat/completions`);
    console.log(`Request payload:`, JSON.stringify(testRequest, null, 2));
    
    const response = await fetch(`${CONFIG.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.apiKey}`
      },
      body: JSON.stringify(testRequest)
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log(`Raw response: ${responseText}`);
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ Chat completions endpoint accessible');
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
          const content = data.choices[0].message.content;
          console.log(`📝 Response content: "${content}"`);
          
          if (content.includes('API_TEST_SUCCESS')) {
            console.log('🎉 API test successful!');
            return true;
          } else {
            console.log('⚠️  API responded but with unexpected content');
            return false;
          }
        } else {
          console.log('⚠️  Unexpected response format');
          console.log('Response:', JSON.stringify(data, null, 2));
          return false;
        }
      } catch (parseError) {
        console.log(`❌ Failed to parse JSON response: ${parseError.message}`);
        return false;
      }
    } else {
      console.log(`❌ Chat completions failed: ${responseText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Chat completions request failed: ${error.message}`);
    console.log(`Error details:`, error);
    return false;
  }
}

/**
 * Test translation functionality
 */
async function testTranslation() {
  console.log('\n🌍 Testing Translation Functionality...');
  
  const translationRequest = {
    model: CONFIG.model,
    messages: [
      {
        role: 'system',
        content: 'You are a professional translator. Translate the following text from Chinese to English accurately.'
      },
      {
        role: 'user',
        content: 'Translate this text from Chinese to English: 测试翻译功能'
      }
    ],
    temperature: 0.3,
    max_tokens: 100
  };
  
  try {
    const response = await fetch(`${CONFIG.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.apiKey}`
      },
      body: JSON.stringify(translationRequest)
    });
    
    console.log(`Translation request status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      const translatedText = data.choices?.[0]?.message?.content;
      
      if (translatedText) {
        console.log(`✅ Translation successful: "${translatedText}"`);
        return true;
      } else {
        console.log('❌ No translation content received');
        return false;
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ Translation failed: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Translation request failed: ${error.message}`);
    return false;
  }
}

/**
 * Main debug function
 */
async function runDebug() {
  const results = {
    connectivity: false,
    models: false,
    chatCompletions: false,
    translation: false
  };
  
  results.connectivity = await testConnectivity();
  results.models = await testModelsEndpoint();
  results.chatCompletions = await testChatCompletions();
  results.translation = await testTranslation();
  
  console.log('\n📊 Debug Summary');
  console.log('================');
  console.log(`🌐 Connectivity: ${results.connectivity ? '✅' : '❌'}`);
  console.log(`📋 Models: ${results.models ? '✅' : '❌'}`);
  console.log(`💬 Chat Completions: ${results.chatCompletions ? '✅' : '❌'}`);
  console.log(`🌍 Translation: ${results.translation ? '✅' : '❌'}`);
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Translation API is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the details above for troubleshooting.');
    
    console.log('\n🔧 Troubleshooting Tips:');
    if (!results.connectivity) {
      console.log('- Check your internet connection');
      console.log('- Verify the API base URL is correct');
    }
    if (!results.models) {
      console.log('- Check your API key is valid');
      console.log('- Verify the API key has proper permissions');
    }
    if (!results.chatCompletions) {
      console.log('- Check if the model name is correct');
      console.log('- Verify the API supports the chat completions endpoint');
    }
    if (!results.translation) {
      console.log('- Check if the model supports translation tasks');
      console.log('- Try with a different model or prompt');
    }
  }
  
  return allPassed;
}

// Run the debug script
runDebug().catch(error => {
  console.error('❌ Debug script failed:', error);
  process.exit(1);
});
