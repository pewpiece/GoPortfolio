# Decisions

Written before any CSS or markup, as requested. Updated as the build went on.

## Design direction

**Concept: the workbench.** Each app is a tool Pewang made, so each one hangs on a pegboard as a tag with a punched hole, a colour band and a hand-written label. Thanks live in the margins as small notes pinned beside the thing they refer to, not in a footer.

**The one memorable thing:** the home hero. The four app tags hang from pegboard holes and, once on page load, settle into place with a short swing. Everything else on the site is deliberately quiet.

**Palette** (cool "drafting paper" and ink instead of the cream and terracotta that most generated pages use; orange is the single brand accent, as the brief asks)

| Token | Light | Dark |
| --- | --- | --- |
| paper (background) | `#EEF2F4` | `#0E1721` |
| ink (text) | `#12202E` | `#E8EEF3` |
| brand orange (fills) | `#FF8A3D` | `#FF8A3D` |
| brand orange for text and links | `#A63D00` | `#FFA264` |
| per-app accents | GoleSync `#38BDF8`, RaGo Lens `#FF8A3D`, Toolbelt `#FACC15`, CareCompanion `#5EEAD4` | same |

Accent rule: app accents are **fills only** (tag band, icon tile, swatch). They never colour text, because light accents fail contrast on a light page. Text on an accent is always the ink colour. The content test checks that every accent has at least 4.5:1 contrast against dark ink (text on the accent) and at least 3:1 against both page backgrounds when used as a graphic.

**Type.** Bricolage Grotesque (variable, self-hosted) for headings: it has uneven, slightly quirky letterforms that feel like stencilled tool labels. Source Serif 4 (variable, self-hosted) for body text and the margin notes (italic), with extra line height because it is a serif. No monospace anywhere, no all-caps labels, no eyebrow labels.

**Layout.** Left-aligned, one reading column of about 64 characters, with a margin column on wide screens where the thanks notes sit. On phones the notes drop inline under their section. The app grid is four tags of slightly different tilt, not identical rounded cards.

**Motion.** One orchestrated moment (the tags settling on the home page). Everything else only responds to input (theme toggle, lightbox, menu). All of it is switched off under `prefers-reduced-motion`.

**Why this avoids the generic template look.** The structure comes from the subject (pegboard, tool tags, workshop margin notes) rather than from a card-grid kit. Accent colours are used as paint-chip fills with ink text, not as gradients or coloured headline words. No numbered markers, because nothing here is a sequence.

## Plugins and skills

- `frontend-design:frontend-design` was available and was used for the plan above.
- `context7` was not available in this session. Astro behaviour was checked against the installed package source in `node_modules` instead.
- Figma MCP failed to connect (proxy 403) and was not needed.
- No accessibility plugin was available. Accessibility is checked with `@axe-core/playwright` (see `TEST_OUTPUT.txt`).

## Stack decisions

- **Astro 7.3.8, TypeScript 6.0.3 (strict).** The latest TypeScript (7.x) is rejected by `typescript-eslint`'s peer range (`<6.1`), so TypeScript is pinned to the newest 6.0 release.
- **Fonts** via Fontsource variable packages, no runtime third-party requests.
- **Images live in `src/assets/apps/<slug>/`, not `public/apps/<slug>/`.** Files in `public/` skip Astro's image pipeline (no resizing, no WebP/AVIF, no intrinsic width and height), which conflicts with the "use the image pipeline" requirement. The `public/apps/` folder is not used. README documents the path.
- **Draft model.** Every list item has an optional `draft` flag, plus `draftFields` for top-level text fields. In production drafts are removed; in dev they show a "needs review" badge. A draft **app** is not rendered at all in production (no card, page, credits or sitemap entry).
- **CareCompanion** is `draft: true` as requested, so the production site shows three apps until it is confirmed. Its copy is written in a count-agnostic way so the site reads correctly with three or four apps.
- **Repository links** use the real repos found under the `pewpiece` account (GoleSync, Toolbelt, RaGo-Lens). CareCompanion's repo is unknown and left blank (reported as missing).
- **Licences.** Only licences I am certain of are published. The background-removal model for RaGo Lens is not named in the brief, so it is a draft entry with licence "to confirm". MongoDB and Firebase are left out of CareCompanion's credits (licensing is not a one-line answer).
- **Open Graph images** are generated at build time by an Astro endpoint using `sharp` (SVG to PNG). They use the system sans-serif because librsvg cannot load the self-hosted variable fonts reliably.
- **Diagrams** are CSS/HTML (lanes with connectors) so they reflow to a vertical stack on a 320 px phone, which a scaled SVG could not do legibly.
- **Placeholders.** Missing icons render a generated tile (initial on the accent colour) and are listed in the build report.
- **Deployment.** `SITE_URL` and `BASE_PATH` env vars configure `site` and `base`; defaults are `https://pewpiece.github.io` and `/GoPortfolio` (the repo is named GoPortfolio, not `portfolio`). The workflow sets them from the repo name automatically.

## Later decisions

- **Mobile navigation** is four short links that wrap under the site name at 320 px, so it needs no JavaScript. Client-side JS is only the theme toggle and the screenshot lightbox (native `<dialog>`).
- **Home note.** The gratitude sentence sits in the hero as a pinned note linking to `/thanks`. Draft-app names are kept out of meta descriptions so a draft app cannot leak into production HTML (checked by grepping `dist/`).
- **Dev-only `npm audit` findings** come from dev tooling (Lighthouse and its dependencies), not from anything shipped to visitors.
- **Not done:** screen-reader testing, real-device testing and a check of the deployed URL; none were possible in this session. Screenshots and icons are absent, so the image pipeline was checked with a temporary test image that was then removed.
