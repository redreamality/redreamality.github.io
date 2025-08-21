import fs from 'fs';

// Simulate GitHub Actions environment
const GITHUB_ACTIONS_CONFIG = {
  apiBase: process.env.OPENAI_API_BASE || 'https://gateway.chat.sensedeal.vip/v1',
  apiKey: process.env.OPENAI_API_KEY || 'b9df99ea41435fa7be5ce346b486c33e',
  model: process.env.MODEL || 'qwen2.5-32b-instruct-int4'
};

console.log('🔍 GitHub Actions Environment Debug');
console.log('===================================');
console.log(`- API Base: ${GITHUB_ACTIONS_CONFIG.apiBase}`);
console.log(`- Model: ${GITHUB_ACTIONS_CONFIG.model}`);
console.log(`- API Key: ${GITHUB_ACTIONS_CONFIG.apiKey ? `${GITHUB_ACTIONS_CONFIG.apiKey.substring(0, 8)}...` : '[MISSING]'}`);
console.log('');

// Test with exact same logic as GitHub Actions
async function testGitHubActionsAPI() {
  console.log('🌐 Testing API connectivity (GitHub Actions style)...');

  // Test 1: Basic connectivity with User-Agent
  try {
    const baseResponse = await fetch(GITHUB_ACTIONS_CONFIG.apiBase, {
      method: 'GET',
      headers: { 'User-Agent': 'GitHub-Actions-Translation/1.0' }
    });
    console.log(`✅ Base URL accessible: ${baseResponse.status} ${baseResponse.statusText}`);
  } catch (error) {
    console.log(`❌ Base URL not accessible: ${error.message}`);
    return false;
  }

  // Test 2: Models endpoint
  try {
    console.log('📋 Testing models endpoint...');
    const modelsResponse = await fetch(`${GITHUB_ACTIONS_CONFIG.apiBase}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GITHUB_ACTIONS_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
    });

    console.log(`Models endpoint: ${modelsResponse.status} ${modelsResponse.statusText}`);

    if (modelsResponse.ok) {
      const models = await modelsResponse.json();
      console.log(`✅ Found ${models.data?.length || 0} models`);

      if (models.data && Array.isArray(models.data)) {
        const availableModels = models.data.map(m => m.id);
        console.log('Available models (first 5):', availableModels.slice(0, 5));

        const hasTargetModel = availableModels.includes(GITHUB_ACTIONS_CONFIG.model);
        console.log(`Target model "${GITHUB_ACTIONS_CONFIG.model}": ${hasTargetModel ? '✅ Available' : '❌ Not found'}`);

        if (!hasTargetModel) {
          console.log('⚠️  Consider using one of these available models:', availableModels.slice(0, 3));
        }
      }
    } else {
      const errorText = await modelsResponse.text();
      console.log(`❌ Models endpoint error: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Models test failed: ${error.message}`);
    return false;
  }

  // Test 3: Simple chat completion (exact same as GitHub Actions)
  try {
    console.log('💬 Testing chat completions...');
    const testResponse = await fetch(`${GITHUB_ACTIONS_CONFIG.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GITHUB_ACTIONS_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: GITHUB_ACTIONS_CONFIG.model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant. Respond with exactly "API_TEST_SUCCESS".' },
          { role: 'user', content: 'Test' }
        ],
        temperature: 0.1,
        max_tokens: 10
      })
    });

    console.log(`Chat test: ${testResponse.status} ${testResponse.statusText}`);

    if (testResponse.ok) {
      const data = await testResponse.json();
      const content = data.choices?.[0]?.message?.content;
      console.log(`✅ Chat completions working. Response: "${content}"`);
      return true;
    } else {
      const errorText = await testResponse.text();
      console.log(`❌ Chat completions failed: ${errorText}`);
      
      // Try to parse the error for more details
      try {
        const errorData = JSON.parse(errorText);
        console.log('📋 Error details:', JSON.stringify(errorData, null, 2));
      } catch (parseError) {
        console.log('📋 Raw error text:', errorText);
      }
      return false;
    }
  } catch (error) {
    console.log(`❌ Chat completions test failed: ${error.message}`);
    return false;
  }
}

// Test different authorization formats
async function testAuthFormats() {
  console.log('\n🔐 Testing different authorization formats...');
  
  const authFormats = [
    `Bearer ${GITHUB_ACTIONS_CONFIG.apiKey}`,
    `${GITHUB_ACTIONS_CONFIG.apiKey}`,
    `Token ${GITHUB_ACTIONS_CONFIG.apiKey}`
  ];
  
  for (const [index, authHeader] of authFormats.entries()) {
    console.log(`\n🧪 Testing auth format ${index + 1}: ${authHeader.substring(0, 20)}...`);
    
    try {
      const response = await fetch(`${GITHUB_ACTIONS_CONFIG.apiBase}/models`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log(`   ✅ Auth format ${index + 1} works!`);
        return authHeader;
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Failed: ${errorText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  return null;
}

// Main execution
async function main() {
  console.log('🚀 Starting GitHub Actions API Debug...\n');
  
  // Test standard approach
  const standardWorking = await testGitHubActionsAPI();
  
  if (!standardWorking) {
    console.log('\n🔧 Standard approach failed. Testing alternative auth formats...');
    const workingAuth = await testAuthFormats();
    
    if (workingAuth) {
      console.log(`\n✅ Found working auth format: ${workingAuth.substring(0, 20)}...`);
    } else {
      console.log('\n❌ No working auth format found.');
    }
  }
  
  console.log('\n📊 Debug Summary');
  console.log('================');
  console.log(`Standard API test: ${standardWorking ? '✅ Working' : '❌ Failed'}`);
  
  if (standardWorking) {
    console.log('\n🎉 API is working correctly with GitHub Actions configuration!');
    console.log('💡 The issue might be with GitHub Secrets configuration.');
  } else {
    console.log('\n⚠️  API tests failed with GitHub Actions configuration.');
    console.log('🔧 Check the error messages above for details.');
  }
}

main().catch(error => {
  console.error('❌ Debug script failed:', error);
  process.exit(1);
});
