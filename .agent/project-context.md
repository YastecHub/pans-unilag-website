# Project context

Fill this from confirmed requirements and inspected code. Leave unknown items as `Unknown`; do not invent product rules. This file describes this project, not universal defaults.

| Field | Value |
| --- | --- |
| Solution purpose and users | Official website of PANS UNILAG (Pharmaceutical Association of Nigeria Students, University of Lagos; motto "Service to Humanity"). Name follows the constitution. Primary users: UNILAG pharmacy students (PANSites). Secondary: executives (via admin dashboard), alumni, prospective students, wider pharmacy community. See README.md and the PRD |
| Repository/workspace layout | One repo, npm workspaces: `client/` (React SPA: `src/app`, `src/features/<feature>/{api,components,pages}`, `src/components/{layout,ui}`) and `server/` (Express API: `src/app.ts`, `src/server.ts`, `src/config`, `src/middleware`, `src/modules/<feature>/{http,application,domain,infrastructure}`). Scaffolded in issue #1. See README.md > Project structure |
| Runtime and package manager | Node.js 22 LTS (Vite needs 20.19+ or 22.12+); npm with workspaces |
| Framework versions and router | React 19 + Vite 8 (client; React Router to be added in #6); Express 5 (server); TypeScript ~6.0; ESLint 10 + typescript-eslint; Vitest 5 |
| JavaScript/TypeScript and module system | TypeScript, strict mode, in both client and server; ESM |
| Database, ORM and transaction support | MongoDB Atlas (free M0 proposed: 512 MB, no automatic backups) with Mongoose. Single-document writes; no multi-document transactions needed in v1 |
| Authentication and tenant model | Visitors: no accounts, all public content. Admins only: email + password (argon2/bcrypt), JWT session in httpOnly Secure SameSite cookie, roles `admin` and `editor`, no public sign-up. Student accounts deferred to phase 2 |
| Jobs, queues and external providers | Cloudinary (server `cloudinary` SDK signs uploads; client `@cloudinary/react` + `@cloudinary/url-gen` renders). No queues. Weekly manual `mongodump` backups |
| Deployment target and runtime constraints | Proposed: client static on Vercel/Netlify/Cloudflare Pages; API on Render (free tier sleeps after 15 min idle, ~1 min cold start; Starter ~$7/month stays on); DB on MongoDB Atlas. Must load well on Nigerian mobile data |
| Critical invariants and state transitions | Events move to Past after `endsAt`; opportunities hidden after `deadline`; announcements hidden after `expiresAt`. Feedback/alumni submissions and admin records are never returned by public endpoints. CGPA calculator stores no user data |
| Currency/rounding and timezone rules | Timezone Africa/Lagos (WAT, UTC+1) for display and date rules; store UTC. CGPA shown to 2 decimal places on the UNILAG 5-point scale |
| Design system and accessibility target | Brand tokens from the Brand Guidelines (see README > Brand) as CSS variables, Tailwind proposed; Poppins + Inter; light/dark themes; WCAG 2.1 AA; Lighthouse mobile >= 90 |
| Existing install/dev/build/lint/typecheck/test commands | From the repo root: `npm install`, `npm run dev` (API :4000 via tsx watch + Vite :5173 with /api proxy), `npm run build`, `npm run lint` (root eslint.config.js), `npm run typecheck`, `npm run test` (Vitest), `npm run format` / `format:check` (Prettier, code only). Per workspace: `-w client` / `-w server`. Seed script arrives with issue #8 |
| Testing policy and required CI gates | Follow applicable project/user instructions; use proportionate verification |
| Authorized environments and deployment scope | Local work unless otherwise authorized |

## Domain language

Record terms that have a specific meaning here, including lifecycle states and ownership boundaries.

- **PANS UNILAG**: Pharmaceutical Association of Nigeria Students, University of Lagos (constitution spelling: "Nigeria", not "Nigerian"). Motto: Service to Humanity.
- **PANSite**: a member; every duly registered student of the Faculty of Pharmacy.
- **Congress / General Assembly**: all registered members; the highest organ.
- **EC (Executive Council)**: the 14 elected executive offices; one session in office.
- **Senate**: legislative arm; 22 Senators; principal officers Senate President, Deputy Senate President, Senate Leader, Chief Whip.
- **Interim Council**: governs if the EC is dissolved, until a new EC is sworn in.
- **Session**: an academic year of office, written `2026/2027` (or `26/27`).
- **Level**: student year, written `200L`-`500L`.
- **Secretary General** (not "General Secretary"): receives complaints and suggestions; all correspondence goes through this office.
- **EIC**: Editor-in-Chief; chairs the Editorial Board, which publishes **Recipharm** annually.
- **Committees 2026/27**: ADMAP, Content, Media, Design, PPHT (Public Health Team), SDG, Research Club, CPD & CBC, Academics, Alumni Network, IPSF. Officer titles vary: Lead/Assistant; Chairman/Secretary; LEO (Local Exchange Officer)/LLO (Local Liaison Officer).
- **Standing committees (constitution)**: Electoral, Audit, Editorial Board, Social, Academic, Welfare, Sports, Fundraising.
- **Health Week 2026: Redefine+** and **Pharmalympics 2026**: event series with day-by-day events and albums.
- **Placeholder**: a content item with `isPlaceholder: true`, shown as visibly "coming soon"; never invented content.
- **Content freeze**: point after which no new launch content is accepted.

## Decisions

Record significant decisions with the reason, alternatives and date. Link to existing architecture records instead of duplicating them.

- 2026-10-12: Next.js + TypeScript chosen as the framework; Cloudinary for images and media. **Superseded 2026-10-14.**
- 2026-10-12: Launch target moved to Friday 2026-10-16 (PRD said 2026-10-31).
- 2026-10-12: CGPA calculator added to v1 scope (PRD had excluded it); client-side only, grade scale editable, Faculty to confirm scale.
- 2026-10-12: Member accounts and restricted content deferred to phase 2.
- 2026-10-14: Whole team agreed to switch to MERN (MongoDB, Express, React, Node.js). TypeScript and Cloudinary kept. Admin dashboard with admin-only auth replaces the headless CMS. Reason: team agreement. Alternative was Next.js + headless CMS.
- 2026-10-14: Name follows the constitution ("Nigeria Students"). Sources of truth ranked: constitution > President's 2026/27 announcement > committee write-ups > brand guidelines > PRD.
- 2026-10-14: Committees page shows the 11 committees appointed for 2026/27; constitutional standing committees are described on the Governance page; "Flagship" dropped.
- 2026-10-14: Missing content ships as clearly marked placeholders (`isPlaceholder`), listed for admins; never invented.
- 2026-10-14: CGPA uses the UNILAG standard 5-point scale (A 70-100=5, B 60-69=4, C 50-59=3, D 45-49=2, E 40-44=1, F 0-39=0), confirmed by the Faculty; 2 decimal places.
- 2026-10-14: Brand: primary #0e6434, #07913c, #003463; secondary #ffffff, #e1e8db; accent #ffbd04; Poppins (headings/menus/buttons) and Inter (body). #07913c and #ffbd04 must not carry normal-size text on white.
- 2026-10-15: API errors use one shape `{ error: { code, message, details?, requestId } }` with stable codes (README "Error codes"); clients switch on `code`. Every request gets an `X-Request-Id`. Reason: debuggable support reports and a predictable client contract.
- 2026-10-15: API docs are generated from the same Zod schemas used for validation (zod-openapi, OpenAPI 3.1) and served with Swagger UI at `/api/docs` (on outside production; `API_DOCS_ENABLED` overrides). Every new endpoint is documented in its PR. Alternative was hand-written YAML or JSDoc comments, rejected because they drift from the code.
- 2026-10-15: CGPA follows the Faculty of Pharmacy student handbook §3.5 (p. 22): A 70-100=5 ... E 40-44=1, F 0-39=0 (handbook prints F as "<50", treated as a typo, to confirm); CGPA 2.40-5.00 Pass, 0-2.39 Fail; no degree classes; 1-3 credit units per course. Academic standing rules (§3.7, p. 23) are shown as guidance only, pass mark 2.40. Supersedes the earlier degree-class table.
- 2026-10-15: Senate page shows only the four principal officers (Senate President, Deputy Senate President, Senate Leader, Chief Whip), all placeholders until the Senate election.
- 2026-10-15: Executive cards: office, name, short bio, photo. Names and bios to come from the President; official photos after the October photoshoot (by 31 Oct 2026); silhouette placeholder until then.
- 2026-10-15: Full constitution PDF received (55 pp., 7.1 MB, Canva export; last page has three handwritten signatures, so confirm before publishing). The PDF numbers two articles "18"; the second (Standing Committees) is cited as Art. 19.
- 2026-10-15: Upcoming events 2026/27 (from the PANS leadership): Freshers' Week 30 Nov-4 Dec 2026; Pharmalympics April-May 2027; Health Week 7-11 June 2027; PANS Dinner September 2027. Venues and registration links are placeholders. Events have `datePrecision` ("day" | "month"): month-precision events display as "April - May 2027" and never show an invented day. Executives update events through the dashboard.
- 2026-10-15: Social links: instagram.com/pans_unilag, x.com/PANS_Unilag, youtube.com/@pansunilag3998, linkedin.com/company/pharmaceutical-association-of-nigerian-students-pans-unilag (tracking parameter removed from the Instagram link). Exco names, roles and bios will arrive as one document from the President.
