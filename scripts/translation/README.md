# Translation Scripts Suite

A comprehensive collection of tools for debugging, testing, and automating translation workflows.

## 📁 Directory Structure

```
scripts/translation/
├── debug/                      # Debug and testing tools
│   ├── api-test.mjs           # API connectivity tests
│   └── translation-test.mjs   # Translation functionality tests
├── automation/                 # Automation and workflow tools
│   └── trigger-batch.mjs      # GitHub Actions workflow trigger
├── wrappers/                   # Platform-specific wrappers
│   ├── debug.ps1              # PowerShell wrapper (Windows)
│   └── debug.bat              # Batch wrapper (Windows)
├── toolkit.mjs                # All-in-one management interface
└── README.md                  # This file
```

## 🚀 Quick Start

### 1. Debug API Issues
```bash
# Test API connectivity
node scripts/translation/debug/api-test.mjs

# Test translation functionality
node scripts/translation/debug/translation-test.mjs

# Windows users - run all tests
.\scripts\translation\wrappers\debug.ps1
```

### 2. Interactive Management
```bash
# Launch the unified toolkit
node scripts/translation/toolkit.mjs
```

### 3. Automate Workflows
```bash
# Trigger batch translation
node scripts/translation/automation/trigger-batch.mjs --target-lang en --priority high
```

## 🔧 Debug Tools (`debug/`)

### `api-test.mjs`
Comprehensive API connectivity testing:
- ✅ Base URL accessibility
- ✅ Models endpoint validation
- ✅ Chat completions testing
- ✅ Translation capability verification

**Usage:**
```bash
node scripts/translation/debug/api-test.mjs
```

### `translation-test.mjs`
Full translation pipeline testing:
- ✅ Content translation (same logic as GitHub Actions)
- ✅ Metadata translation
- ✅ Error handling validation
- ✅ Real file testing

**Usage:**
```bash
node scripts/translation/debug/translation-test.mjs
```

## 🤖 Automation Tools (`automation/`)

### `trigger-batch.mjs`
Programmatically trigger GitHub Actions workflows:
- 🎯 Configure all translation options
- 🔍 Dry-run mode for testing
- 📊 Detailed progress reporting
- 🔐 Secure token handling

**Usage:**
```bash
# Basic usage
node scripts/translation/automation/trigger-batch.mjs --target-lang en

# Advanced configuration
node scripts/translation/automation/trigger-batch.mjs \
  --target-lang zh \
  --priority high \
  --content-type blog \
  --max-items 5 \
  --auto-commit

# Test without executing
node scripts/translation/automation/trigger-batch.mjs --dry-run
```

**Options:**
- `--target-lang <en|zh>` - Target language
- `--priority <all|high|medium|low>` - Priority filter
- `--content-type <all|blog|talks>` - Content type
- `--max-items <1-10>` - Maximum items to translate
- `--auto-commit` - Automatically commit files
- `--github-token <token>` - GitHub personal access token
- `--dry-run` - Show what would be done without executing

## 🖥️ Platform Wrappers (`wrappers/`)

### `debug.ps1` (PowerShell)
Windows PowerShell wrapper with:
- 🎨 Colored output
- 📋 Environment variable checking
- 🔧 Comprehensive troubleshooting
- 📊 Detailed result reporting

**Usage:**
```powershell
.\scripts\translation\wrappers\debug.ps1
.\scripts\translation\wrappers\debug.ps1 -RunBasicTest
.\scripts\translation\wrappers\debug.ps1 -RunTranslationTest
```

### `debug.bat` (Batch)
Windows Command Prompt wrapper:
- 📝 Simple text output
- ✅ Basic validation
- 🔍 Error detection
- 📋 Step-by-step guidance

**Usage:**
```cmd
scripts\translation\wrappers\debug.bat
```

## 🛠️ Unified Toolkit (`toolkit.mjs`)

Interactive management interface with menu-driven options:

1. 🔧 **Debug API Connection** - Run connectivity tests
2. 🧪 **Test Translation Functionality** - Validate translation pipeline
3. 🚀 **Trigger Batch Translation** - Launch GitHub Actions workflow
4. 📊 **Check Translation Status** - Analyze content translation status
5. 📁 **Analyze Content for Translation** - Review content statistics
6. ⚙️ **Configure Translation Settings** - View/modify configuration
7. 📖 **Show Documentation** - Display help and usage information
8. 🚪 **Exit** - Close the toolkit

**Usage:**
```bash
node scripts/translation/toolkit.mjs
```

## 🌐 Configuration

All tools use the same configuration system:

### Environment Variables
```bash
export OPENAI_API_BASE="https://gateway.chat.sensedeal.vip/v1"
export OPENAI_API_KEY="your-api-key-here"
export MODEL="qwen2.5-32b-instruct-int4"
export GITHUB_TOKEN="your-github-token-here"
```

### Default Values
- **API Base**: `https://gateway.chat.sensedeal.vip/v1`
- **API Key**: `b9df99ea41435fa7be5ce346b486c33e`
- **Model**: `qwen2.5-32b-instruct-int4`

## 📊 Workflow Integration

### GitHub Actions Workflows
- `.github/workflows/batch-translate.yml` - Batch translation workflow
- `.github/workflows/translate-content.yml` - Single file translation

### Local Testing → GitHub Actions
1. **Debug locally** using debug tools
2. **Validate configuration** with test scripts
3. **Trigger workflows** using automation tools
4. **Monitor progress** on GitHub Actions page

## 🐛 Troubleshooting

### Common Issues
- **501 Not Implemented**: Model not available
- **401 Unauthorized**: Invalid API key
- **404 Not Found**: Incorrect endpoint
- **429 Rate Limited**: Too many requests

### Debug Process
1. Run `api-test.mjs` to check connectivity
2. Run `translation-test.mjs` to validate functionality
3. Check configuration with `toolkit.mjs`
4. Review logs for specific error messages

## 📚 Documentation

- **Comprehensive Guide**: `docs/translation/DEBUG-GUIDE.md`
- **API Reference**: Check individual script headers
- **GitHub Actions**: Workflow files in `.github/workflows/`

## 🔄 Maintenance

### Adding New Tools
- **Debug tools**: Add to `debug/` directory
- **Automation**: Add to `automation/` directory
- **Wrappers**: Add to `wrappers/` directory

### Updating Configuration
- Modify default values in individual scripts
- Update environment variable documentation
- Test changes with debug tools

## 💡 Best Practices

1. **Always test locally** before running GitHub Actions
2. **Use debug tools** to validate configuration changes
3. **Check API status** if tests fail unexpectedly
4. **Monitor rate limits** to avoid API throttling
5. **Keep tokens secure** and rotate regularly

---

**🎯 Goal**: Provide a complete, organized toolkit for translation workflow management that eliminates the need for tedious commit-test cycles and provides comprehensive debugging capabilities.
