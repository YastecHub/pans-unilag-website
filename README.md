# PANS UNILAG Website

The official website of the **Pharmaceutical Association of Nigerian Students (PANS), University of Lagos chapter**: a fast, accessible, mobile-first home for the association's news, events, opportunities, publications, history and student services.

> **Status:** Pre-development. The repository is initialised; the Next.js app has not been scaffolded yet.
> **Launch target:** **Friday 16 October 2026**, brought forward from the PRD's original 31 October 2026.
> **Source of truth for requirements:** *PANS UNILAG Website: Product Requirements Document (PRD) Summary*, plus the team's *Recommendations & Build Plan* doc.

---

## Table of contents

1. [Project goal](#project-goal)
2. [Audience](#audience)
3. [Launch scope (v1)](#launch-scope-v1)
4. [Out of scope for v1](#out-of-scope-for-v1)
5. [Tech stack](#tech-stack)
6. [Project structure](#project-structure)
7. [Architecture rules](#architecture-rules)
8. [Getting started](#getting-started)
9. [Environment variables](#environment-variables)
10. [Content model](#content-model)
11. [Images and Cloudinary](#images-and-cloudinary)
12. [CGPA calculator](#cgpa-calculator)
13. [Forms, privacy and data protection](#forms-privacy-and-data-protection)
14. [Performance and accessibility targets](#performance-and-accessibility-targets)
15. [Team workflow](#team-workflow)
16. [Timeline](#timeline)
17. [Definition of done](#definition-of-done)
18. [Open decisions](#open-decisions)
19. [Using the AI agent prompts (`.agent/`)](#using-the-ai-agent-prompts-agent)
20. [Maintenance and handover](#maintenance-and-handover)

---

## Project goal

Build and launch a functional, accessible, mobile-friendly PANS UNILAG website that:

- is genuinely useful to PANSites (pharmacy students at UNILAG);
- communicates the association's work and preserves its history;
- can be updated by authorised administrators **without a developer**; and
- can be handed over cleanly to future PANS administrations.

## Audience

| Audience | What they come for |
| --- | --- |
| **PANSites (primary)** | Announcements, events, opportunities, academic tools, publications, feedback |
| PANS executives and committee members | Publishing updates, events, opportunities and gallery albums |
| Pharmacy alumni | Staying connected, mentoring, supporting initiatives |
| Prospective students and the wider pharmacy community | Who PANS UNILAG is, what it has achieved, how to engage |

## Launch scope (v1)

Everything below ships on launch day **if its content is approved by the content freeze on Wednesday 14 October (evening)**. Items whose content is not ready move to the following week; the code still ships.

| # | Area | Feature | PRD priority | Notes |
| --- | --- | --- | --- | --- |
| 1 | Home | Landing page | P1 | Pinned announcements, next 3 events, open opportunities, quick links |
| 2 | About | Who we are, history and milestones, impact | P1 | Only **verified** milestones (e.g. first Pharmalympics, first Pharmathon) |
| 3 | People | Current executives, committees, past executives | P1 | IPSF, ADMAP, Flagship and other committees; role emails only, never personal phone numbers |
| 4 | Events | Upcoming events, event detail, month calendar view, "add to calendar" | P1 | Past events archive themselves automatically after their date |
| 5 | Opportunities | Single opportunities hub with type filter and detail pages | P1 | Sorted by closing date; hidden automatically after the deadline |
| 6 | Publications | Recipharm editions, PANS newspaper, Substack | P1 | Approved PDFs or official links only |
| 7 | Connect | Feedback and suggestions form (anonymous option), contact | P1 | Page states who reads submissions and how fast they respond |
| 8 | Legal | Privacy notice | New | Required because forms collect personal data |
| 9 | Academics | **CGPA calculator** | New (added by the team) | Client-side only; grade scale editable by admins. See [CGPA calculator](#cgpa-calculator) |
| 10 | Academics | Academic resources (starter set) | P3 → v1 | Vetted links by level and semester; **no copyrighted textbook uploads** |
| 11 | Documents | Constitution and approved documents | P2 → v1 | Approved PDF only |
| 12 | Gallery | Gallery and event archive | P2 → v1 | Albums grouped by event and year; photo consent required |
| 13 | Connect | Alumni connection form | P2 → v1 | Minimal fields, consent checkbox |
| 14 | Site-wide | Light/dark mode | P2 → v1 | Follows system setting, plus a manual toggle |
| 15 | Site-wide | Site search and filters | P3 → v1 | Static search index; filters on Opportunities and Events |
| 16 | Site-wide | 404 page, social link previews (Open Graph), privacy-friendly analytics | New | Small, high-value additions |
| 17 | Site-wide | Install to phone / offline reading (PWA) | New | **Stretch goal**: the first item to drop if time runs short |

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
```

## Out of scope for v1

- **Member accounts and restricted content.** Logins and stored student data need security testing that cannot be done properly by launch. Planned for phase 2, together with restricted academic resources.
- A complete cross-institutional academic library (see PRD section 4).
- Hosting copyrighted textbooks or internal lecture slides without the owners' written approval.

## Tech stack

| Concern | Choice | Status |
| --- | --- | --- |
| Framework | [Next.js](https://nextjs.org/docs) (App Router, current stable 16.x) | **Decided** |
| Language | TypeScript (strict mode) | **Decided** |
| Images and media | [Cloudinary](https://cloudinary.com/documentation) via [`next-cloudinary`](https://next.cloudinary.dev) | **Decided** |
| Styling | Tailwind CSS (the `create-next-app` default) with design tokens as CSS variables | Proposed |
| Content management | Headless CMS so admins edit without a developer. Recommended: Sanity, with Cloudinary as the image source | **To decide** (see [Open decisions](#open-decisions)) |
| Forms | Embedded Tally or Google Forms owned by the official PANS account | Proposed |
| Search | Static search index built at deploy time (e.g. Pagefind) | Proposed |
| Testing | Vitest for unit tests (CGPA maths, date and archive logic); Playwright smoke tests for key journeys | Proposed |
| Hosting | Vercel (Hobby plan is for non-commercial use; confirm it fits PANS) | Proposed |
| Analytics | Privacy-friendly analytics (no cookies, no personal data) | Proposed |
| Node.js | **20.9 or later** (Next.js minimum); use the current LTS | Required |

## Project structure

The layout follows the Next.js guidance in [`.agent/architect.md`](.agent/architect.md) and [`.agent/frontend-specialist.md`](.agent/frontend-specialist.md): **routes in `src/app`, feature UI in `src/features/<feature>`, and server-only code in `src/server`**. Create folders when a feature needs them; do not commit empty layers.

```
pans-unilag-website/
├── .agent/                      # Reusable AI-assistant role prompts (see section below)
├── public/                      # Static files: favicon, manifest, robots assets
├── src/
│   ├── app/                     # Routes only (App Router). Thin: fetch data, compose features
│   │   ├── layout.tsx           # Root layout: header, footer, theme, fonts, metadata
│   │   ├── page.tsx             # Home
│   │   ├── about/               # /about, /about/history, /about/impact
│   │   ├── people/              # /people/executives, /people/committees, /people/past-executives
│   │   ├── events/              # /events, /events/[slug]
│   │   ├── opportunities/       # /opportunities, /opportunities/[slug]
│   │   ├── publications/        # /publications, /publications/documents
│   │   ├── gallery/             # /gallery, /gallery/[album]
│   │   ├── academics/           # /academics/cgpa-calculator, /academics/resources
│   │   ├── connect/             # /connect/feedback, /connect/alumni, /connect/contact
│   │   ├── privacy/             # /privacy
│   │   ├── not-found.tsx        # 404 page
│   │   ├── sitemap.ts           # Generated sitemap.xml
│   │   └── robots.ts            # Generated robots.txt
│   ├── features/                # One folder per business feature
│   │   ├── events/
│   │   │   ├── components/      # EventCard, EventList, CalendarMonth, AddToCalendar
│   │   │   └── model/           # Types and pure logic (e.g. upcoming vs past)
│   │   ├── opportunities/
│   │   ├── people/
│   │   ├── publications/
│   │   ├── gallery/
│   │   ├── resources/
│   │   ├── cgpa/
│   │   │   ├── components/      # Calculator UI (client component)
│   │   │   └── model/           # Pure grade-point and CGPA maths + unit tests
│   │   └── search/
│   ├── components/
│   │   ├── layout/              # Header, Footer, Navigation, SkipLink
│   │   └── ui/                  # Domain-neutral primitives: Button, Card, Badge, ThemeToggle
│   ├── server/                  # Server-only code. Never imported by client components
│   │   ├── content/             # CMS client and typed queries, one file per content type
│   │   └── cloudinary/          # Signed-upload and admin helpers (uses the API secret)
│   ├── lib/                     # Shared helpers safe for both sides: env validation, dates, formatting
│   └── styles/                  # globals.css and design tokens (colours, spacing, type scale)
├── tests/
│   └── e2e/                     # Playwright smoke tests for key journeys
├── .env.example                 # Documented variable names, no real values (to be added at scaffold)
├── .gitattributes
├── .gitignore
└── README.md
```

## Architecture rules

These come from the `.agent` role prompts and apply to every pull request.

1. **Routes are thin.** `src/app/**/page.tsx` files fetch data through `src/server/content` and compose components from `src/features`. Business logic does not live in route files.
2. **Server Components by default.** Add `"use client"` only to interactive leaves (calendar navigation, filters, theme toggle, CGPA calculator, search box). Keep client bundles small.
3. **Secrets stay on the server.** `CLOUDINARY_API_SECRET` and CMS tokens are used only inside `src/server/**`. Mark those modules with `import "server-only"`. Only variables prefixed `NEXT_PUBLIC_` reach the browser.
4. **Shared UI must be domain-neutral.** A component moves to `src/components/ui` only when it has no PANS-specific knowledge. Otherwise it stays in its feature folder.
5. **Pure logic is testable.** Date rules (archiving), opportunity deadlines and CGPA maths live in `model/` files as pure functions with unit tests.
6. **Every page handles all states:** loading, empty ("No open opportunities right now"), error and not-found, not only the happy path.
7. **No new libraries without a reason.** Do not add a global state store, UI kit or data-fetching library unless a concrete need is agreed in a PR.

## Getting started

### Prerequisites

- Node.js **20.9+** (current LTS recommended) and npm
- Git
- Access to the official PANS Cloudinary account (ask the web lead)

### One-time scaffold (web lead only)

`create-next-app` refuses to scaffold into a folder that already contains files such as this README. Scaffold into a temporary folder and move the files across:

```bash
# from the parent folder of this repository
npx create-next-app@latest pans-scaffold --ts --eslint --tailwind --app --src-dir --import-alias "@/*"
# copy everything from pans-scaffold/ into pans-unilag-website/ EXCEPT README.md and .gitignore
# (merge any extra .gitignore entries by hand), then delete pans-scaffold/
cd pans-unilag-website
npm install next-cloudinary
```

### Everyday development

```bash
npm install          # install dependencies
cp .env.example .env.local   # then fill in values (never commit .env.local)
npm run dev          # http://localhost:3000
npm run lint         # ESLint (Next.js 16 no longer lints during build)
npm run build        # production build: run before opening a PR
npm run start        # serve the production build locally
```

Test scripts (`npm test`, `npm run test:e2e`) will be added when Vitest and Playwright are set up.

## Environment variables

| Variable | Where it is used | Secret? |
| --- | --- | --- |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Building image URLs in the browser and on the server | No |
| `NEXT_PUBLIC_CLOUDINARY_API_KEY` | Cloudinary Upload Widget (admin uploads only) | No, but do not share widely |
| `CLOUDINARY_API_SECRET` | Signing uploads in `src/server/cloudinary` | **Yes, server only** |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, sitemap, social previews | No |
| CMS project ID and read token | `src/server/content` | Token is **secret** (added once the CMS is chosen) |

Real values live in `.env.local` locally and in the hosting provider's environment settings. **Never commit them.**

## Content model

Every item that goes out of date has a date field, so the site archives it automatically (PRD section 5: "outdated opportunities or event notices should be archived").

| Content type | Key fields | Automatic behaviour |
| --- | --- | --- |
| Announcement | title, body, publishDate, expiryDate, pinned | Leaves the home page after `expiryDate` |
| Event | title, slug, startsAt, endsAt, venue, description, coverImage, registrationUrl, committee | Moves from Upcoming to Past after `endsAt` |
| Opportunity | title, slug, type, eligibility, deadline, applyUrl, lastCheckedAt | Hidden after `deadline`; flagged if not checked in 30 days |
| Executive | name, role, session (e.g. `2026/2027`), photo, bio (≤ 60 words), roleEmail, order | Earlier sessions build the Past Executives page |
| Committee | name, purpose, lead, activities, contact | None |
| Milestone | year, title, description, verifiedBy | Renders the history timeline in year order |
| Publication | title, series (`recipharm`, `newspaper`, `substack`), edition, date, cover, fileOrUrl | Grouped by series and year |
| GalleryAlbum | event, date, cover, photos[] (each with caption and alt), consentConfirmed | Grouped by year |
| Document | title, version, approvedOn, approvedBy, file | Shows the latest approved version |
| ResourceLink | title, level, semester, course, url, verifiedBy | Grouped by level and semester |
| GradingScale | grade, minScore, maxScore, gradePoint | Feeds the CGPA calculator |
| SiteSettings | contactEmail, socialLinks, quickLinks, homeBanner | None |

**Required fields:** alt text on every image; `verifiedBy` on every milestone and resource link.

## Images and Cloudinary

- Use `CldImage` from `next-cloudinary` for every Cloudinary image so it gets automatic format (`f_auto`), quality (`q_auto`) and responsive sizes.
- Always pass a meaningful `alt` and a `sizes` attribute; lazy-load everything below the fold.
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

- Upload originals no larger than about 2500 px on the long edge; Cloudinary handles the rest.
- Only upload photos with consent, and remove any photo on request (the takedown contact is on the privacy page).
- Admin uploads must be **signed** (via `src/server/cloudinary`); never expose an unsigned upload preset publicly.

## CGPA calculator

- Runs entirely in the browser. **Nothing the student enters is stored or sent anywhere.**
- Students add courses (code optional, units, score or grade); the calculator shows the semester GPA and running CGPA.
- The grade scale (grade, score range, grade points) comes from the `GradingScale` content type, so admins can correct it without a code change.
- **The Pharm.D grade points and pass marks must be confirmed by the Faculty (via the Academic Secretary) before launch.** Until then, the page shows: *"Unofficial estimate. Your official result is the one issued by the University."*
- The maths lives in `src/features/cgpa/model` as pure functions with unit tests covering rounding, zero-unit courses, empty input and failed courses.

## Forms, privacy and data protection

- Forms (feedback, alumni) are embedded from a form tool owned by the **official PANS account**, never a personal account. Responses are visible only to named administrators.
- **Feedback:** the page states who reads submissions and the response time. The anonymous option asks for no name or email. Urgent welfare or safety issues are directed to a direct contact, not the form.
- **Alumni:** name, graduation year, email, optional phone, areas of interest and a consent checkbox. No date of birth or home address.
- A **privacy notice** covers what is collected, why, who sees it, how long it is kept and how to request deletion.
- The **Nigeria Data Protection Act 2023** applies. Confirm with the Faculty or UNILAG's data protection office whether PANS needs its own NDPC registration (an alumni list can pass the registration thresholds). This README is not legal advice.

## Performance and accessibility targets

| Target | Threshold |
| --- | --- |
| Home page weight (first load, mobile) | **< 1 MB** |
| Other pages | **< 500 KB** |
| Lighthouse (mobile): Performance, Accessibility, Best Practices, SEO | **≥ 90** each |
| Accessibility standard | **WCAG 2.1 AA**: 4.5:1 text contrast, keyboard navigation, visible focus, alt text, no text inside images |
| Fonts | One web font at most (via `next/font`), or system fonts |
| Real-device check | Mid-range Android phone on a throttled 3G/4G connection before sign-off |

Also avoid autoplaying video and heavy carousels, and respect `prefers-reduced-motion` and `prefers-color-scheme`.

## Team workflow

### Git

- The repository is initialised locally on `main`. **No commits have been made and no remote is configured yet.** When the team's GitHub repository exists (under an organisation owned by the official PANS account):

```bash
git remote add origin https://github.com/<pans-org>/pans-unilag-website.git
git add . && git commit -m "chore: initial project setup"
git push -u origin main
```

- `main` is protected: changes land only through pull requests with at least **one approving review** and a passing build.
- Branch names: `feat/<area>-<short-description>`, `fix/...`, `docs/...`, `chore/...` (for example `feat/events-calendar-view`).
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org): `feat: add opportunity type filter`.
- Each pull request: one feature or fix, a short description, screenshots at mobile and desktop width, and `npm run lint` and `npm run build` passing locally.
- Every pull request gets a preview deployment so the editorial team and executives can review before merging.

### Roles

| Role | Responsibility | Person |
| --- | --- | --- |
| Web lead | Architecture, reviews, deployments, accounts | TBD |
| Developers | Features in pairs (e.g. calculator and search; gallery and theming) | TBD |
| Design | Visual identity, tokens, key screens, mobile-first layouts | TBD |
| Editor-in-Chief | Editorial process, content inventory, copy approval | Anu (EIC) |
| Writers and researchers | Verified content, history, profiles, opportunities | TBD |
| Approvers | History, profiles, publications, health content sign-off | TBD |

Content is tracked in one shared inventory sheet with columns for page, owner, status and approver.

## Timeline

| Day | Development | Content and approvals |
| --- | --- | --- |
| **Mon 12 Oct** | Decisions, accounts, scaffold, design tokens, layout shell | Content inventory assigned; writing starts |
| **Tue 13 Oct** | Design sign-off; navigation, home, CMS schemas, Cloudinary setup | Profiles, history and committee copy drafted |
| **Wed 14 Oct** | Feature pages, CGPA calculator, search, gallery | **Content freeze (evening)**; grading scale confirmed |
| **Thu 15 Oct** | Content entry, QA, accessibility and Lighthouse checks, fixes | **Executive review and approval** |
| **Fri 16 Oct** | Production deploy on the domain, final check | **Launch announcement** |

## Definition of done

From PRD section 9. The site is ready to launch when:

- [ ] All agreed launch pages are complete and display correctly on mobile and desktop.
- [ ] Navigation, buttons, external links and forms have been tested.
- [ ] Content has been reviewed for accuracy, spelling, permissions and appropriate access.
- [ ] The website has a named administrator and a documented update process.
- [ ] Basic security, backups and privacy practices are in place for collected information.
- [ ] Performance and accessibility targets above are met.
- [ ] The executive team has reviewed and approved the launch version.

## Open decisions

| Decision | Recommended default | Decide by |
| --- | --- | --- |
| Official PANS account that owns every service | Create a dedicated email account | Mon 12 Oct |
| CMS | Sanity with Cloudinary as the image source; fallback is typed content files in the repo for launch, CMS the week after | Mon 12 Oct |
| Domain | A `.com.ng` or `.org.ng` name registered for 2+ years with auto-renew | Mon 12 Oct |
| Hosting | Vercel, provided its non-commercial terms fit PANS | Mon 12 Oct |
| Final approvers | President (history), each executive (own profile), EIC (publications), Faculty adviser (health content) | Mon 12 Oct |
| Feedback reviewer and response time | General Secretary plus one other executive; reply within 7 days | Tue 13 Oct |
| CGPA grading scale | Confirmed by the Faculty via the Academic Secretary | Wed 14 Oct |

## Using the AI agent prompts (`.agent/`)

The `.agent/` folder contains reusable role prompts (orchestrator, architect, Next.js specialist, frontend specialist, accessibility reviewer, test engineer and more). They are plain Markdown instructions, not running agents. To use one, tell your coding assistant explicitly, for example:

> Read and apply `.agent/frontend-specialist.md` and `.agent/project-context.md`. Implement the opportunities list page described in the README.

Notes:

- The prompts refer to `agent/…` paths; in this repository the folder is **`.agent/`**.
- Keep confirmed project facts in [`.agent/project-context.md`](.agent/project-context.md) so every role starts from the same context.
- Roles that do not apply to this project (payments, background jobs, hackathon ideas) can be ignored.

## Maintenance and handover

- **Ownership:** the domain, hosting, CMS, Cloudinary, GitHub organisation, forms and analytics are all owned by the official PANS account, with **at least two admins** on each and two-factor sign-in on.
- **Monthly checklist:** check external links, review open opportunities, update events and executives, and remove expired announcements.
- **Each election:** transfer account access to the incoming administration, update the Executives session and record the handover date here.
- **Admin guide:** a one-page "How to post an event or opportunity" guide with screenshots will live in `docs/admin-guide.md` before handover.

---

*Maintained by the PANS UNILAG web team. Requirements are owned by the PANS UNILAG executive council.*
