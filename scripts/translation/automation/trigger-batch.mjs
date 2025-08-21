#!/usr/bin/env node

/**
 * Trigger Batch Translation GitHub Actions Workflow
 * 
 * This script allows you to trigger the batch translation workflow
 * programmatically without going through the GitHub web interface.
 * 
 * Usage:
 *   node scripts/translation/automation/trigger-batch.mjs [options]
 * 
 * Options:
 *   --target-lang <en|zh>     Target language (default: en)
 *   --priority <all|high|medium|low>  Priority filter (default: high)
 *   --content-type <all|blog|talks>   Content type (default: all)
 *   --max-items <1-10>        Maximum items to translate (default: 5)
 *   --auto-commit             Automatically commit translated files
 *   --github-token <token>    GitHub personal access token
 *   --dry-run                 Show what would be done without executing
 */

import fs from 'fs';
import path from 'path';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    targetLang: 'en',
    priority: 'high',
    contentType: 'all',
    maxItems: 5,
    autoCommit: false,
    githubToken: process.env.GITHUB_TOKEN || '',
    dryRun: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--target-lang':
        if (nextArg && ['en', 'zh'].includes(nextArg)) {
          options.targetLang = nextArg;
          i++;
        } else {
          console.error('❌ Invalid target language. Use: en or zh');
          process.exit(1);
        }
        break;
      case '--priority':
        if (nextArg && ['all', 'high', 'medium', 'low'].includes(nextArg)) {
          options.priority = nextArg;
          i++;
        } else {
          console.error('❌ Invalid priority. Use: all, high, medium, or low');
          process.exit(1);
        }
        break;
      case '--content-type':
        if (nextArg && ['all', 'blog', 'talks'].includes(nextArg)) {
          options.contentType = nextArg;
          i++;
        } else {
          console.error('❌ Invalid content type. Use: all, blog, or talks');
          process.exit(1);
        }
        break;
      case '--max-items':
        const maxItems = parseInt(nextArg);
        if (nextArg && maxItems >= 1 && maxItems <= 10) {
          options.maxItems = maxItems;
          i++;
        } else {
          console.error('❌ Invalid max items. Use: 1-10');
          process.exit(1);
        }
        break;
      case '--auto-commit':
        options.autoCommit = true;
        break;
      case '--github-token':
        if (nextArg) {
          options.githubToken = nextArg;
          i++;
        } else {
          console.error('❌ GitHub token required');
          process.exit(1);
        }
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
      default:
        console.error(`❌ Unknown option: ${arg}`);
        showHelp();
        process.exit(1);
    }
  }

  return options;
}

function showHelp() {
  console.log(`
🚀 Batch Translation Trigger

Usage: node scripts/translation/automation/trigger-batch.mjs [options]

Options:
  --target-lang <en|zh>           Target language (default: en)
  --priority <all|high|medium|low> Priority filter (default: high)
  --content-type <all|blog|talks>  Content type (default: all)
  --max-items <1-10>              Maximum items to translate (default: 5)
  --auto-commit                   Automatically commit translated files
  --github-token <token>          GitHub personal access token
  --dry-run                       Show what would be done without executing
  --help, -h                      Show this help message

Examples:
  # Translate high priority blog posts to English
  node scripts/translation/automation/trigger-batch.mjs --target-lang en --content-type blog

  # Translate all content to Chinese with auto-commit
  node scripts/translation/automation/trigger-batch.mjs --target-lang zh --priority all --auto-commit

  # Dry run to see what would be translated
  node scripts/translation/automation/trigger-batch.mjs --dry-run

Environment Variables:
  GITHUB_TOKEN                    GitHub personal access token
`);
}

async function getRepositoryInfo() {
  // Try to get repository info from git remote
  try {
    const { execSync } = await import('child_process');
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    
    // Parse GitHub repository from remote URL
    const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    if (match) {
      return {
        owner: match[1],
        repo: match[2]
      };
    }
  } catch (error) {
    // Fallback to manual configuration
  }
  
  // Default repository info (update this for your repository)
  return {
    owner: 'redreamality',
    repo: 'redreamality.github.io'
  };
}

async function triggerWorkflow(options) {
  const repoInfo = await getRepositoryInfo();
  
  console.log('🚀 Triggering Batch Translation Workflow');
  console.log('========================================');
  console.log(`Repository: ${repoInfo.owner}/${repoInfo.repo}`);
  console.log(`Target Language: ${options.targetLang}`);
  console.log(`Priority Filter: ${options.priority}`);
  console.log(`Content Type: ${options.contentType}`);
  console.log(`Max Items: ${options.maxItems}`);
  console.log(`Auto Commit: ${options.autoCommit ? 'Yes' : 'No'}`);
  console.log(`GitHub Token: ${options.githubToken ? '[PROVIDED]' : '[MISSING]'}`);
  console.log('');

  if (!options.githubToken) {
    console.error('❌ GitHub token is required to trigger workflows');
    console.error('Set GITHUB_TOKEN environment variable or use --github-token option');
    console.error('');
    console.error('To create a GitHub token:');
    console.error('1. Go to GitHub Settings > Developer settings > Personal access tokens');
    console.error('2. Generate new token with "repo" and "workflow" scopes');
    console.error('3. Set as environment variable: export GITHUB_TOKEN=your_token_here');
    process.exit(1);
  }

  if (options.dryRun) {
    console.log('🔍 DRY RUN - No actual workflow will be triggered');
    console.log('');
    console.log('Payload that would be sent:');
    console.log(JSON.stringify({
      event_type: 'batch-translate',
      client_payload: {
        target_language: options.targetLang,
        priority_filter: options.priority,
        content_type: options.contentType,
        max_items: options.maxItems,
        auto_commit: options.autoCommit
      }
    }, null, 2));
    return;
  }

  try {
    console.log('📡 Sending workflow dispatch request...');
    
    const response = await fetch(`https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${options.githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Batch-Translation-Trigger/1.0'
      },
      body: JSON.stringify({
        event_type: 'batch-translate',
        client_payload: {
          target_language: options.targetLang,
          priority_filter: options.priority,
          content_type: options.contentType,
          max_items: options.maxItems,
          auto_commit: options.autoCommit
        }
      })
    });

    if (response.ok) {
      console.log('✅ Workflow triggered successfully!');
      console.log('');
      console.log('🔗 Check workflow progress:');
      console.log(`   https://github.com/${repoInfo.owner}/${repoInfo.repo}/actions`);
      console.log('');
      console.log('📊 Expected results:');
      console.log(`   - Translation from ${options.targetLang === 'en' ? 'Chinese' : 'English'} to ${options.targetLang === 'en' ? 'English' : 'Chinese'}`);
      console.log(`   - Up to ${options.maxItems} files will be processed`);
      console.log(`   - ${options.autoCommit ? 'Files will be committed automatically' : 'A pull request will be created'}`);
    } else {
      const errorText = await response.text();
      console.error(`❌ Failed to trigger workflow: ${response.status} ${response.statusText}`);
      console.error(`Response: ${errorText}`);
      
      if (response.status === 401) {
        console.error('');
        console.error('🔧 Authentication failed. Check your GitHub token:');
        console.error('1. Ensure the token is valid and not expired');
        console.error('2. Verify the token has "repo" and "workflow" scopes');
        console.error('3. Make sure you have write access to the repository');
      } else if (response.status === 404) {
        console.error('');
        console.error('🔧 Repository not found. Check:');
        console.error('1. Repository owner and name are correct');
        console.error('2. Repository exists and is accessible');
        console.error('3. Token has access to the repository');
      }
      
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    process.exit(1);
  }
}

// Main execution
async function main() {
  try {
    const options = parseArgs();
    await triggerWorkflow(options);
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

main();
