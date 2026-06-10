# Corner Systems Website Agent Instructions

This repo is the Corner Systems public site. It uses React 19, Vite, and plain CSS.

## Commands

- Install dependencies: `npm install`
- Start local dev server: `npm run dev`
- Production build: `npm run build`
- Preview production build: `npm run preview`

Run commands from `website/`.

## Project Structure

- `src/App.jsx`: main site routes, content data, page sections, and client-side navigation.
- `src/styles.css`: global styling and responsive layout.
- `src/main.jsx`: React entry point.
- `index.html`: base document and ElevenLabs site-wide embed.
- `api/contact.js`: contact endpoint.
- `corner-systems-website-roadmap.md`: active website conversion roadmap and checklist.
- `agent/`: legacy outbound sales pipeline files currently living in this repo. Do not add new lead lists, sales lists, exports, CRM databases, or outbound pipeline work here.

## Roadmap And Checklist Workflow

- Before starting work, read `corner-systems-website-roadmap.md` and any other repo-local `*roadmap*` or `*checklist*` files relevant to the task.
- When work completes, update the roadmap/checklist status in the same change: mark completed items, add implementation notes when helpful, and add newly discovered follow-up items.
- Do not mark items complete without verification.
- Mention roadmap/checklist updates in the final response.

## Frontend Standards

- Keep the site polished, direct, and service-business oriented. It should feel like a serious operational tool partner, not a generic SaaS landing page.
- Match the existing visual system: light background, restrained blue/teal/amber accents, 8px-ish radii, lucide icons, dense but readable sections.
- Do not introduce one-off design systems, CSS frameworks, or component libraries unless the user explicitly asks.
- Validate responsive behavior at mobile and desktop widths after layout changes. Check header, nav, hero, pricing, forms, and embedded assistant areas.
- Avoid text overlap, horizontal scrolling, layout jumps, and oversized marketing cards.
- Preserve SEO metadata in `PAGE_META` when changing routes or page content.

## Integrations And Data

- The ElevenLabs public assistant is embedded in `index.html`; do not remove or replace it without explicit direction.
- `agent/` scripts can send email, make calls, update local CRM data, and sync external systems. Do not run outbound or mutating agent scripts without explicit user approval.
- All new lead lists, sales lists, prospect exports, CRM databases, outbound pipeline data, and related automation artifacts belong in `/home/michael/cornersystems/agent-network`, not in this website repo.
- If work touches existing `website/agent/` files, prefer moving the durable workflow/data responsibility to `agent-network` and keep only website-specific integration points here.
- Do not commit `.env`, `.env.local`, `agent/pipeline.db`, Google credential JSON, exported lead files, or generated logs.

## Verification

- Run `npm run build` after production code or UI changes.
- For UI changes, inspect the page in browser automation or screenshots when feasible.
- If you modify `agent/` scripts, prefer dry-run or local-only validation first and document any external-system steps left unrun.
