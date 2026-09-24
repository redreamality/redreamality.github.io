import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

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

const chaosSchema = blogSchema;

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
  // --- Rich showcase fields (all optional so the legacy projects.md keeps validating) ---
  // 'overview' is reserved for the legacy monolithic projects.md (slug: 'projects')
  type: z.enum(['project', 'paper', 'tool', 'list', 'app', 'overview']).default('project'),
  status: z.enum(['active', 'archived', 'alpha', 'beta', 'wip']).optional(),
  year: z.number().optional(),
  coverImage: z.string().optional(),
  github: z.string().optional(),
  demo: z.string().optional(),
  paper: z.string().optional(),
  venue: z.string().optional(), // conference / journal, e.g. "CIKM 2021"
  techStack: z.array(z.string()).optional(),
  stars: z.number().optional(),
  forks: z.number().optional(),
  role: z.string().optional(),
  language: z.string().optional(), // primary programming language
  featured: z.boolean().default(false),
  order: z.number().optional(), // manual sort weight within its group
});

const meditationsSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.date(),
  tags: z.array(z.string()).optional(),
  theme: z.string().optional(), // optional thematic label, e.g. "成长" / "工程哲学"
  lang: z.enum(['zh', 'en', 'ja']).optional(),
  translatedFrom: z.string().optional(), // Reference to original meditation slug
});

// Chinese content collections
const blogCnCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog-cn' }),
  schema: blogSchema,
});

const talksCnCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/talks-cn' }),
  schema: talksSchema,
});

// English content collections
const blogEnCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog-en' }),
  schema: blogSchema,
});

const talksEnCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/talks-en' }),
  schema: talksSchema,
});

// Projects content collections
const projectsCnCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects-cn' }),
  schema: projectsSchema,
});

const projectsEnCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects-en' }),
  schema: projectsSchema,
});

// Questions content collections
const questionsCnCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/questions-cn' }),
  schema: questionsSchema,
});

const questionsEnCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/questions-en' }),
  schema: questionsSchema,
});

// Notes content collections
const notesCnCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notes-cn' }),
  schema: notesSchema,
});

const notesEnCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notes-en' }),
  schema: notesSchema,
});

// Japanese content collections
const blogJaCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog-ja' }),
  schema: blogSchema,
});

const chaosCnCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/chaos-cn' }),
  schema: chaosSchema,
});

const chaosEnCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/chaos-en' }),
  schema: chaosSchema,
});

const chaosJaCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/chaos-ja' }),
  schema: chaosSchema,
});

const talksJaCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/talks-ja' }),
  schema: talksSchema,
});

const projectsJaCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects-ja' }),
  schema: projectsSchema,
});

const questionsJaCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/questions-ja' }),
  schema: questionsSchema,
});

const notesJaCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notes-ja' }),
  schema: notesSchema,
});

// Meditations content collections (个人感悟 / 沉思录)
const meditationsCnCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/meditations-cn' }),
  schema: meditationsSchema,
});

const meditationsEnCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/meditations-en' }),
  schema: meditationsSchema,
});

const meditationsJaCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/meditations-ja' }),
  schema: meditationsSchema,
});

export const collections = {
  'blog-cn': blogCnCollection,
  'blog-en': blogEnCollection,
  'blog-ja': blogJaCollection,
  'chaos-cn': chaosCnCollection,
  'chaos-en': chaosEnCollection,
  'chaos-ja': chaosJaCollection,
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
  'meditations-cn': meditationsCnCollection,
  'meditations-en': meditationsEnCollection,
  'meditations-ja': meditationsJaCollection,
};
