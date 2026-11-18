# Diganta Roy — Portfolio

Personal portfolio of Diganta Roy, Product / UX designer. A dark, single-page site with routed case studies.

**Stack:** React 19, TypeScript, Vite, Framer Motion, React Router, plain CSS (no Tailwind).

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check (tsc -b) + production build
npm run lint     # oxlint
```

## Structure

```
src/
  tokens.css            Design tokens: neutrals, cyan (primary), green (secondary),
                        type (Syne headings, Inter body), motion, thumbnail ratio/radius
  index.css             Global styles, .live-emoji
  App.tsx               Routes + ScrollManager + SitePet
  data/
    content.ts          Bio, skills, experience, tools, testimonials, other work
    projects.ts         Selected-work case studies
    pet.ts              Curated Q&A for the chatbot (built from the data above)
    quotes.ts           Loading-screen quotes
  components/
    Cockpit.tsx         Home page (hero, work, about, other work, toolbox, contact)
    ProjectPage.tsx     /work/:slug
    ArchivePage.tsx     /other-work/:slug
    ExperienceTimeline  Scroll-drawn experience timeline
    SitePet / PetMorph  Dog chatbot (Q&A chips) and its avatar morph
    LoadingScreen       Multilingual quotes intro
public/
  other-work/           Case-study images
```

## Content rules

- All content lives in `src/data/`. Components only render it.
- Only real, confirmed content: no invented projects, metrics, quotes or credentials.
- The chatbot answers only from site data; it never generates new claims.

## Notes

- `public/resume.pdf` and `.vercel/` are git-ignored on purpose.
- Case-study material may relate to client work. Check with the relevant owner at Valtech before making this repository public.
- Deploy: `npx vercel --prod --yes`. Vercel blocks deploys when the latest commit's author email is not on the Vercel project, so set `git config user.email` to the account email first.
