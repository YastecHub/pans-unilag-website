# Launch QA (issue #43)

**Date:** 16 October 2026. **Build:** `main` after #42, plus the fixes in this change. **Where:**
the built site served the way Vercel serves it (same headers, gzip, SPA fallback) with the real
API on the seed content in memory (`server/scripts/e2e-server.ts`); headless Chromium, desktop and
Pixel 7 emulation. **Not yet run:** against the live site, and on a physical phone (both below).

## How to run it again

```powershell
npx playwright install chromium     # once
npm run e2e -w client               # builds the site, starts it on :4321, runs every test

# Read-only tests against the live site (no forms sent, no sign-in):
$env:E2E_BASE_URL = "https://pans-unilag.vercel.app"; npm run e2e -w client
```

The HTML report lands in `client/playwright-report/` (git-ignored). Lighthouse, by hand:

```powershell
npx lighthouse https://pans-unilag.vercel.app/ --form-factor=mobile --only-categories=performance,accessibility,best-practices,seo --view
```

## Results

### Smoke tests: 6 journeys, desktop and phone, all pass

`client/e2e/smoke.spec.ts`. Every test also fails on any JavaScript error or console error in the
page.

| Journey | What it checks |
| --- | --- |
| Home | Full name as the heading, the "PANS UNILAG: Service to Humanity" title, header and footer, the security headers |
| Events | Upcoming list, then an event page |
| Committee detail | Committees list, then ADMAP with its officers |
| CGPA calculator | 72 (A, 3 units) and C (2 units) give 4.20, Pass |
| Feedback | A student sends a suggestion, then an admin signs in and reads it under Feedback |
| Admin sign-in | Signed-out redirect, wrong password refused, sign in, sign out |

### Accessibility: automated and keyboard checks pass after 3 fixes

Following `.agent/accessibility-reviewer.md` (WCAG 2.2 AA as the target):

- **axe-core (WCAG 2.0/2.1/2.2 A and AA)** on all 29 sitemap pages, an event, a committee, an
  album, search results, the 404 page, the admin sign-in, and the signed-in dashboard (overview,
  content, placeholders, lists, feedback, the committee editor), **in light and dark themes, on
  desktop and phone**: no violations (`client/e2e/accessibility.spec.ts`).
- **Reflow:** no page scrolls sideways at 320px (WCAG 1.4.10).
- **Keyboard:** the skip link is the first stop and moves focus to the content; every focused
  element shows the 3px focus outline; the phone menu opens with Enter, Escape closes it and focus
  returns to the Menu button (`client/e2e/keyboard.spec.ts`).
- Already covered by the component tests: form errors (summary focused, linked to fields, fields
  marked invalid), success messages announced, the gallery lightbox (focus kept inside and
  returned), the CGPA calculator's focus handling, and the dashboard's row lists and uploads.

**Fixed in this change (confirmed barriers):**

| Barrier | WCAG | Where | Fix |
| --- | --- | --- | --- |
| The logo link was named "PANS UNILAG home" but shows "PANS UNILAG Service to Humanity", so voice-control users saying what they see couldn't activate it | 2.5.3 Label in name | `components/layout/Header.tsx` (every page) | Named by its visible text, plus "(home page)" for screen readers |
| The overview count cards had `aria-label`s that didn't match their visible text | 2.5.3 | `features/admin/pages/AdminPages.tsx` | Named by their visible text |
| On phones the hero motto, yellow on dark green (4.3:1), was 20px, too small for the large-text allowance | 1.4.3 Contrast | `features/home/components/HeroSection.tsx` | Never smaller than 24px, so it counts as large text (the brand rule for yellow on green) |
| At 320px wide the header was 344px, so every page scrolled sideways | 1.4.10 Reflow | `components/layout/Header.tsx` | Below 360px the Menu button shows its icon only (still named "Menu" for screen readers) |

**Not tested:** a real screen reader (NVDA, TalkBack, VoiceOver). Automated checks find roughly a
third of accessibility problems; a 15-minute pass with TalkBack on the Android phone below is
recommended before announcing the site.

### Lighthouse (mobile, simulated slow 4G): all categories ≥ 90

| Page | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Home `/` | 94 | 100 | 100 | 100 | 2.2 s | 140 ms | 0.099 |
| Events `/events` | 98 | 100 | 100 | 100 | 1.9 s | 110 ms | 0 |
| CGPA calculator | 98 | 100 | 100 | 100 | 2.1 s | 40 ms | 0 |

Lighthouse 13.5, local build. Home page weight: 393 KB (target under 1 MB). The home page's
layout shift (0.099, just inside "good") is the upcoming-events section growing when its data
arrives; reserving its height while loading would remove it (follow-up, not a launch blocker).
**Re-run on the live site** once deployed: real network and Vercel's CDN can differ.

### Links and placeholders

- `client/e2e/links.spec.ts` follows every link from the sitemap: **80 pages, none broken**.
- **Outside links (7), all https, all opening safely** (`rel="noopener"` on new tabs): Instagram,
  X, YouTube and LinkedIn (footer, every page); Google Maps (Contact); "Add to Google Calendar"
  on events. A person should still open each once on the live site to confirm the accounts are
  the official ones.
- **Placeholders are visibly marked on 63 pages** ("Coming soon", "To be announced"), as designed:
  nothing is invented. The full list of what's missing, by source file, is
  `npm run content:status -w server` (also the dashboard's Placeholders page). The main gaps:
  Executive Council bios and photos; 4 committee write-ups; past events' dates and descriptions;
  all 18 gallery albums; publications; the constitution PDF; the official email.

### Real phone on a slow connection: to do

Needs a person with a mid-range Android (e.g. a Tecno, Infinix or Samsung A-series) on the live
site:

1. Chrome → the site. On a slow connection, or with **Developer options → Networking → throttle**
   (or simply mobile data with one bar), load the home page from cold.
2. Check: the page is readable within a few seconds; the menu opens and closes; text is readable
   without zooming; nothing scrolls sideways; buttons are easy to tap.
3. Try: an event page and "Add to calendar"; the CGPA calculator with two courses; the feedback
   form (one real message, then find it under Feedback in the dashboard).
4. Note the phone model, Android version and network in the issue.

## Definition of done (README), status

Copy this into issue #43 and tick what's done.

- [x] All launch pages render correctly on mobile and desktop, with real content or clearly marked placeholders. *(30 browser tests on desktop and Pixel 7; placeholders marked on 63 pages)*
- [ ] No invented content anywhere; the admin Placeholders list is reviewed. *(nothing invented in the seed files; **an exec should read the Placeholders list** once the live database is seeded)*
- [x] Navigation, links and forms tested. *(80 pages crawled, no broken links; feedback form end to end; sign-in; keyboard and phone menu)*
- [ ] Content reviewed for accuracy, spelling, permissions; name and motto exactly as in the constitution. *(name and motto checked by the smoke test; **the rest needs a human read-through** by the Content Committee)*
- [x] CGPA calculator passes its boundary tests. *(28 unit tests, plus the browser smoke test)*
- [ ] Named administrators and an admin guide exist. *(admin guide: `docs/admin-guide.md`; **name the two admins** and create them with `create-admin`)*
- [x] Admin auth, validation, rate limits, CORS in place; secrets only in server env vars. *(#42: `docs/security-review.md`)*
- [ ] A backup has been taken and restored once. *(tooling ready in #42; **run `docs/backup-restore.md` against production**)*
- [x] Performance and accessibility targets met. *(Lighthouse mobile ≥ 90 on three pages; axe clean in both themes; keyboard and reflow checks; **re-run Lighthouse on the live site** and do the TalkBack pass)*
- [ ] Executive team approval.
- [ ] Every `priority: P0` issue in the launch milestone is closed.

## About PR #93 (first version of this issue)

The first version added `client/src/app/launchSmoke.test.tsx`: six jsdom component tests, not
browser tests. Two of them failed (the feedback form has no "Name" field; "Password" matched both
the password box and the show-password button), and the others passed against mock data in the
wrong shape (for example `{ items: [] }` for events, keyed with a query string the mock helper
ignores). No Lighthouse, accessibility, real-device or link results were included. That file is
replaced by the Playwright suite above, which runs the real site and API; the existing per-page
component tests already cover what it intended.
