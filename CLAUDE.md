# CLAUDE.md

Guidance for Claude Code in this repository. See README.md for structure and commands.

## What this is

A static single-page portfolio (React + TypeScript + Vite, plain CSS, deployed to Vercel). Dark theme, cyan primary + green secondary only. No backend.

## Verification

No test framework. Verify with `npx tsc -b --noEmit`, `npm run build`, and Playwright scripts against the dev server (screenshots, console errors, scroll position, 320px and desktop widths). Delete one-off scripts afterwards.

## Rules

- Content lives in `src/data/*`. Only real, user-confirmed content; ask rather than invent.
- Colours and sizes come from `src/tokens.css`. No new hues; thumbnails use `--thumb-ratio` and `--thumb-radius`.
- No italics. Fonts: Syne for headings (`--font-heading`), Inter for body, UI labels, tags and inline text (`--font-body`, `--font-ui`); mono only for numeric chips.
- Respect `prefers-reduced-motion` for every animation.
- The chatbot (`src/data/pet.ts`) answers only from site data.
- Touch targets are at least 44px on coarse pointers.

## Deploy

`npx vercel --prod --yes`. Vercel Deployment Protection must stay off. If a deploy is "Blocked", the latest commit's author email isn't on the Vercel project.
