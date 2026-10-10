import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { reportIntegration } from './src/lib/report-integration.ts';

// SITE_URL and BASE_PATH come from the environment so the same build works at
// https://<user>.github.io/<repo> and on a custom domain (BASE_PATH="/").
const site = process.env.SITE_URL ?? 'https://pewpiece.github.io';
const base = process.env.BASE_PATH ?? '/GoPortfolio';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [sitemap({ filter: (p) => !p.endsWith('/404/') }), reportIntegration()],
});
