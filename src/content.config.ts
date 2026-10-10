import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { appSchema } from './lib/schema';

const apps = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/apps' }),
  schema: appSchema,
});

export const collections = { apps };
