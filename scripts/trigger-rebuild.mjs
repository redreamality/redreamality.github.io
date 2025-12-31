#!/usr/bin/env node

/**
 * Trigger a GitHub Actions workflow to rebuild the site and update sitemap
 * 
 * Usage: npm run trigger:rebuild
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

async function triggerRebuild() {
  console.log('🔄 Triggering site rebuild and sitemap update...');
  
  try {
    // Check if we're in a GitHub repository
    await execAsync('git status', { cwd: rootDir });
    
    // Check if GitHub CLI is available
    try {
      await execAsync('gh --version');
    } catch (error) {
      console.log('⚠️  GitHub CLI not found. Please install it or use the GitHub web interface to trigger the workflow.');
      console.log('   Alternative: Simple commit a file to trigger the rebuild workflow');
      
      // Try an alternative approach: create a temporary file
      const tempFile = path.join(rootDir, '.last-rebuild');
      const timestamp = new Date().toISOString();
      await fs.writeFile(tempFile, `Last rebuild triggered: ${timestamp}\n`);
      
      try {
        await execAsync('git add .last-rebuild', { cwd: rootDir });
        await execAsync('git commit -m "chore: trigger site rebuild and sitemap update"', { cwd: rootDir });
        await execAsync('git push', { cwd: rootDir });
        console.log('✅ Rebuild triggered via git commit');
      } catch (commitError) {
        console.log('⚠️  Could not commit. Manual rebuild may be needed.');
      } finally {
        // Clean up temp file
        try {
          await fs.unlink(tempFile);
          await execAsync('git reset HEAD .last-rebuild', { cwd: rootDir });
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      return;
    }
    
    // Use GitHub CLI to trigger workflow dispatch
    const { stdout, stderr } = await execAsync(
      'gh workflow run rebuild-and-trigger.yml',
      { cwd: rootDir }
    );
    
    if (stderr && !stderr.includes('go get')) {
      console.warn('⚠️  GitHub CLI warning:', stderr);
    }
    
    console.log('✅ Rebuild workflow triggered successfully!');
    console.log('📊 Sitemap will be updated after the rebuild completes');
    
  } catch (error) {
    console.error('❌ Failed to trigger rebuild:', error.message);
    console.log('\n❗ Please manually trigger the "Rebuild and Deploy" workflow from GitHub Actions');
    console.log('   Or wait for auto-rebuild on next push to master branch');
  }
}

triggerRebuild();