import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    author: z.string(),
    tags: z.array(z.string()).optional(),
    image: z.string().optional(),
    updatedDate: z.date().optional(),
  }),
});

const talksCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    location: z.string().optional(),
    slides: z.string().optional(),
    video: z.string().optional(),
  }),
});

export const collections = {
  'blog': blogCollection,
  'talks': talksCollection,
}; 