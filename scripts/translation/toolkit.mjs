#!/usr/bin/env node

/**
 * Translation Toolkit - All-in-One Translation Management
 * 
 * This script provides a unified interface for all translation operations:
 * - Debug API connectivity
 * - Test translation functionality
 * - Trigger batch translations
 * - Check translation status
 * - Manage translation workflows
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function colorize(text, color) {
  return `${COLORS[color] || COLORS.reset}${text}${COLORS.reset}`;
}

function showHeader() {
  console.log(colorize(`
╔══════════════════════════════════════════════════════════════╗
║                    🌍 Translation Toolkit                    ║
║              All-in-One Translation Management               ║
╚══════════════════════════════════════════════════════════════╝
`, 'cyan'));
}

function showMenu() {
  console.log(colorize('\n📋 Available Operations:', 'blue'));
  console.log('');
  console.log('  1. 🔧 Debug API Connection');
  console.log('  2. 🧪 Test Translation Functionality');
  console.log('  3. 🚀 Trigger Batch Translation');
  console.log('  4. 📊 Check Translation Status');
  console.log('  5. 📁 Analyze Content for Translation');
  console.log('  6. ⚙️  Configure Translation Settings');
  console.log('  7. 📖 Show Documentation');
  console.log('  8. 🚪 Exit');
  console.log('');
}

async function debugAPI() {
  console.log(colorize('\n🔧 Running API Debug Tests...', 'yellow'));
  try {
    execSync('node scripts/translation/debug/api-test.mjs', { stdio: 'inherit' });
  } catch (error) {
    console.log(colorize('❌ Debug tests failed', 'red'));
  }
}

async function testTranslation() {
  console.log(colorize('\n🧪 Running Translation Tests...', 'yellow'));
  try {
    execSync('node scripts/translation/debug/translation-test.mjs', { stdio: 'inherit' });
  } catch (error) {
    console.log(colorize('❌ Translation tests failed', 'red'));
  }
}

async function triggerBatchTranslation() {
  console.log(colorize('\n🚀 Batch Translation Configuration', 'yellow'));
  
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

  try {
    console.log('\nPlease configure your batch translation:');
    
    const targetLang = await question('Target language (en/zh) [en]: ') || 'en';
    const priority = await question('Priority filter (all/high/medium/low) [high]: ') || 'high';
    const contentType = await question('Content type (all/blog/talks) [all]: ') || 'all';
    const maxItems = await question('Max items to translate (1-10) [5]: ') || '5';
    const autoCommit = (await question('Auto-commit files? (y/n) [n]: ') || 'n').toLowerCase() === 'y';
    const githubToken = await question('GitHub token (or press Enter to use env var): ') || process.env.GITHUB_TOKEN || '';

    rl.close();

    if (!githubToken) {
      console.log(colorize('\n❌ GitHub token required. Set GITHUB_TOKEN environment variable or provide it when prompted.', 'red'));
      return;
    }

    const args = [
      '--target-lang', targetLang,
      '--priority', priority,
      '--content-type', contentType,
      '--max-items', maxItems
    ];

    if (autoCommit) args.push('--auto-commit');
    if (githubToken) args.push('--github-token', githubToken);

    console.log(colorize('\n📡 Triggering workflow...', 'blue'));
    execSync(`node scripts/translation/automation/trigger-batch.mjs ${args.join(' ')}`, { stdio: 'inherit' });

  } catch (error) {
    rl.close();
    console.log(colorize('❌ Failed to trigger batch translation', 'red'));
  }
}

async function checkTranslationStatus() {
  console.log(colorize('\n📊 Translation Status Analysis', 'yellow'));
  
  try {
    // Analyze content directories
    const contentDirs = [
      'src/content/blog-cn',
      'src/content/blog-en', 
      'src/content/talks-cn',
      'src/content/talks-en'
    ];

    const stats = {
      'blog-cn': 0,
      'blog-en': 0,
      'talks-cn': 0,
      'talks-en': 0,
      needsTranslation: []
    };

    for (const dir of contentDirs) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
        const dirName = path.basename(dir);
        stats[dirName] = files.length;
        
        // Check for missing translations
        files.forEach(file => {
          const oppositeDir = dir.includes('-cn') ? dir.replace('-cn', '-en') : dir.replace('-en', '-cn');
          const oppositePath = path.join(oppositeDir, file);
          
          if (!fs.existsSync(oppositePath)) {
            stats.needsTranslation.push({
              source: path.join(dir, file),
              target: oppositePath,
              direction: dir.includes('-cn') ? 'zh → en' : 'en → zh'
            });
          }
        });
      }
    }

    console.log(colorize('\n📈 Content Statistics:', 'blue'));
    console.log(`  Chinese Blog Posts: ${stats['blog-cn']}`);
    console.log(`  English Blog Posts: ${stats['blog-en']}`);
    console.log(`  Chinese Talks: ${stats['talks-cn']}`);
    console.log(`  English Talks: ${stats['talks-en']}`);
    
    if (stats.needsTranslation.length > 0) {
      console.log(colorize(`\n⚠️  ${stats.needsTranslation.length} files need translation:`, 'yellow'));
      stats.needsTranslation.slice(0, 10).forEach(item => {
        console.log(`  ${item.direction}: ${path.basename(item.source)}`);
      });
      
      if (stats.needsTranslation.length > 10) {
        console.log(`  ... and ${stats.needsTranslation.length - 10} more`);
      }
    } else {
      console.log(colorize('\n✅ All content is translated!', 'green'));
    }

  } catch (error) {
    console.log(colorize('❌ Failed to analyze translation status', 'red'));
  }
}

async function analyzeContent() {
  console.log(colorize('\n📁 Content Analysis for Translation', 'yellow'));
  
  try {
    const contentDirs = ['src/content/blog-cn', 'src/content/talks-cn'];
    const analysis = [];

    for (const dir of contentDirs) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
          
          if (frontmatterMatch) {
            const frontmatter = frontmatterMatch[1];
            const bodyContent = frontmatterMatch[2];
            
            const titleMatch = frontmatter.match(/title:\s*['"](.*)['"]/) || frontmatter.match(/title:\s*(.*)/);
            const title = titleMatch ? titleMatch[1].trim() : path.basename(file, '.md');
            
            analysis.push({
              file: filePath,
              title,
              contentLength: bodyContent.length,
              wordCount: bodyContent.split(/\s+/).length,
              type: dir.includes('blog') ? 'blog' : 'talks'
            });
          }
        }
      }
    }

    analysis.sort((a, b) => b.contentLength - a.contentLength);

    console.log(colorize('\n📊 Content Analysis Results:', 'blue'));
    console.log(`Total files: ${analysis.length}`);
    console.log(`Blog posts: ${analysis.filter(a => a.type === 'blog').length}`);
    console.log(`Talks: ${analysis.filter(a => a.type === 'talks').length}`);
    console.log('');
    
    console.log(colorize('📝 Largest files (by content length):', 'blue'));
    analysis.slice(0, 5).forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.title} (${item.contentLength} chars, ${item.wordCount} words)`);
    });

  } catch (error) {
    console.log(colorize('❌ Failed to analyze content', 'red'));
  }
}

function showConfiguration() {
  console.log(colorize('\n⚙️  Current Translation Configuration:', 'yellow'));
  
  const config = {
    apiBase: process.env.OPENAI_API_BASE || 'https://gateway.chat.sensedeal.vip/v1',
    apiKey: process.env.OPENAI_API_KEY || 'b9df99ea41435fa7be5ce346b486c33e',
    model: process.env.MODEL || 'qwen2.5-32b-instruct-int4',
    githubToken: process.env.GITHUB_TOKEN || '[NOT SET]'
  };

  console.log(`  API Base: ${config.apiBase}`);
  console.log(`  API Key: ${config.apiKey ? config.apiKey.substring(0, 8) + '...' : '[NOT SET]'}`);
  console.log(`  Model: ${config.model}`);
  console.log(`  GitHub Token: ${config.githubToken !== '[NOT SET]' ? '[SET]' : '[NOT SET]'}`);
  
  console.log(colorize('\n💡 To modify configuration:', 'blue'));
  console.log('  Set environment variables:');
  console.log('    export OPENAI_API_BASE="your-api-base"');
  console.log('    export OPENAI_API_KEY="your-api-key"');
  console.log('    export MODEL="your-model-name"');
  console.log('    export GITHUB_TOKEN="your-github-token"');
}

function showDocumentation() {
  console.log(colorize('\n📖 Translation Toolkit Documentation', 'yellow'));
  console.log('');
  console.log(colorize('🔧 Debug Tools:', 'blue'));
  console.log('  scripts/translation/debug/api-test.mjs         - Test API connectivity');
  console.log('  scripts/translation/debug/translation-test.mjs - Test translation functionality');
  console.log('  scripts/translation/wrappers/debug.ps1         - PowerShell wrapper for all tests');
  console.log('  scripts/translation/wrappers/debug.bat         - Windows batch wrapper');
  console.log('');
  console.log(colorize('🚀 Automation Tools:', 'blue'));
  console.log('  scripts/translation/automation/trigger-batch.mjs - Trigger GitHub Actions workflow');
  console.log('  scripts/translation/toolkit.mjs                  - This unified interface');
  console.log('');
  console.log(colorize('📋 GitHub Actions Workflows:', 'blue'));
  console.log('  .github/workflows/batch-translate.yml    - Batch translation workflow');
  console.log('  .github/workflows/translate-content.yml  - Single file translation');
  console.log('');
  console.log(colorize('📚 Documentation:', 'blue'));
  console.log('  docs/translation/DEBUG-GUIDE.md          - Comprehensive debug guide');
  console.log('');
  console.log(colorize('💡 Quick Start:', 'blue'));
  console.log('  1. Run option 1 to test API connectivity');
  console.log('  2. Run option 2 to test translation functionality');
  console.log('  3. Run option 3 to trigger batch translation');
  console.log('  4. Check GitHub Actions for workflow progress');
}

async function main() {
  showHeader();
  
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

  while (true) {
    showMenu();
    
    const choice = await question(colorize('Select an option (1-8): ', 'cyan'));
    
    switch (choice.trim()) {
      case '1':
        await debugAPI();
        break;
      case '2':
        await testTranslation();
        break;
      case '3':
        await triggerBatchTranslation();
        break;
      case '4':
        await checkTranslationStatus();
        break;
      case '5':
        await analyzeContent();
        break;
      case '6':
        showConfiguration();
        break;
      case '7':
        showDocumentation();
        break;
      case '8':
        console.log(colorize('\n👋 Goodbye!', 'green'));
        rl.close();
        process.exit(0);
        break;
      default:
        console.log(colorize('\n❌ Invalid option. Please select 1-8.', 'red'));
    }
    
    await question(colorize('\nPress Enter to continue...', 'yellow'));
  }
}

main().catch(error => {
  console.error(colorize('❌ Toolkit failed:', 'red'), error.message);
  process.exit(1);
});
