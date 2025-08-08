import fs from 'fs';
import path from 'path';

export interface BlogPostData {
  title: string;
  description: string;
  tags: string;
  language: string;
  content: string;
}

export interface TalkData {
  title: string;
  description: string;
  date: string;
  location?: string;
  slides?: string;
  video?: string;
  language: string;
  content: string;
}

/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

/**
 * Parse tags string into array
 */
export function parseTags(tagsString: string): string[] {
  if (!tagsString) return [];
  return tagsString
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
}

/**
 * Generate frontmatter for blog post
 */
export function generateBlogFrontmatter(data: BlogPostData): string {
  const tags = parseTags(data.tags);
  const now = new Date().toISOString();
  
  return `---
title: '${data.title.replace(/'/g, "''")}'
pubDate: ${now}
description: '${data.description.replace(/'/g, "''")}'
author: 'Remy'
tags: [${tags.map(tag => `'${tag.replace(/'/g, "''")}'`).join(', ')}]
---

`;
}

/**
 * Generate frontmatter for talk
 */
export function generateTalkFrontmatter(data: TalkData): string {
  const dateObj = new Date(data.date);
  const isoDate = dateObj.toISOString();
  
  let frontmatter = `---
title: '${data.title.replace(/'/g, "''")}'
description: '${data.description.replace(/'/g, "''")}'
date: ${isoDate}`;

  if (data.location) {
    frontmatter += `\nlocation: '${data.location.replace(/'/g, "''")}'`;
  }
  
  if (data.slides) {
    frontmatter += `\nslides: '${data.slides}'`;
  }
  
  if (data.video) {
    frontmatter += `\nvideo: '${data.video}'`;
  }
  
  frontmatter += '\n---\n\n';
  
  return frontmatter;
}

/**
 * Create blog post file
 */
export async function createBlogPost(data: BlogPostData, language: string): Promise<string> {
  const slug = generateSlug(data.title);
  const frontmatter = generateBlogFrontmatter(data);
  const fullContent = frontmatter + data.content;
  
  // Determine the directory based on language
  const contentDir = language === 'zh' ? 'src/content/blog' : 'src/content/blog';
  const filename = `${slug}.md`;
  const filepath = path.join(process.cwd(), contentDir, filename);
  
  // Ensure directory exists
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Check if file already exists
  if (fs.existsSync(filepath)) {
    throw new Error(`A blog post with the slug "${slug}" already exists`);
  }
  
  // Write file
  fs.writeFileSync(filepath, fullContent, 'utf8');
  
  return filename;
}

/**
 * Create talk file
 */
export async function createTalk(data: TalkData, language: string): Promise<string> {
  const slug = generateSlug(data.title);
  const frontmatter = generateTalkFrontmatter(data);
  const fullContent = frontmatter + data.content;
  
  // Determine the directory based on language
  const contentDir = language === 'zh' ? 'src/content/talks' : 'src/content/talks';
  const filename = `${slug}.md`;
  const filepath = path.join(process.cwd(), contentDir, filename);
  
  // Ensure directory exists
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Check if file already exists
  if (fs.existsSync(filepath)) {
    throw new Error(`A talk with the slug "${slug}" already exists`);
  }
  
  // Write file
  fs.writeFileSync(filepath, fullContent, 'utf8');
  
  return filename;
}

/**
 * Validate blog post data
 */
export function validateBlogPost(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
    errors.push('Description is required');
  }
  
  if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
    errors.push('Content is required');
  }
  
  if (!data.language || !['zh', 'en'].includes(data.language)) {
    errors.push('Language must be either "zh" or "en"');
  }
  
  if (data.tags && typeof data.tags !== 'string') {
    errors.push('Tags must be a string');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate talk data
 */
export function validateTalk(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
    errors.push('Description is required');
  }
  
  if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
    errors.push('Content is required');
  }
  
  if (!data.date || typeof data.date !== 'string') {
    errors.push('Date is required');
  } else {
    const dateObj = new Date(data.date);
    if (isNaN(dateObj.getTime())) {
      errors.push('Date must be a valid date');
    }
  }
  
  if (!data.language || !['zh', 'en'].includes(data.language)) {
    errors.push('Language must be either "zh" or "en"');
  }
  
  if (data.location && typeof data.location !== 'string') {
    errors.push('Location must be a string');
  }
  
  if (data.slides && typeof data.slides !== 'string') {
    errors.push('Slides URL must be a string');
  }
  
  if (data.video && typeof data.video !== 'string') {
    errors.push('Video URL must be a string');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
