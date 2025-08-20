import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  generateSlug,
  parseTags,
  generateBlogFrontmatter,
  generateTalkFrontmatter,
  createBlogPost,
  createTalk,
  validateBlogPost,
  validateTalk,
  type BlogPostData,
  type TalkData
} from './content';

// Mock fs and path modules
vi.mock('fs');
vi.mock('path');

const mockFs = vi.mocked(fs);
const mockPath = vi.mocked(path);

describe('Content Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock process.cwd()
    vi.spyOn(process, 'cwd').mockReturnValue('/mock/project');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateSlug', () => {
    it('should generate URL-friendly slug from title', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
      expect(generateSlug('My Awesome Blog Post!')).toBe('my-awesome-blog-post');
      expect(generateSlug('JavaScript & TypeScript')).toBe('javascript-typescript');
      expect(generateSlug('  Multiple   Spaces  ')).toBe('multiple-spaces');
      expect(generateSlug('Special@#$%Characters')).toBe('specialcharacters');
      expect(generateSlug('Multiple---Hyphens')).toBe('multiple-hyphens');
    });

    it('should handle empty string', () => {
      expect(generateSlug('')).toBe('');
    });

    it('should handle Chinese characters', () => {
      expect(generateSlug('你好世界')).toBe('');
    });
  });

  describe('parseTags', () => {
    it('should parse comma-separated tags', () => {
      expect(parseTags('javascript, typescript, web')).toEqual(['javascript', 'typescript', 'web']);
      expect(parseTags('tag1,tag2,tag3')).toEqual(['tag1', 'tag2', 'tag3']);
      expect(parseTags('  spaced  ,  tags  ')).toEqual(['spaced', 'tags']);
    });

    it('should handle empty string', () => {
      expect(parseTags('')).toEqual([]);
    });

    it('should filter out empty tags', () => {
      expect(parseTags('tag1,,tag2,  ,tag3')).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should handle single tag', () => {
      expect(parseTags('single-tag')).toEqual(['single-tag']);
    });
  });

  describe('generateBlogFrontmatter', () => {
    it('should generate correct frontmatter', () => {
      const data: BlogPostData = {
        title: 'Test Blog Post',
        description: 'This is a test description',
        tags: 'javascript, testing',
        language: 'en',
        content: 'Blog content here'
      };

      const result = generateBlogFrontmatter(data);

      expect(result).toContain("title: 'Test Blog Post'");
      expect(result).toContain("description: 'This is a test description'");
      expect(result).toContain("author: 'Remy'");
      expect(result).toContain("tags: ['javascript', 'testing']");
      expect(result).toMatch(/pubDate: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
    });

    it('should escape single quotes in title and description', () => {
      const data: BlogPostData = {
        title: "It's a test",
        description: "This is a 'quoted' description",
        tags: '',
        language: 'en',
        content: 'Content'
      };

      const result = generateBlogFrontmatter(data);

      expect(result).toContain("title: 'It''s a test'");
      expect(result).toContain("description: 'This is a ''quoted'' description'");
    });

    it('should handle empty tags', () => {
      const data: BlogPostData = {
        title: 'Test',
        description: 'Test description',
        tags: '',
        language: 'en',
        content: 'Content'
      };

      const result = generateBlogFrontmatter(data);

      expect(result).toContain('tags: []');
    });
  });

  describe('generateTalkFrontmatter', () => {
    it('should generate correct frontmatter with all fields', () => {
      const data: TalkData = {
        title: 'My Awesome Talk',
        description: 'Talk description',
        date: '2024-01-15',
        location: 'Tech Conference',
        slides: 'https://example.com/slides.pdf',
        video: 'https://youtube.com/watch?v=123',
        language: 'en',
        content: 'Talk content'
      };

      const result = generateTalkFrontmatter(data);

      expect(result).toContain("title: 'My Awesome Talk'");
      expect(result).toContain("description: 'Talk description'");
      expect(result).toContain("location: 'Tech Conference'");
      expect(result).toContain("slides: 'https://example.com/slides.pdf'");
      expect(result).toContain("video: 'https://youtube.com/watch?v=123'");
      expect(result).toMatch(/date: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
    });

    it('should generate frontmatter without optional fields', () => {
      const data: TalkData = {
        title: 'Simple Talk',
        description: 'Simple description',
        date: '2024-01-15',
        language: 'en',
        content: 'Talk content'
      };

      const result = generateTalkFrontmatter(data);

      expect(result).toContain("title: 'Simple Talk'");
      expect(result).toContain("description: 'Simple description'");
      expect(result).not.toContain('location:');
      expect(result).not.toContain('slides:');
      expect(result).not.toContain('video:');
    });

    it('should escape single quotes', () => {
      const data: TalkData = {
        title: "It's a talk",
        description: "This is a 'quoted' description",
        date: '2024-01-15',
        location: "O'Reilly Conference",
        language: 'en',
        content: 'Content'
      };

      const result = generateTalkFrontmatter(data);

      expect(result).toContain("title: 'It''s a talk'");
      expect(result).toContain("description: 'This is a ''quoted'' description'");
      expect(result).toContain("location: 'O''Reilly Conference'");
    });
  });

  describe('createBlogPost', () => {
    beforeEach(() => {
      mockPath.join.mockImplementation((...args) => args.join('/'));
      mockPath.dirname.mockImplementation((p) => p.split('/').slice(0, -1).join('/'));
    });

    it('should create blog post successfully', async () => {
      const data: BlogPostData = {
        title: 'Test Post',
        description: 'Test description',
        tags: 'test',
        language: 'zh',
        content: 'Test content'
      };

      mockFs.existsSync.mockReturnValue(true); // Directory exists
      mockFs.existsSync.mockReturnValueOnce(true); // Directory exists
      mockFs.existsSync.mockReturnValueOnce(false); // File doesn't exist
      mockFs.writeFileSync.mockImplementation(() => {});

      const result = await createBlogPost(data, 'zh');

      expect(result).toBe('test-post.md');
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('should create directory if it does not exist', async () => {
      const data: BlogPostData = {
        title: 'Test Post',
        description: 'Test description',
        tags: 'test',
        language: 'zh',
        content: 'Test content'
      };

      mockFs.existsSync.mockReturnValue(false); // Directory doesn't exist
      mockFs.existsSync.mockReturnValueOnce(false); // Directory doesn't exist
      mockFs.existsSync.mockReturnValueOnce(false); // File doesn't exist
      mockFs.mkdirSync.mockImplementation(() => {});
      mockFs.writeFileSync.mockImplementation(() => {});

      await createBlogPost(data, 'zh');

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('src/content/blog-cn'),
        { recursive: true }
      );
    });

    it('should throw error if file already exists', async () => {
      const data: BlogPostData = {
        title: 'Test Post',
        description: 'Test description',
        tags: 'test',
        language: 'zh',
        content: 'Test content'
      };

      mockFs.existsSync.mockReturnValue(true); // Directory exists
      mockFs.existsSync.mockReturnValueOnce(true); // Directory exists
      mockFs.existsSync.mockReturnValueOnce(true); // File exists

      await expect(createBlogPost(data, 'zh')).rejects.toThrow(
        'A blog post with the slug "test-post" already exists'
      );
    });
  });

  describe('validateBlogPost', () => {
    it('should validate correct blog post data', () => {
      const data = {
        title: 'Valid Title',
        description: 'Valid description',
        content: 'Valid content',
        language: 'en',
        tags: 'tag1, tag2'
      };

      const result = validateBlogPost(data);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return errors for missing required fields', () => {
      const data = {};

      const result = validateBlogPost(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Title is required');
      expect(result.errors).toContain('Description is required');
      expect(result.errors).toContain('Content is required');
      expect(result.errors).toContain('Language must be either "zh" or "en"');
    });

    it('should return errors for empty strings', () => {
      const data = {
        title: '   ',
        description: '',
        content: '  ',
        language: 'invalid'
      };

      const result = validateBlogPost(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Title is required');
      expect(result.errors).toContain('Description is required');
      expect(result.errors).toContain('Content is required');
      expect(result.errors).toContain('Language must be either "zh" or "en"');
    });

    it('should validate tags as string', () => {
      const data = {
        title: 'Valid Title',
        description: 'Valid description',
        content: 'Valid content',
        language: 'en',
        tags: ['array', 'not', 'string']
      };

      const result = validateBlogPost(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Tags must be a string');
    });
  });

  describe('validateTalk', () => {
    it('should validate correct talk data', () => {
      const data = {
        title: 'Valid Talk',
        description: 'Valid description',
        content: 'Valid content',
        date: '2024-01-15',
        language: 'en',
        location: 'Conference',
        slides: 'https://example.com/slides.pdf',
        video: 'https://youtube.com/watch?v=123'
      };

      const result = validateTalk(data);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return errors for missing required fields', () => {
      const data = {};

      const result = validateTalk(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Title is required');
      expect(result.errors).toContain('Description is required');
      expect(result.errors).toContain('Content is required');
      expect(result.errors).toContain('Date is required');
      expect(result.errors).toContain('Language must be either "zh" or "en"');
    });

    it('should validate date format', () => {
      const data = {
        title: 'Valid Talk',
        description: 'Valid description',
        content: 'Valid content',
        date: 'invalid-date',
        language: 'en'
      };

      const result = validateTalk(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Date must be a valid date');
    });

    it('should validate optional field types', () => {
      const data = {
        title: 'Valid Talk',
        description: 'Valid description',
        content: 'Valid content',
        date: '2024-01-15',
        language: 'en',
        location: 123,
        slides: [],
        video: {}
      };

      const result = validateTalk(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Location must be a string');
      expect(result.errors).toContain('Slides URL must be a string');
      expect(result.errors).toContain('Video URL must be a string');
    });
  });
});
