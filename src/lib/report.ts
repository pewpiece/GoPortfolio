import fs from 'node:fs';
import path from 'node:path';
import { appSchema, siteSchema, thanksSchema, type App } from './schema';

const ICON_EXT = ['png', 'webp', 'jpg', 'jpeg', 'avif'];

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function loadApps(root = process.cwd()): { file: string; data: unknown }[] {
  const dir = path.join(root, 'src/content/apps');
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => ({ file: f, data: readJson(path.join(dir, f)) }));
}

/** Everything the author still has to confirm or add, as plain lines. */
export function buildReport(root = process.cwd()): { lines: string[]; problems: string[] } {
  const lines: string[] = [];
  const problems: string[] = [];
  const add = (s: string) => lines.push(s);

  for (const { file, data } of loadApps(root)) {
    const parsed = appSchema.safeParse(data);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        problems.push(`${file}: ${issue.path.join('.')}: ${issue.message}`);
      }
      continue;
    }
    const app: App = parsed.data;
    const tag = `[${app.slug}]`;
    if (app.draft) add(`${tag} APP IS A DRAFT: hidden in production (no card, page, credits or sitemap entry)`);
    for (const f of app.draftFields) add(`${tag} unconfirmed field: ${f}`);
    const lists = {
      features: app.features,
      stack: app.stack,
      learned: app.learned,
      roadmap: app.roadmap,
      credits: app.credits,
      thanks: app.thanks,
      screens: app.screens,
    } as const;
    for (const [name, items] of Object.entries(lists)) {
      (items as { draft: boolean }[]).forEach((item, i) => {
        if (item.draft) add(`${tag} draft ${name}[${i}] is hidden in production`);
      });
    }

    const assetDir = path.join(root, 'src/assets/apps', app.slug);
    const hasIcon = ICON_EXT.some((e) => fs.existsSync(path.join(assetDir, `icon.${e}`)));
    if (!hasIcon) add(`${tag} missing icon: src/assets/apps/${app.slug}/icon.png (placeholder tile in use)`);
    if (app.screens.length === 0) add(`${tag} no screenshots: gallery is hidden in production`);
    for (const s of app.screens) {
      if (!fs.existsSync(path.join(assetDir, 'screens', s.file))) {
        add(`${tag} screenshot file not found: src/assets/apps/${app.slug}/screens/${s.file}`);
      }
    }
    if (!app.links.repo) add(`${tag} missing link: repo`);
    if (app.status === 'released' && !app.links.releases) add(`${tag} missing link: releases`);
    if (app.learned.length === 0) add(`${tag} "what I learned" is empty: section hidden`);
    if (app.roadmap.length === 0) add(`${tag} "what's next" is empty: section hidden`);
  }

  const site = siteSchema.safeParse(readJson(path.join(root, 'src/content/site.json')));
  if (!site.success) site.error.issues.forEach((i) => problems.push(`site.json: ${i.path.join('.')}: ${i.message}`));
  else {
    site.data.siteCredits.forEach((c) => c.draft && add(`[site] draft credit: ${c.name}`));
    site.data.howIBuild.aiHelped.forEach((c, i) => c.draft && add(`[how-i-build] draft aiHelped[${i}]`));
    site.data.howIBuild.steps.forEach((c, i) => c.draft && add(`[how-i-build] draft steps[${i}]`));
    site.data.howIBuild.iDecided.forEach((c, i) => c.draft && add(`[how-i-build] draft iDecided[${i}]`));
  }

  const thanks = thanksSchema.safeParse(readJson(path.join(root, 'src/content/thanks.json')));
  if (!thanks.success) thanks.error.issues.forEach((i) => problems.push(`thanks.json: ${i.path.join('.')}: ${i.message}`));
  else {
    thanks.data.people.forEach((p) => !p.show && add(`[thanks] person hidden (show: false): ${p.id}`));
    thanks.data.tools.forEach((t) => t.draft && add(`[thanks] draft tool: ${t.name}`));
    thanks.data.communities.forEach((t) => t.draft && add(`[thanks] draft community: ${t.name}`));
  }
  return { lines, problems };
}

export function formatReport(root = process.cwd()): string {
  const { lines, problems } = buildReport(root);
  const out = ['Portfolio build report', '======================'];
  out.push(problems.length ? `\nINVALID CONTENT (${problems.length}):` : '\nContent schema: OK');
  problems.forEach((p) => out.push(`  ! ${p}`));
  out.push(`\nDraft, missing and hidden items (${lines.length}):`);
  lines.forEach((l) => out.push(`  - ${l}`));
  return out.join('\n') + '\n';
}
