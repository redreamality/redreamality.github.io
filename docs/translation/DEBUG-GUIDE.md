# Translation API Debug Guide

This guide helps you debug translation API issues locally before running GitHub Actions workflows, saving time and avoiding tedious commit-test cycles.

## 🚀 Quick Start

### Windows Users

**Option 1: PowerShell (Recommended)**
```powershell
.\scripts\translation\wrappers\debug.ps1
```

**Option 2: Command Prompt**
```cmd
scripts\translation\wrappers\debug.bat
```

### Linux/Mac Users
```bash
# Run basic API tests
node scripts/translation/debug/api-test.mjs

# Run translation functionality tests
node scripts/translation/debug/translation-test.mjs

# Run unified toolkit
node scripts/translation/toolkit.mjs
```

## 📁 Organized Script Structure

```
scripts/
├── translation/
│   ├── debug/
│   │   ├── api-test.mjs           # API connectivity tests
│   │   └── translation-test.mjs   # Translation functionality tests
│   ├── automation/
│   │   └── trigger-batch.mjs      # GitHub Actions workflow trigger
│   ├── wrappers/
│   │   ├── debug.ps1              # PowerShell wrapper
│   │   └── debug.bat              # Windows batch wrapper
│   └── toolkit.mjs                # All-in-one management interface
docs/
└── translation/
    └── DEBUG-GUIDE.md             # This comprehensive guide
```

## 🔧 Debug Tools Overview

| Tool | Purpose | Usage |
|------|---------|-------|
| **api-test.mjs** | Comprehensive API connectivity tests | `node scripts/translation/debug/api-test.mjs` |
| **translation-test.mjs** | Full translation functionality tests | `node scripts/translation/debug/translation-test.mjs` |
| **debug.ps1** | PowerShell wrapper for all tests | `.\scripts\translation\wrappers\debug.ps1` |
| **debug.bat** | Windows batch wrapper | `scripts\translation\wrappers\debug.bat` |
| **toolkit.mjs** | Interactive management interface | `node scripts/translation/toolkit.mjs` |

## 🔧 What Gets Tested

### Basic API Tests (`api-test.mjs`)
1. **Connectivity Test** - Verifies the API base URL is accessible
2. **Models Endpoint** - Lists available models and checks if your target model exists
3. **Chat Completions** - Tests the core API functionality with a simple request
4. **Translation Test** - Verifies translation capability with "测试翻译功能"

### Translation Functionality Tests (`translation-test.mjs`)
1. **Full Translation Pipeline** - Tests the exact same logic used in GitHub Actions
2. **Metadata Translation** - Tests JSON metadata translation
3. **Error Handling** - Validates error responses and provides troubleshooting guidance
4. **File Translation** - Tests with real content files (if available)

## 🌐 Configuration

The debug tools use the same configuration as your GitHub Actions:

### Environment Variables (Optional)
```bash
# Set these if you want to override defaults
export OPENAI_API_BASE="https://gateway.chat.sensedeal.vip/v1"
export OPENAI_API_KEY="your-api-key-here"
export MODEL="qwen2.5-32b-instruct-int4"
```

### Default Values
If environment variables are not set, these defaults are used:
- **API Base**: `https://gateway.chat.sensedeal.vip/v1`
- **API Key**: `b9df99ea41435fa7be5ce346b486c33e`
- **Model**: `qwen2.5-32b-instruct-int4`

## 🐛 Common Issues & Solutions

### Issue: "501 Not Implemented"
**Cause**: The specified model is not available or not implemented by the API provider.

**Solutions**:
1. Run `node scripts/translation/debug/api-test.mjs` to see available models
2. Update your model configuration to use an available model
3. Contact your API provider to confirm model availability

### Issue: "401 Unauthorized"
**Cause**: Invalid or expired API key.

**Solutions**:
1. Verify your API key is correct
2. Check if the API key has proper permissions
3. Ensure the API key hasn't expired

### Issue: "404 Not Found"
**Cause**: Incorrect API base URL or endpoint.

**Solutions**:
1. Verify the API base URL is correct
2. Check if the API provider has changed their endpoints
3. Ensure the `/chat/completions` endpoint exists

### Issue: "429 Rate Limited"
**Cause**: Too many requests sent to the API.

**Solutions**:
1. Wait before retrying
2. Implement request delays in your workflow
3. Check your API plan's rate limits

## 📊 Understanding Test Output

### ✅ Success Indicators
- Green checkmarks (✅) indicate successful tests
- "API_TEST_SUCCESS" confirms the API is responding correctly
- Translated text output shows translation is working

### ❌ Failure Indicators
- Red X marks (❌) indicate failed tests
- Detailed error messages explain what went wrong
- HTTP status codes help identify the specific issue

### ⚠️ Warning Indicators
- Yellow warnings (⚠️) indicate potential issues
- Missing models or unexpected responses
- Non-critical issues that might affect functionality

## 🔄 GitHub Actions Integration

Once your local tests pass:

1. **Go to GitHub Repository** → Actions tab
2. **Select Workflow**: "Batch Translate Content"
3. **Click "Run workflow"**
4. **Configure Options**:
   - Target language (en/zh)
   - Priority filter (all/high/medium/low)
   - Content type (all/blog/talks)
   - Max items (1-10)
   - Auto commit (true/false)

## 🚀 Automation Scripts

### Trigger Batch Translation Programmatically
```bash
# Basic usage
node scripts/translation/automation/trigger-batch.mjs --target-lang en

# Advanced usage
node scripts/translation/automation/trigger-batch.mjs \
  --target-lang zh \
  --priority high \
  --content-type blog \
  --max-items 3 \
  --auto-commit \
  --github-token your_token_here

# Dry run to see what would happen
node scripts/translation/automation/trigger-batch.mjs --dry-run
```

### Interactive Toolkit
```bash
# Launch interactive management interface
node scripts/translation/toolkit.mjs
```

## 🛠️ Advanced Debugging

### Custom Test Content
Edit `scripts/translation/debug/translation-test.mjs` to test with your specific content:

```javascript
// Change this line to test different content
const testContent = 'Your custom test content here';
```

### API Response Inspection
The debug tools show:
- Full request payloads
- Complete response headers
- Raw response bodies
- Parsed JSON structures

### Model Testing
To test different models:

```bash
# Windows
set MODEL=different-model-name
node scripts/translation/debug/api-test.mjs

# Linux/Mac
MODEL=different-model-name node scripts/translation/debug/api-test.mjs
```

## 📝 Troubleshooting Checklist

Before running GitHub Actions, ensure:

- [ ] Node.js is installed and accessible
- [ ] Internet connection is stable
- [ ] API base URL is correct and accessible
- [ ] API key is valid and has permissions
- [ ] Target model is available
- [ ] Basic API test passes
- [ ] Translation test passes
- [ ] No rate limiting issues

## 🆘 Getting Help

If tests continue to fail:

1. **Check API Provider Status** - Visit your API provider's status page
2. **Review API Documentation** - Ensure endpoints and parameters are correct
3. **Contact Support** - Reach out to your API provider's support team
4. **Check Network** - Verify firewall/proxy settings aren't blocking requests

## 📈 Performance Tips

- **Batch Processing**: Use the batch translation workflow for multiple files
- **Rate Limiting**: Add delays between requests to avoid rate limits
- **Model Selection**: Choose appropriate models for your content type
- **Content Filtering**: Use priority filters to translate important content first

## 🔧 Maintenance

### Updating Scripts
All scripts are organized in the `scripts/translation/` directory:
- Update API endpoints in debug scripts if they change
- Modify model lists in configuration files
- Add new test cases to validation scripts

### Adding New Features
- Debug tools: Add to `scripts/translation/debug/`
- Automation: Add to `scripts/translation/automation/`
- Wrappers: Add to `scripts/translation/wrappers/`
- Documentation: Update `docs/translation/`

---

**💡 Pro Tip**: Run these debug tools whenever you change API configuration or encounter translation issues. The organized structure makes it easy to find and run the right tool for your needs!
