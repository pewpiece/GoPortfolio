import { describe, expect, it } from 'vitest';
import { appSchema, siteSchema, thanksSchema, STATUSES } from '../src/lib/schema';
import { contrast, THEME_COLOURS } from '../src/lib/contrast';
import { buildReport, loadApps } from '../src/lib/report';
import fs from 'node:fs';

const apps = loadApps();
const base = () => structuredClone((apps[0] as { data: Record<string, unknown> }).data);

describe('every app file', () => {
  it.each(apps.map((a) => [a.file, a.data] as const))('%s matches the schema', (_f, data) => {
    const r = appSchema.safeParse(data);
    expect(r.success, r.success ? '' : JSON.stringify(r.error.issues, null, 2)).toBe(true);
  });

  it.each(apps.map((a) => [a.file, a.data] as const))('%s: file name matches slug, status is known, links are https', (file, data) => {
    const app = appSchema.parse(data);
    expect(file).toBe(`${app.slug}.json`);
    expect(STATUSES).toContain(app.status);
    for (const url of [app.links.repo, app.links.releases, app.links.demo, ...app.credits.map((c) => c.url)]) {
      if (url) expect(new URL(url).protocol).toBe('https:');
    }
  });

  it.each(apps.map((a) => [a.file, a.data] as const))('%s: accent meets contrast rules', (_f, data) => {
    const { accent } = appSchema.parse(data);
    expect(contrast(accent, THEME_COLOURS.inkLight)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(accent, THEME_COLOURS.paperDark)).toBeGreaterThanOrEqual(3);
  });

  it('slugs are unique', () => {
    const slugs = apps.map((a) => appSchema.parse(a.data).slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('every screenshot has alt text and a caption', () => {
    for (const a of apps) for (const s of appSchema.parse(a.data).screens) {
      expect(s.alt.length).toBeGreaterThanOrEqual(8);
      expect(s.caption.length).toBeGreaterThan(0);
    }
  });
});

describe('schema rejects bad content', () => {
  it('missing alt text', () => {
    const d = base();
    d.screens = [{ file: 'a.png', alt: '', caption: 'x' }];
    expect(appSchema.safeParse(d).success).toBe(false);
  });
  it('unknown status', () => {
    expect(appSchema.safeParse({ ...base(), status: 'launched' }).success).toBe(false);
  });
  it('accent with low contrast (dark on dark)', () => {
    expect(appSchema.safeParse({ ...base(), accent: '#1B2A3A' }).success).toBe(false);
  });
  it('accent that is not a hex colour', () => {
    expect(appSchema.safeParse({ ...base(), accent: 'orange' }).success).toBe(false);
  });
  it('non-https and malformed links', () => {
    expect(appSchema.safeParse({ ...base(), links: { repo: 'http://github.com/x/y' } }).success).toBe(false);
    expect(appSchema.safeParse({ ...base(), links: { repo: 'not a url' } }).success).toBe(false);
  });
  it('diagram with the wrong number of links', () => {
    const d = base() as { howItWorks: { diagram: { links: unknown[] } } };
    d.howItWorks.diagram.links = [];
    expect(appSchema.safeParse(d).success).toBe(false);
  });
});

describe('site, thanks and privacy', () => {
  it('site.json and thanks.json match their schemas', () => {
    expect(siteSchema.safeParse(JSON.parse(fs.readFileSync('src/content/site.json', 'utf8'))).success).toBe(true);
    expect(thanksSchema.safeParse(JSON.parse(fs.readFileSync('src/content/thanks.json', 'utf8'))).success).toBe(true);
  });
  it('a person entry without "show" defaults to hidden', () => {
    const t = thanksSchema.parse({
      intro: 'x', peopleFallback: 'y', tools: [], communities: [],
      people: [{ id: 'a', group: 'friends', name: 'N', note: 'n' }],
    });
    expect(t.people[0]?.show).toBe(false);
  });
  it('every app thanks entry points at a known person (or none)', () => {
    const t = thanksSchema.parse(JSON.parse(fs.readFileSync('src/content/thanks.json', 'utf8')));
    const ids = new Set(t.people.map((p) => p.id));
    for (const a of apps) for (const th of appSchema.parse(a.data).thanks) if (th.person) expect(ids).toContain(th.person);
  });
  it('the build report finds no invalid content', () => {
    expect(buildReport().problems).toEqual([]);
  });
});
