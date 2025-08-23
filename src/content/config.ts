import { defineCollection, z } from 'astro:content';

const blogSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.date(),
  author: z.string(),
  tags: z.array(z.string()).optional(),
  image: z.string().optional(),
  updatedDate: z.date().optional(),
  lang: z.enum(['zh', 'en']).optional(),
  translatedFrom: z.string().optional(), // Reference to original post slug
});

const talksSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.date(),
  location: z.string().optional(),
  slides: z.string().optional(),
  video: z.string().optional(),
  lang: z.enum(['zh', 'en']).optional(),
  translatedFrom: z.string().optional(), // Reference to original talk slug
});

const projectsSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.date(),
  author: z.string(),
  lang: z.enum(['zh', 'en']).optional(),
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

export const collections = {
  'blog-cn': blogCnCollection,
  'blog-en': blogEnCollection,
  'talks-cn': talksCnCollection,
  'talks-en': talksEnCollection,
  'projects-cn': projectsCnCollection,
  'projects-en': projectsEnCollection,
};