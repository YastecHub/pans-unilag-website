# Project context

Fill this from confirmed requirements and inspected code. Leave unknown items as `Unknown`; do not invent product rules. This file describes this project, not universal defaults.

| Field | Value |
| --- | --- |
| Solution purpose and users | Official website of PANS UNILAG (Pharmaceutical Association of Nigerian Students, University of Lagos). Primary users: UNILAG pharmacy students (PANSites). Secondary: executives (via admin dashboard), alumni, prospective students, wider pharmacy community. See README.md and the PRD |
| Repository/workspace layout | One repo, npm workspaces: `client/` (React SPA: `src/app`, `src/features/<feature>/{api,components,pages}`, `src/components/{layout,ui}`) and `server/` (Express API: `src/app.ts`, `src/server.ts`, `src/config`, `src/middleware`, `src/modules/<feature>/{http,application,domain,infrastructure}`). Not yet scaffolded. See README.md > Project structure |
| Runtime and package manager | Node.js 22 LTS (Vite needs 20.19+ or 22.12+); npm with workspaces |
| Framework versions and router | MERN: React + Vite + React Router (client); Express (server). Versions to be confirmed from package.json after scaffold |
| JavaScript/TypeScript and module system | TypeScript, strict mode, in both client and server; ESM |
| Database, ORM and transaction support | MongoDB Atlas (free M0 proposed: 512 MB, no automatic backups) with Mongoose. Single-document writes; no multi-document transactions needed in v1 |
| Authentication and tenant model | Visitors: no accounts, all public content. Admins only: email + password (argon2/bcrypt), JWT session in httpOnly Secure SameSite cookie, roles `admin` and `editor`, no public sign-up. Student accounts deferred to phase 2 |
| Jobs, queues and external providers | Cloudinary (server `cloudinary` SDK signs uploads; client `@cloudinary/react` + `@cloudinary/url-gen` renders). No queues. Weekly manual `mongodump` backups |
| Deployment target and runtime constraints | Proposed: client static on Vercel/Netlify/Cloudflare Pages; API on Render (free tier sleeps after 15 min idle, ~1 min cold start; Starter ~$7/month stays on); DB on MongoDB Atlas. Must load well on Nigerian mobile data |
| Critical invariants and state transitions | Events move to Past after `endsAt`; opportunities hidden after `deadline`; announcements hidden after `expiresAt`. Feedback/alumni submissions and admin records are never returned by public endpoints. CGPA calculator stores no user data |
| Currency/rounding and timezone rules | Timezone Africa/Lagos (WAT, UTC+1) for display and date rules; store UTC. CGPA rounding rule Unknown: to be confirmed with the Faculty |
| Design system and accessibility target | Tailwind CSS with design tokens as CSS variables (proposed); light/dark themes; WCAG 2.1 AA; Lighthouse mobile >= 90 |
| Existing install/dev/build/lint/typecheck/test commands | Unknown until scaffold. Planned: npm install, npm run dev (both apps), npm run seed -w server, npm run lint, npm run test, npm run build. Vitest, Supertest, Playwright |
| Testing policy and required CI gates | Follow applicable project/user instructions; use proportionate verification |
| Authorized environments and deployment scope | Local work unless otherwise authorized |

## Domain language

Record terms that have a specific meaning here, including lifecycle states and ownership boundaries.

- **PANS**: Pharmaceutical Association of Nigerian Students. **PANSite**: a member (UNILAG pharmacy student).
- **EIC**: Editor-in-Chief; coordinates the editorial process (currently Anu).
- **Recipharm**: PANS UNILAG publication, published in editions.
- **IPSF, ADMAP, Flagship**: PANS committees/initiatives.
- **Pharmalympics, Pharmathon**: PANS flagship events.
- **Session**: an executive term, written `2026/2027`.
- **Content freeze**: the point after which no new launch content is accepted.

## Decisions

Record significant decisions with the reason, alternatives and date. Link to existing architecture records instead of duplicating them.

- 2026-10-12: Next.js + TypeScript chosen as the framework; Cloudinary for images and media. **Superseded 2026-10-14.**
- 2026-10-12: Launch target moved to Friday 2026-10-16 (PRD said 2026-10-31).
- 2026-10-12: CGPA calculator added to v1 scope (PRD had excluded it); client-side only, grade scale editable, Faculty to confirm scale.
- 2026-10-12: Member accounts and restricted content deferred to phase 2.
- 2026-10-14: Whole team agreed to switch to MERN (MongoDB, Express, React, Node.js). TypeScript and Cloudinary kept. Admin dashboard with admin-only auth replaces the headless CMS. Reason: team agreement. Alternative was Next.js + headless CMS.
