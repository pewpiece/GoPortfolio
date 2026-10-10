# Pewang Gole's portfolio

A static Astro site that presents my apps (Toolbelt, GoleSync, RaGo Lens, CareCompanion) and thanks the people, tools and open-source projects behind them. No backend, no accounts, no tracking, no third-party requests.

```
npm ci            # install from the lockfile
npm run dev       # http://localhost:4321/GoPortfolio/ (drafts visible, "needs review" badges)
npm run verify    # astro check + lint + tests + build + link check
npm run preview   # serve the production build (drafts hidden)
npm run a11y      # axe, overflow, keyboard and reduced-motion checks (needs preview running)
```

Every dev start and build prints a **build report** (also saved to `build-report.txt`) listing draft items, missing icons, screenshots, links and hidden people.

## Where things live

| What | Where |
| --- | --- |
| One file per app | `src/content/apps/<slug>.json` |
| Name, tagline, intro, footer, "How I build" text, site credits | `src/content/site.json` |
| Thanks page: people, tools, communities | `src/content/thanks.json` |
| App icon | `src/assets/apps/<slug>/icon.png` (square, 512 px or more) |
| Screenshots | `src/assets/apps/<slug>/screens/*.png` |
| Colours, fonts, spacing | `src/styles/tokens.css` |
| Content rules (schema) | `src/lib/schema.ts` |

Images live in `src/assets/` rather than `public/` so Astro can resize them, convert them to WebP and set width and height. Files in `public/` skip that pipeline. Do not commit APKs; link to GitHub Releases.

## Add an app

1. Copy `src/content/apps/toolbelt.json` to `src/content/apps/<slug>.json` and edit it. The `slug` must match the file name. The build fails with a clear message if a field is wrong.
2. Pick an `accent` colour. The schema rejects accents that do not have 4.5:1 contrast with the dark ink used on top of them, or 3:1 against the dark page.
3. Add the slug to `ORDER` in `src/lib/content.ts` if you want to control where it appears (unlisted apps go last).
4. Add `icon.png` and screenshots (below), then run `npm run verify`.

## Add screenshots and an icon

1. Put the files in `src/assets/apps/<slug>/` (`icon.png`) and `src/assets/apps/<slug>/screens/`.
2. Add an entry to `screens` in the app's JSON: `{ "file": "home.png", "alt": "What a person using a screen reader should know", "caption": "Short caption" }`. Alt text is required (8 or more characters).
3. Check that no screenshot shows private information (names, messages, tokens, locations).

Until an app has screenshots the gallery is hidden in production, and a "Screenshots coming" box shows in development only. A missing icon renders a placeholder tile and is listed in the report.

## Link to a release

Set `links.releases` to the repository's GitHub Releases page, for example `https://github.com/pewpiece/Toolbelt/releases`. The button says "Latest Android release on GitHub". The site never hosts APKs.

## Drafts: show or hide content

Anything I have not confirmed carries `"draft": true`.

- On a list item (feature, stack entry, credit, thanks line, screenshot, roadmap item): set `"draft": false` once it is confirmed. Drafts are removed from production builds and shown with a yellow "needs review" badge in development.
- On a whole app: `"draft": true` removes the app everywhere in production (card, page, credits, sitemap). CareCompanion is currently a draft app.
- On a top-level text field: list the field name in `draftFields` (`tagline`, `summary`, `problem`, `howItWorks`, `status`) and remove it when confirmed.

## Show a person on the Thanks page

People are in `src/content/thanks.json` with `"show": false`. A name is never published until I change it to `true`, so ask the person first. When you do, replace the placeholder name and rewrite the note so it says what they actually did. An app's `thanks[]` line can point at a person with `"person": "<id>"`; the name is only added to that line when `show` is `true`.

## Credits and licences

Each app lists `credits[]` (name, what it provides, licence, url). The Credits and Thanks pages are generated from them. If a licence is uncertain, mark the entry `"draft": true` and check it before publishing.

## Publish

Deployment is `.github/workflows/deploy.yml`. It runs on every push to `main` and on pull requests into it (pull requests only build and check; they never deploy): install with the lockfile, type check, lint, tests, build, link check, then deploy with the official Pages actions. No secrets are needed.

**One-time setting:** repository **Settings > Pages > Build and deployment > Source: GitHub Actions**.

`site` and `base` come from the environment (`SITE_URL`, `BASE_PATH`). In CI they default to `https://<owner>.github.io` and `/<repo-name>`. For a custom domain, add repository variables `SITE_URL` (for example `https://example.com`) and `BASE_PATH` (`/`) under Settings > Secrets and variables > Actions > Variables, and set the domain under Settings > Pages. Locally: `SITE_URL=https://example.com BASE_PATH=/ npm run build`.

## Launch checklist

- [ ] Settings > Pages > Source is "GitHub Actions"
- [ ] Add each app's `icon.png` and screenshots (no private information)
- [ ] Confirm the Toolbelt `released` status and that its Releases page has an APK
- [ ] Confirm the GoleSync and RaGo Lens repo and release links
- [ ] Confirm CareCompanion (stack, features, repo) and set `"draft": false` on the app
- [ ] Confirm or rewrite the draft items in `build-report.txt`
- [ ] Name the background-removal model for RaGo Lens and add its real licence
- [ ] Decide which thanks entries to show; ask each person, then set `show: true`
- [ ] Rewrite "How I build" lists so they are exactly what is true for me
- [ ] Add "what I learned" and "what's next" for each app
- [ ] Run `npm run verify`, push to `main`, open the published URL and check the home page, one app page and the 404 page in both themes
