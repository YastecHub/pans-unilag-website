# PANS UNILAG Website

The official website of the **Pharmaceutical Association of Nigerian Students (PANS), University of Lagos chapter**: a fast, accessible, mobile-first home for the association's news, events, opportunities, publications, history and student services, with an admin dashboard so executives can keep it up to date without a developer.

> **Stack:** MERN (MongoDB, Express, React, Node.js) with TypeScript, plus Cloudinary for images. Agreed by the whole team on 14 October 2026; replaces the earlier Next.js plan.
> **Status:** Pre-development. The repository exists; the client and server apps have not been scaffolded yet.
> **Launch target:** **Friday 16 October 2026**, brought forward from the PRD's original 31 October 2026.
> **Requirements:** *PANS UNILAG Website: Product Requirements Document (PRD) Summary*, plus the team's *Recommendations & Build Plan* doc.

---

## Table of contents

1. [Project goal](#project-goal)
2. [Audience](#audience)
3. [Launch scope (v1)](#launch-scope-v1)
4. [Out of scope for v1](#out-of-scope-for-v1)
5. [Tech stack](#tech-stack)
6. [System overview](#system-overview)
7. [Project structure](#project-structure)
8. [Architecture rules](#architecture-rules)
9. [API reference (planned)](#api-reference-planned)
10. [Data model](#data-model)
11. [Getting started](#getting-started)
12. [Environment variables](#environment-variables)
13. [Images and Cloudinary](#images-and-cloudinary)
14. [CGPA calculator](#cgpa-calculator)
15. [Security, privacy and data protection](#security-privacy-and-data-protection)
16. [Performance, SEO and accessibility](#performance-seo-and-accessibility)
17. [Deployment](#deployment)
18. [Team workflow](#team-workflow)
19. [Timeline](#timeline)
20. [Definition of done](#definition-of-done)
21. [Open decisions](#open-decisions)
22. [Using the AI agent prompts (`.agent/`)](#using-the-ai-agent-prompts-agent)
23. [Maintenance and handover](#maintenance-and-handover)

---

## Project goal

Build and launch a functional, accessible, mobile-friendly PANS UNILAG website that:

- is genuinely useful to PANSites (pharmacy students at UNILAG);
- communicates the association's work and preserves its history;
- can be updated by authorised administrators through an admin dashboard, **without a developer**; and
- can be handed over cleanly to future PANS administrations.

## Audience

| Audience | What they come for |
| --- | --- |
| **PANSites (primary)** | Announcements, events, opportunities, academic tools, publications, feedback |
| PANS executives and committee members | Publishing updates, events, opportunities and gallery albums through the admin dashboard |
| Pharmacy alumni | Staying connected, mentoring, supporting initiatives |
| Prospective students and the wider pharmacy community | Who PANS UNILAG is, what it has achieved, how to engage |

## Launch scope (v1)

Everything below ships on launch day **if its content is approved by the content freeze on Wednesday 14 October (evening)**. Code for an item whose content is late still ships; the content follows the week after.

### Public site

| # | Area | Feature | PRD priority | Notes |
| --- | --- | --- | --- | --- |
| 1 | Home | Landing page | P1 | Pinned announcements, next 3 events, open opportunities, quick links |
| 2 | About | Who we are, history and milestones, impact | P1 | Only **verified** milestones (e.g. first Pharmalympics, first Pharmathon) |
| 3 | People | Current executives, committees, past executives | P1 | IPSF, ADMAP, Flagship and other committees; role emails only, never personal phone numbers |
| 4 | Events | Upcoming events, event detail, month calendar view, "add to calendar" | P1 | Past events archive themselves after their end date |
| 5 | Opportunities | Single hub with type filter and detail pages | P1 | Sorted by closing date; hidden automatically after the deadline |
| 6 | Publications | Recipharm editions, PANS newspaper, Substack | P1 | Approved PDFs or official links only |
| 7 | Connect | Feedback and suggestions form (anonymous option), contact | P1 | Page states who reads submissions and how fast they respond |
| 8 | Legal | Privacy notice | New | Required because forms collect personal data |
| 9 | Academics | **CGPA calculator** | New (added by the team) | Runs in the browser; grade scale editable by admins. See [CGPA calculator](#cgpa-calculator) |
| 10 | Academics | Academic resources (starter set) | P3 → v1 | Vetted links by level and semester; **no copyrighted textbook uploads** |
| 11 | Documents | Constitution and approved documents | P2 → v1 | Approved PDF only |
| 12 | Gallery | Gallery and event archive | P2 → v1 | Albums grouped by event and year; photo consent required |
| 13 | Connect | Alumni connection form | P2 → v1 | Minimal fields, consent checkbox |
| 14 | Site-wide | Light/dark mode | P2 → v1 | Follows system setting, plus a manual toggle |
| 15 | Site-wide | Search and filters | P3 → v1 | MongoDB text search endpoint; filters on Opportunities and Events |
| 16 | Site-wide | 404 page, social link previews, privacy-friendly analytics | New | See [SEO](#performance-seo-and-accessibility) for the link-preview caveat |
| 17 | Site-wide | Install to phone / offline reading (PWA) | New | **Stretch goal**: the first item to drop if time runs short |

### Admin dashboard (`/admin`)

| Priority for Friday | Capability |
| --- | --- |
| **Must** | Secure sign-in for named admins; create, edit, archive and delete **announcements, events and opportunities** |
| **Must** | View feedback and alumni submissions (admins only) |
| Should | Manage executives, committees, publications, documents, resources, grading scale and site settings |
| Should | Upload images to Cloudinary from the dashboard (signed uploads) |
| Could | Gallery album builder with drag-to-reorder |

Anything not editable in the dashboard by Friday is loaded with a **seed script** from the content inventory and moved into the dashboard the following week.

### Site map

```
Home
├── About ─────────── Who we are · History & milestones · Impact
├── People ────────── Current executives · Committees · Past executives
├── Events ────────── Upcoming · Event detail · Past events & gallery
├── Opportunities ─── Listings by deadline · Filter by type · Detail
├── Publications ──── Recipharm · Newspaper & Substack · Constitution & documents
├── Academics ─────── CGPA calculator · Resources by level · External links
└── Connect ───────── Feedback & suggestions · Contact · Privacy notice · Alumni
Header (every page): search · light/dark toggle
Footer (every page): contact email · social links · privacy notice
/admin (not linked publicly): sign-in · content management · submissions
```

## Out of scope for v1

- **Student/member accounts and restricted content.** Only named admins sign in. Student logins and restricted resources are planned for phase 2.
- A complete cross-institutional academic library (see PRD section 4).
- Hosting copyrighted textbooks or internal lecture slides without the owners' written approval.

## Tech stack

| Layer | Choice | Status |
| --- | --- | --- |
| Database | **MongoDB** on MongoDB Atlas, modelled with **Mongoose** | **Decided** |
| API | **Express** on **Node.js**, written in TypeScript | **Decided** |
| Frontend | **React** + TypeScript, built with **Vite**, routing with **React Router** | **Decided** (Vite and React Router proposed) |
| Images and media | **Cloudinary**: `cloudinary` SDK on the server, `@cloudinary/react` + `@cloudinary/url-gen` on the client | **Decided** |
| Validation | **Zod** schemas at every API entry point | Proposed |
| Styling | Tailwind CSS with design tokens as CSS variables | Proposed |
| Server data on the client | TanStack Query (caching, loading and error states) | Proposed |
| Auth (admins only) | Email + password, hashed with argon2 or bcrypt; session JWT in an `httpOnly`, `Secure`, `SameSite` cookie | Proposed |
| Testing | Vitest (client and server logic), Supertest (API), Playwright (smoke tests) | Proposed |
| Hosting | Client: Vercel, Netlify or Cloudflare Pages (static). API: Render. Database: MongoDB Atlas | Proposed, see [Deployment](#deployment) |
| Node.js | **22 LTS** recommended (current Vite needs Node 20.19+ or 22.12+) | Required |
| Repository | One repo, **npm workspaces**: `client/` and `server/` | Proposed |

## System overview

```
 Browser (React SPA)                     Express API (Node.js)                MongoDB Atlas
 ┌──────────────────────┐   HTTPS/JSON   ┌───────────────────────────┐        ┌──────────────┐
 │ Public pages         │ ─────────────▶ │ /api/*  public, read-only │ ─────▶ │ collections  │
 │ CGPA calculator      │                │ /api/feedback, /alumni    │        │ (Mongoose)   │
 │ /admin dashboard     │ ─ cookie auth ▶│ /api/admin/* (auth only)  │        └──────────────┘
 └──────────┬───────────┘                └─────────────┬─────────────┘
            │ optimised image URLs                     │ signs uploads (API secret)
            ▼                                          ▼
                         Cloudinary (image storage + delivery CDN)
```

The browser never sees database credentials or the Cloudinary API secret. Admin image uploads go **directly from the browser to Cloudinary** using a short-lived signature issued by the API.

## Project structure

The layout follows [`.agent/architect.md`](.agent/architect.md): for a Node.js API, `src/modules/<feature>/{http,application,domain,infrastructure}` with app assembly separate from server startup; for a React SPA, `src/features/<feature>/{components,hooks,api}` with shared UI primitives and router assembly. Create folders when a feature needs them; do not commit empty layers.

```
pans-unilag-website/
├── .agent/                          # AI-assistant role prompts (currently git-ignored)
├── client/                          # React + Vite + TypeScript SPA
│   ├── public/                      # favicon, manifest, robots.txt, default Open Graph image
│   ├── src/
│   │   ├── app/                     # App assembly only
│   │   │   ├── router.tsx           # Route table (public routes + lazy-loaded /admin)
│   │   │   ├── providers.tsx        # QueryClient, theme, auth context
│   │   │   └── layouts/             # PublicLayout (header/footer), AdminLayout
│   │   ├── features/                # One folder per business feature
│   │   │   ├── home/
│   │   │   ├── about/
│   │   │   ├── people/
│   │   │   ├── events/
│   │   │   │   ├── api/             # Typed fetchers + query hooks (useEvents, useEvent)
│   │   │   │   ├── components/      # EventCard, EventList, CalendarMonth, AddToCalendar
│   │   │   │   └── pages/           # EventsPage, EventDetailPage (wired in router.tsx)
│   │   │   ├── opportunities/
│   │   │   ├── publications/
│   │   │   ├── gallery/
│   │   │   ├── academics/
│   │   │   │   └── cgpa/            # Calculator UI + pure maths in model/ (unit tested)
│   │   │   ├── connect/             # Feedback, alumni, contact
│   │   │   ├── search/
│   │   │   └── admin/               # Dashboard screens, sign-in, resource editors
│   │   ├── components/
│   │   │   ├── layout/              # Header, Footer, Navigation, SkipLink
│   │   │   └── ui/                  # Domain-neutral primitives: Button, Card, Badge, ThemeToggle
│   │   ├── lib/                     # http client, cloudinary helpers, dates (Africa/Lagos), env
│   │   └── styles/                  # globals.css, design tokens
│   └── index.html
├── server/                          # Express + TypeScript API
│   ├── src/
│   │   ├── app.ts                   # Builds the Express app: middleware, routes, error handler
│   │   ├── server.ts                # Starts the HTTP server and connects to MongoDB
│   │   ├── config/                  # env.ts (validated with Zod), db.ts, cloudinary.ts
│   │   ├── middleware/              # requireAdmin, validate, rateLimit, errorHandler, notFound
│   │   └── modules/                 # One folder per business feature
│   │       ├── events/
│   │       │   ├── http/            # events.routes.ts, events.controller.ts, events.schemas.ts
│   │       │   ├── application/     # events.service.ts (use cases)
│   │       │   ├── domain/          # event.rules.ts (pure: isUpcoming, archive rules)
│   │       │   └── infrastructure/  # event.model.ts (Mongoose)
│   │       ├── announcements/
│   │       ├── opportunities/
│   │       ├── people/              # executives + committees
│   │       ├── milestones/
│   │       ├── publications/
│   │       ├── gallery/
│   │       ├── documents/
│   │       ├── resources/
│   │       ├── grading/             # grading scale for the CGPA calculator
│   │       ├── submissions/         # feedback + alumni
│   │       ├── search/
│   │       ├── settings/
│   │       ├── media/               # Cloudinary upload signatures
│   │       └── auth/                # admin users, sign-in, sessions
│   ├── scripts/
│   │   ├── seed.ts                  # Loads launch content from seed/*.json
│   │   └── create-admin.ts          # Creates an admin account from the command line
│   ├── seed/                        # JSON exported from the content inventory
│   └── tests/                       # Supertest API tests
├── tests/e2e/                       # Playwright smoke tests (public journeys + admin sign-in)
├── package.json                     # npm workspaces root: scripts that run client + server
├── .gitattributes
├── .gitignore
└── README.md
```

Client and server do **not** import from each other. The client describes API responses with its own TypeScript types in each feature's `api/` folder.

## Architecture rules

These come from the `.agent` role prompts and apply to every pull request.

1. **Thin HTTP layer.** Express routes and controllers parse the request, validate it with Zod, call a service and shape the response. Business rules live in `application/` and `domain/`; Mongoose stays in `infrastructure/`.
2. **Validate every input on the server**, including admin requests. Reject unknown fields. A hidden button in the UI is not authorisation.
3. **Return only intended fields.** Never send password hashes, internal notes or submitters' details to public endpoints.
4. **Secrets stay on the server.** `MONGODB_URI`, `JWT_SECRET` and `CLOUDINARY_API_SECRET` exist only in server environment variables. Anything prefixed `VITE_` is public, because it ends up in the browser bundle.
5. **Pure logic is testable.** Date rules (archiving), deadlines and CGPA maths are pure functions with unit tests.
6. **Every screen handles all states:** loading, empty ("No open opportunities right now"), error and not-found, not only the happy path.
7. **The admin area is code-split.** `/admin` is lazy-loaded so public visitors never download dashboard code.
8. **No new libraries without a reason.** Agree additions in a pull request.

## API reference (planned)

All responses are JSON. Lists support `?page=` and `?limit=` (max 50). Dates are ISO 8601; the site displays them in **Africa/Lagos** time.

### Public

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health check for hosting and uptime monitoring |
| GET | `/api/settings` | Contact email, social links, quick links, home banner |
| GET | `/api/announcements` | Active (not expired) announcements, pinned first |
| GET | `/api/events?status=upcoming\|past&month=YYYY-MM` | Events list or calendar month |
| GET | `/api/events/:slug` | One event |
| GET | `/api/opportunities?type=` | Open opportunities, closing soonest first |
| GET | `/api/opportunities/:slug` | One opportunity |
| GET | `/api/executives?session=2026/2027` | Executives for a session (defaults to current) |
| GET | `/api/committees` | Committees |
| GET | `/api/milestones` | History timeline |
| GET | `/api/publications?series=` | Publications |
| GET | `/api/gallery`, `/api/gallery/:slug` | Albums and one album |
| GET | `/api/documents` | Latest approved documents |
| GET | `/api/resources?level=&semester=` | Academic resource links |
| GET | `/api/grading-scale` | Grade scale for the CGPA calculator |
| GET | `/api/search?q=` | Search across events, opportunities, publications and resources |
| POST | `/api/feedback` | Submit feedback (rate-limited, anonymous allowed) |
| POST | `/api/alumni` | Submit alumni details (rate-limited, consent required) |

### Admin (signed-in admins only)

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/login`, `/api/auth/logout` | Sign in and out (login is rate-limited) |
| GET | `/api/auth/me` | Current admin |
| GET, POST | `/api/admin/:resource` | List and create (`announcements`, `events`, `opportunities`, `executives`, …) |
| GET, PATCH, DELETE | `/api/admin/:resource/:id` | Read, update, archive or delete one item |
| GET | `/api/admin/submissions/feedback`, `/api/admin/submissions/alumni` | View submissions |
| POST | `/api/admin/media/signature` | Short-lived Cloudinary upload signature |

## Data model

MongoDB collections (one Mongoose model each). Every item that goes out of date has a date field, so the API stops returning it automatically (PRD section 5: "outdated opportunities or event notices should be archived").

| Collection | Key fields | Automatic behaviour / indexes |
| --- | --- | --- |
| `announcements` | title, body, publishAt, expiresAt, pinned | Hidden after `expiresAt`; index on `expiresAt` |
| `events` | title, slug (unique), startsAt, endsAt, venue, description, coverImage, registrationUrl, committee | Upcoming vs past by `endsAt`; text index for search |
| `opportunities` | title, slug (unique), type, eligibility, deadline, applyUrl, lastCheckedAt | Hidden after `deadline`; flagged if not checked in 30 days |
| `executives` | name, role, session, photo, bio (≤ 60 words), roleEmail, order | Earlier sessions build Past Executives |
| `committees` | name, purpose, lead, activities, contact | None |
| `milestones` | year, title, description, verifiedBy | Sorted by year |
| `publications` | title, series (`recipharm`, `newspaper`, `substack`), edition, date, cover, fileUrl or link | Grouped by series and year |
| `albums` | title, slug, eventRef, date, cover, photos[] (publicId, caption, alt), consentConfirmed | Grouped by year |
| `documents` | title, version, approvedOn, approvedBy, fileUrl | Latest approved version shown |
| `resources` | title, level, semester, course, url, verifiedBy | Grouped by level and semester |
| `gradingscales` | grade, minScore, maxScore, gradePoint, active | Feeds the CGPA calculator |
| `settings` | contactEmail, socialLinks, quickLinks, homeBanner | Single document |
| `feedback` | category, message, contactEmail (optional), createdAt, status | **Admin-only.** Deleted after 12 months |
| `alumni` | name, graduationYear, email, phone (optional), interests[], consentAt | **Admin-only.** Kept until the person opts out |
| `admins` | name, email (unique), passwordHash, role (`admin`, `editor`), lastLoginAt | Never returned by any public endpoint |

Images are stored in Cloudinary; MongoDB stores only the Cloudinary `publicId`, alt text and caption. **Alt text is required** on every image, and `verifiedBy` on every milestone and resource.

## Getting started

### Prerequisites

- Node.js **22 LTS** and npm
- Git
- A MongoDB connection string (a personal free Atlas cluster for development, or local MongoDB)
- Cloudinary credentials (ask the web lead; use a separate development folder)

### One-time scaffold (web lead only)

```bash
# at the repository root
npm init -y                                   # then add "workspaces": ["client", "server"] to package.json
npm create vite@latest client -- --template react-ts
mkdir server && cd server && npm init -y && cd ..
npm install -w server express mongoose zod cors helmet cookie-parser express-rate-limit jsonwebtoken argon2 cloudinary
npm install -w server -D typescript tsx @types/node @types/express @types/cors @types/cookie-parser @types/jsonwebtoken
npm install -w client react-router @tanstack/react-query @cloudinary/react @cloudinary/url-gen
```

Then add `server/tsconfig.json`, root scripts that run both apps together (for example with `concurrently`), and `.env.example` files for both apps. Check each package's current documentation for exact versions and setup.

### Everyday development (once scaffolded)

```bash
npm install                      # installs both workspaces
cp server/.env.example server/.env    # fill in values; never commit .env
cp client/.env.example client/.env
npm run seed -w server           # load launch content into your database
npm run dev                      # client on http://localhost:5173, API on http://localhost:4000
npm run lint                     # lint both workspaces
npm run test                     # unit and API tests
npm run build                    # production builds: run before opening a PR
```

## Environment variables

### `server/.env`

| Variable | Purpose | Secret? |
| --- | --- | --- |
| `NODE_ENV` | `development` or `production` | No |
| `PORT` | API port (default 4000) | No |
| `MONGODB_URI` | Atlas connection string | **Yes** |
| `CLIENT_ORIGIN` | Allowed CORS origin(s), e.g. the production site URL | No |
| `JWT_SECRET` | Signs admin session tokens (long random value) | **Yes** |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account | No |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Keep private |
| `CLOUDINARY_API_SECRET` | Signs uploads | **Yes** |

### `client/.env`

| Variable | Purpose | Secret? |
| --- | --- | --- |
| `VITE_API_URL` | Base URL of the API | No (public) |
| `VITE_CLOUDINARY_CLOUD_NAME` | Builds image URLs | No (public) |
| `VITE_SITE_URL` | Canonical URL for links and previews | No (public) |

Production values live in the hosting providers' environment settings. **Never commit `.env` files.**

## Images and Cloudinary

- Render every Cloudinary image with `AdvancedImage` from `@cloudinary/react`, using automatic format and quality (`f_auto`, `q_auto`) and a width suited to where it appears. Always set `alt`, `width`, `height` and `loading="lazy"` below the fold.
- Organise uploads by folder:

```
pans-unilag/
├── executives/<session>/        # e.g. executives/2026-2027/
├── committees/
├── events/<yyyy>/<event-slug>/
├── gallery/<yyyy>/<album-slug>/
├── publications/<series>/
└── site/                        # logos, banners, Open Graph images
```

- Admin uploads are **signed**: the dashboard asks `POST /api/admin/media/signature`, then uploads straight to Cloudinary. Never create an unsigned upload preset.
- Upload originals no larger than about 2500 px on the long edge. Only upload photos with consent, and remove any photo on request.

## CGPA calculator

- Runs entirely in the browser. **Nothing the student enters is stored or sent anywhere.** It only fetches the grade scale from `/api/grading-scale`.
- Students add courses (code optional, units, score or grade); the calculator shows the semester GPA and running CGPA.
- Admins edit the grade scale in the dashboard, so corrections need no code change.
- **The Pharm.D grade points and pass marks must be confirmed by the Faculty (via the Academic Secretary) before launch.** Until then, the page shows: *"Unofficial estimate. Your official result is the one issued by the University."*
- The maths lives in `client/src/features/academics/cgpa/model` as pure functions with unit tests covering rounding, zero-unit courses, empty input and failed courses.

## Security, privacy and data protection

Owning a backend and database means PANS now stores personal data and runs a sign-in system. These are launch requirements, not extras:

- **Admin sign-in:** passwords hashed with argon2 (or bcrypt); session token in an `httpOnly`, `Secure`, `SameSite=Lax` cookie; login rate-limited; no public sign-up (admins are created with `scripts/create-admin.ts`); at least two admins at all times.
- **API hardening:** `helmet` security headers, a CORS allowlist (`CLIENT_ORIGIN` only), Zod validation that rejects unknown fields, rate limits on `/api/feedback`, `/api/alumni` and `/api/auth/login`, and a request size limit.
- **No injection:** never pass raw request objects into Mongoose queries; validate and pick fields explicitly.
- **Forms:** feedback can be anonymous (no name or email required). Alumni submissions require a consent checkbox. Only admins can read submissions, and the privacy notice states who reads them, why, how long they are kept and how to request deletion.
- **Backups:** the free Atlas tier has **no automatic backups**. Run `mongodump` at least weekly and before every major change, and store the dumps somewhere only the web lead and one executive can reach.
- **Nigeria Data Protection Act 2023:** the site now holds personal data in its own database. Confirm with the Faculty or UNILAG's data protection office whether PANS needs its own NDPC registration. This README is not legal advice.
- Use the `.agent/red-team.md` prompt for a security review of the auth and submissions modules before launch.

## Performance, SEO and accessibility

| Target | Threshold |
| --- | --- |
| Home page weight (first load, mobile) | **< 1 MB** including JavaScript |
| Initial JavaScript for public pages | Keep small; `/admin` is code-split |
| Lighthouse (mobile): Performance, Accessibility, Best Practices, SEO | **≥ 90** each |
| Accessibility | **WCAG 2.1 AA**: 4.5:1 text contrast, keyboard navigation, visible focus, alt text, no text inside images |
| Fonts | One web font at most, or system fonts |
| Real-device check | Mid-range Android phone on a throttled 3G/4G connection before sign-off |

**Link previews and search engines:** a React single-page app builds pages in the browser. WhatsApp, X and many crawlers do **not** run JavaScript, so a shared link to a specific event would show only the site-wide preview. For v1, set good site-wide Open Graph tags in `client/index.html`. After launch, have Express inject per-page titles and preview images for event and opportunity URLs, or pre-render those pages.

## Deployment

| Part | Proposed host | Notes |
| --- | --- | --- |
| Client (static build) | Vercel, Netlify or Cloudflare Pages | Free tiers suit a static site; add an SPA fallback rewrite to `index.html` |
| API | Render | **Free instances sleep after 15 minutes without traffic and take about a minute to wake**, so the first visitor after a quiet spell would wait. The always-on Starter instance costs about $7/month. See [Open decisions](#open-decisions) |
| Database | MongoDB Atlas free cluster (M0) | 512 MB storage, no automatic backups, pauses after 30 days with no connections |
| Images | Cloudinary | Free plan; confirm usage limits on the pricing page |

All accounts are owned by the **official PANS account**, never a personal one.

## Team workflow

### Git

- The repository is on GitHub at `YastecHub/pans-unilag-website`. Move it to an organisation owned by the official PANS account before handover.
- `main` is protected: changes land only through pull requests with at least **one approving review** and passing checks.
- Branch names: `feat/<area>-<short-description>`, `fix/...`, `docs/...`, `chore/...` (for example `feat/server-events-api`, `feat/client-events-page`).
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org): `feat(server): add opportunities endpoints`.
- Each pull request: one feature or fix, a short description, screenshots at mobile and desktop width for UI changes, and lint, tests and build passing locally.

### Roles

| Role | Responsibility | Person |
| --- | --- | --- |
| Web lead | Architecture, reviews, deployments, accounts | TBD |
| Backend developers | Express modules, Mongoose models, auth, seed scripts | TBD |
| Frontend developers | Public pages, CGPA calculator, admin dashboard | TBD |
| Design | Visual identity, tokens, key screens, mobile-first layouts | TBD |
| Editor-in-Chief | Editorial process, content inventory, copy approval | Anu (EIC) |
| Writers and researchers | Verified content, history, profiles, opportunities | TBD |
| Approvers | History, profiles, publications, health content sign-off | TBD |

Content is tracked in one shared inventory sheet (page, owner, status, approver). It is exported to `server/seed/*.json` for the seed script.

## Timeline

The stack changed on Wednesday, so the remaining two days are tight. Build in this order and cut from the bottom of each list if needed.

| Day | Backend | Frontend | Content and approvals |
| --- | --- | --- | --- |
| **Wed 14 Oct** | Scaffold workspaces; Mongoose models; public read endpoints; seed script | Scaffold Vite app; layout, navigation, theme; Home, Events, Opportunities pages | **Content freeze (evening)**; grading scale confirmed |
| **Thu 15 Oct** | Admin auth; admin CRUD for announcements, events, opportunities; submissions; upload signatures; security pass | Remaining public pages; CGPA calculator; admin sign-in and editors; forms | Content seeded and entered; **executive review and approval** |
| **Fri 16 Oct** | Deploy API and database; backups; smoke tests | Deploy client; Lighthouse and accessibility checks | **Launch announcement** |
| Week after | Remaining admin editors; per-page link previews | Gallery builder; PWA if dropped | Late content added through the dashboard |

## Definition of done

From PRD section 9. The site is ready to launch when:

- [ ] All agreed launch pages are complete and display correctly on mobile and desktop.
- [ ] Navigation, buttons, external links and forms have been tested.
- [ ] Content has been reviewed for accuracy, spelling, permissions and appropriate access.
- [ ] The website has a named administrator and a documented update process (admin dashboard guide).
- [ ] Admin sign-in, validation, rate limits and CORS are in place; secrets are only in server environment variables.
- [ ] A database backup has been taken and restored once as a test.
- [ ] Performance and accessibility targets above are met.
- [ ] The executive team has reviewed and approved the launch version.

## Open decisions

| Decision | Recommended default | Decide by |
| --- | --- | --- |
| API hosting budget | Render Starter (about $7/month) so the API never sleeps; otherwise accept a slow first load after quiet periods | Wed 14 Oct |
| Client host | Vercel, Netlify or Cloudflare Pages (any static host) | Wed 14 Oct |
| Domain | A `.com.ng` or `.org.ng` name registered for 2+ years with auto-renew | Wed 14 Oct |
| Forms on Friday | Store in MongoDB via the API; if admin screens slip, embed Tally or Google Forms for launch | Wed 14 Oct |
| Admins at launch | At least two named admins (e.g. General Secretary and PRO) plus the web lead | Thu 15 Oct |
| Feedback reviewer and response time | General Secretary plus one other executive; reply within 7 days | Thu 15 Oct |
| CGPA grading scale | Confirmed by the Faculty via the Academic Secretary | Wed 14 Oct |

## Using the AI agent prompts (`.agent/`)

The `.agent/` folder contains reusable role prompts (orchestrator, architect, engineer, database specialist, react engineer, red team, accessibility reviewer, test engineer and more). They are plain Markdown instructions, not running agents. Tell your coding assistant explicitly which ones to apply, for example:

> Read and apply `.agent/engineer.md`, `.agent/database-specialist.md` and `.agent/project-context.md`. Implement the events module in `server/src/modules/events` as described in the README.

Notes:

- **`.agent/` is currently listed in `.gitignore`, so teammates who clone the repo will not get it.** Remove that line if the whole team should share the prompts.
- The prompts refer to `agent/…` paths; in this repository the folder is **`.agent/`**.
- Keep confirmed facts in [`.agent/project-context.md`](.agent/project-context.md) so every role starts from the same context.
- Useful roles for this stack: `engineer`, `database-specialist`, `react-engineer`, `frontend-specialist`, `red-team`, `accessibility-reviewer`, `test-engineer`, `devops-engineer`. The Next.js, payments and background-job roles do not apply.

## Maintenance and handover

- **Ownership:** domain, hosting, MongoDB Atlas, Cloudinary, GitHub and analytics are all owned by the official PANS account, with **at least two admins** on each and two-factor sign-in on.
- **Monthly checklist:** check external links, review open opportunities, update events and executives, remove expired announcements, take a database backup, and update dependencies (`npm outdated`, `npm audit`).
- **Each election:** create admin accounts for the incoming administration, remove departing admins, update the executives session and record the handover date here.
- **Admin guide:** a one-page "How to post an event or opportunity" guide with screenshots of the dashboard will live in `docs/admin-guide.md` before handover.

---

*Maintained by the PANS UNILAG web team. Requirements are owned by the PANS UNILAG executive council.*
