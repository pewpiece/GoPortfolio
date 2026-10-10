import type { APIRoute, GetStaticPaths } from 'astro';
import sharp from 'sharp';
import { getApps, site } from '../../lib/content';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export const getStaticPaths = (async () => {
  const apps = await getApps();
  return [
    { params: { slug: 'site' }, props: { title: site.name, line: site.tagline, accent: '#ff8a3d', initial: 'P' } },
    ...apps.map((a) => ({ params: { slug: a.slug }, props: { title: a.name, line: a.tagline, accent: a.accent, initial: a.name[0] ?? '?' } })),
  ];
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { title, line, accent, initial } = props as { title: string; line: string; accent: string; initial: string };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#eef2f4"/>
    <rect x="0" y="540" width="1200" height="90" fill="${accent}"/>
    <rect x="0" y="536" width="1200" height="8" fill="#12202e"/>
    <rect x="80" y="90" width="200" height="200" rx="44" fill="${accent}" stroke="#12202e" stroke-width="8"/>
    <text x="180" y="230" text-anchor="middle" font-family="sans-serif" font-size="140" font-weight="800" fill="#12202e">${esc(initial)}</text>
    <text x="80" y="400" font-family="sans-serif" font-size="88" font-weight="800" fill="#12202e">${esc(title)}</text>
    <text x="80" y="470" font-family="sans-serif" font-size="36" fill="#3d4c5b">${esc(line.length > 70 ? line.slice(0, 67) + '...' : line)}</text>
  </svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
