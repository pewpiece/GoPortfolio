import { getCollection } from 'astro:content';
import type { ImageMetadata } from 'astro';
import siteJson from '../content/site.json';
import thanksJson from '../content/thanks.json';
import { siteSchema, thanksSchema, type App } from './schema';

export const isDev = import.meta.env.DEV;
export const site = siteSchema.parse(siteJson);
export const thanks = thanksSchema.parse(thanksJson);

/** Prefix a site path with the configured base, e.g. "/thanks/" -> "/GoPortfolio/thanks/". */
export function url(p: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${p.replace(/^\//, '')}`;
}

/** Drafts are removed in production and kept (with a badge) in development. */
export function shown<T extends { draft?: boolean }>(items: readonly T[]): T[] {
  return isDev ? [...items] : items.filter((i) => !i.draft);
}

export function fieldIsDraft(app: App, field: App['draftFields'][number]): boolean {
  return app.draftFields.includes(field) || app.draft;
}

const ORDER = ['toolbelt', 'golesync', 'rago-lens', 'carecompanion'];

export async function getApps(): Promise<App[]> {
  const entries = await getCollection('apps');
  return entries
    .map((e) => e.data)
    .filter((a) => isDev || !a.draft)
    .sort((a, b) => {
      const ia = ORDER.indexOf(a.slug);
      const ib = ORDER.indexOf(b.slug);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
}

const icons = import.meta.glob<{ default: ImageMetadata }>('/src/assets/apps/*/icon.{png,webp,jpg,jpeg,avif}', {
  eager: true,
});
const screens = import.meta.glob<{ default: ImageMetadata }>('/src/assets/apps/*/screens/*.{png,webp,jpg,jpeg,avif}', {
  eager: true,
});

export function iconFor(slug: string): ImageMetadata | undefined {
  const hit = Object.entries(icons).find(([p]) => p.startsWith(`/src/assets/apps/${slug}/icon.`));
  return hit?.[1].default;
}

export function screenFor(slug: string, file: string): ImageMetadata | undefined {
  return screens[`/src/assets/apps/${slug}/screens/${file}`]?.default;
}

export function visiblePeople() {
  return thanks.people.filter((p) => p.show || isDev);
}

export const statusLabel: Record<App['status'], string> = {
  released: 'Released',
  'in-development': 'In development',
  prototype: 'Prototype',
  planned: 'Planned',
};
