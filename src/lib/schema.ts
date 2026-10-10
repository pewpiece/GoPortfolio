import { z } from 'astro/zod';
import { contrast, THEME_COLOURS } from './contrast';

const draft = z.boolean().default(false);
const httpsUrl = z
  .url()
  .refine((u) => u.startsWith('https://'), { message: 'links must use https://' });

export const STATUSES = ['released', 'in-development', 'prototype', 'planned'] as const;
export const statusSchema = z.enum(STATUSES);

export const accentSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'accent must be a 6-digit hex colour like #38BDF8')
  .refine((c) => contrast(c, THEME_COLOURS.inkLight) >= 4.5, {
    message: 'accent needs 4.5:1 contrast with the dark ink used for text on it',
  })
  .refine((c) => contrast(c, THEME_COLOURS.paperDark) >= 3, {
    message: 'accent needs 3:1 contrast against the dark page background',
  });

export const screenSchema = z.object({
  file: z.string().min(1),
  alt: z.string().min(8, 'alt text must describe the screenshot (8+ characters)'),
  caption: z.string().min(1),
  draft,
});

export const diagramSchema = z
  .object({
    lanes: z
      .array(
        z.object({
          title: z.string().min(1),
          nodes: z.array(z.object({ label: z.string().min(1), note: z.string().optional() })).min(1),
        }),
      )
      .min(2),
    links: z.array(z.object({ label: z.string().min(1) })),
  })
  .refine((d) => d.links.length === d.lanes.length - 1, {
    message: 'diagram needs exactly one link between each pair of neighbouring lanes',
  });

export const appSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  tagline: z.string().min(1),
  summary: z.string().min(1),
  status: statusSchema,
  accent: accentSchema,
  problem: z.string().min(1),
  features: z.array(z.object({ title: z.string().min(1), text: z.string().min(1), draft })),
  howItWorks: z
    .object({ text: z.string().min(1), diagram: diagramSchema.optional() })
    .optional(),
  stack: z.array(z.object({ name: z.string().min(1), role: z.string().optional(), draft })),
  screens: z.array(screenSchema).default([]),
  learned: z.array(z.object({ text: z.string().min(1), draft })).default([]),
  roadmap: z.array(z.object({ text: z.string().min(1), draft })).default([]),
  links: z.object({
    repo: httpsUrl.optional(),
    releases: httpsUrl.optional(),
    demo: httpsUrl.optional(),
  }),
  notice: z.string().optional(),
  credits: z
    .array(
      z.object({
        name: z.string().min(1),
        provides: z.string().min(1),
        licence: z.string().min(1),
        url: httpsUrl,
        draft,
      }),
    )
    .default([]),
  thanks: z
    .array(z.object({ text: z.string().min(1), person: z.string().optional(), draft }))
    .default([]),
  /** Names of top-level text fields (e.g. "problem") that are unconfirmed. */
  draftFields: z.array(z.enum(['tagline', 'summary', 'problem', 'howItWorks', 'status'])).default([]),
  draft,
});

export type App = z.infer<typeof appSchema>;

export const personSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  group: z.enum(['friends', 'family', 'lecturers', 'teammates']),
  name: z.string().min(1),
  note: z.string().min(1),
  link: httpsUrl.optional(),
  show: z.boolean().default(false),
});

export const thanksSchema = z.object({
  intro: z.string().min(1),
  peopleFallback: z.string().min(1),
  people: z.array(personSchema),
  tools: z.array(
    z.object({ name: z.string().min(1), note: z.string().min(1), link: httpsUrl.optional(), draft }),
  ),
  communities: z.array(
    z.object({ name: z.string().min(1), note: z.string().min(1), link: httpsUrl.optional(), draft }),
  ),
});
export type Thanks = z.infer<typeof thanksSchema>;

export const siteSchema = z.object({
  name: z.string().min(1),
  tagline: z.string().min(1),
  description: z.string().min(1),
  heroLine: z.string().min(1),
  intro: z.array(z.string().min(1)).min(1),
  gratitudeNote: z.string().min(1),
  footerThanks: z.string().min(1),
  links: z.object({ github: httpsUrl }),
  siteCredits: z.array(
    z.object({
      name: z.string().min(1),
      provides: z.string().min(1),
      licence: z.string().min(1),
      url: httpsUrl,
      draft,
    }),
  ),
  howIBuild: z.object({
    intro: z.string().min(1),
    steps: z.array(z.object({ title: z.string().min(1), text: z.string().min(1), draft })),
    aiHelped: z.array(z.object({ text: z.string().min(1), draft })),
    iDecided: z.array(z.object({ text: z.string().min(1), draft })),
    limits: z.string().min(1),
  }),
});
export type Site = z.infer<typeof siteSchema>;
