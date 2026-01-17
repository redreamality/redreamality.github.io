import { defineCollection, z } from 'astro:content';

const blogSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.date(),
  author: z.string(),
  tags: z.array(z.string()).optional(),
  image: z.string().optional(),
  updatedDate: z.date().optional(),
  lang: z.enum(['zh', 'en', 'ja']).optional(),
  translatedFrom: z.string().optional(), // Reference to original post slug
});

const talksSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.date(),
  location: z.string().optional(),
  slides: z.string().optional(),
  video: z.string().optional(),
  lang: z.enum(['zh', 'en', 'ja']).optional(),
  translatedFrom: z.string().optional(), // Reference to original talk slug
});

const questionsSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.date(),
  tags: z.array(z.string()).optional(),
  lang: z.enum(['zh', 'en', 'ja']).optional(),
  translatedFrom: z.string().optional(), // Reference to original question slug
});

const notesSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.date(),
  source: z.string().optional(), // Original source URL or reference
  tags: z.array(z.string()).optional(),
  lang: z.enum(['zh', 'en', 'ja']).optional(),
  translatedFrom: z.string().optional(), // Reference to original note slug
});

const projectsSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.date(),
  author: z.string(),
  lang: z.enum(['zh', 'en', 'ja']).optional(),
  translatedFrom: z.string().optional(), // Reference to original project slug
});

// Chinese content collections
const blogCnCollection = defineCollection({
  type: 'content',
  schema: blogSchema,
});

const talksCnCollection = defineCollection({
  type: 'content',
  schema: talksSchema,
});

// English content collections
const blogEnCollection = defineCollection({
  type: 'content',
  schema: blogSchema,
});

const talksEnCollection = defineCollection({
  type: 'content',
  schema: talksSchema,
});

// Projects content collections
const projectsCnCollection = defineCollection({
  type: 'content',
  schema: projectsSchema,
});

const projectsEnCollection = defineCollection({
  type: 'content',
  schema: projectsSchema,
});

// Questions content collections
const questionsCnCollection = defineCollection({
  type: 'content',
  schema: questionsSchema,
});

const questionsEnCollection = defineCollection({
  type: 'content',
  schema: questionsSchema,
});

// Notes content collections
const notesCnCollection = defineCollection({
  type: 'content',
  schema: notesSchema,
});

const notesEnCollection = defineCollection({
  type: 'content',
  schema: notesSchema,
});

// Japanese content collections
const blogJaCollection = defineCollection({
  type: 'content',
  schema: blogSchema,
});

const talksJaCollection = defineCollection({
  type: 'content',
  schema: talksSchema,
});

const projectsJaCollection = defineCollection({
  type: 'content',
  schema: projectsSchema,
});

const questionsJaCollection = defineCollection({
  type: 'content',
  schema: questionsSchema,
});

const notesJaCollection = defineCollection({
  type: 'content',
  schema: notesSchema,
});

export const collections = {
  'blog-cn': blogCnCollection,
  'blog-en': blogEnCollection,
  'blog-ja': blogJaCollection,
  'talks-cn': talksCnCollection,
  'talks-en': talksEnCollection,
  'talks-ja': talksJaCollection,
  'projects-cn': projectsCnCollection,
  'projects-en': projectsEnCollection,
  'projects-ja': projectsJaCollection,
  'questions-cn': questionsCnCollection,
  'questions-en': questionsEnCollection,
  'questions-ja': questionsJaCollection,
  'notes-cn': notesCnCollection,
  'notes-en': notesEnCollection,
  'notes-ja': notesJaCollection,
};