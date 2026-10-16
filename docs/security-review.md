# Security review: authentication, submissions and deployment

**Date:** 16 October 2026, before launch (issue #42). **Method:** the checklist in
[`.agent/red-team.md`](../.agent/red-team.md), applied to the code at `main` after #41 (Vercel
deployment). **Scope:** admin sign-in and sessions, every `/api/admin` route, the feedback and
alumni forms, uploads, rate limits, cookies, CORS, response headers, input validation, how
admin-entered content is rendered, secrets in the repository, dependencies, and backups.

This was a code review plus local tests and a headless-browser check of the built site. **No live
system was probed.** CVSS was not assessed. A clean review is not proof of security; re-check after
big changes.

## Result

No high-severity findings are open. Six issues were fixed in this change; three low-risk items are
accepted and listed below.

| # | Finding | Severity | Status |
| --- | --- | --- | --- |
| 1 | Editors could read and change feedback and alumni personal data | Medium | Fixed |
| 2 | Without `NODE_ENV=production` on Vercel the API ran in development mode | Medium | Fixed |
| 3 | Privacy notice said rate-limit counts are never stored (they are, for up to an hour) | Medium | Fixed |
| 4 | Settings quick links and banner link accepted any value, e.g. `javascript:` | Low | Fixed |
| 5 | Editors could replace brand images (badge, preview image) | Low | Fixed |
| 6 | No Content-Security-Policy on the site | Low | Fixed |
| 7 | Markdown treated `//other-site` links as pages on this site | Low | Fixed |
| 8 | Signing out doesn't revoke the session token | Low | Accepted |
| 9 | No per-account sign-in lockout | Low | Accepted |
| 10 | Atlas network access is open to any IP | Low | Accepted |

## Fixed

### 1. Editors could read and change feedback and alumni data (Medium, confirmed)

- **Where:** `server/src/modules/admin/http/admin.routes.ts` (the submissions routes);
  `server/src/middleware/requireAdmin.ts` had `requireRole`, but nothing used it.
- **Problem:** the README says the `editor` role is for content only, and the privacy notice says
  only admins read submissions. In fact any signed-in admin or editor could list feedback
  (including contact emails), list alumni (names, emails, phone numbers), change feedback status
  and delete alumni entries.
- **Fix:** every `/api/admin/submissions/*` route now requires the `admin` role (403 `FORBIDDEN`
  otherwise; `admin.routes.ts:60`, `app.ts:250`). The dashboard hides Feedback and Alumni from
  editors and never requests them (`useCanReadSubmissions` in `client/src/features/admin/api.ts`).
- **Tests:** `server/tests/admin.api.test.ts` ("are personal data: editors get 403…") and
  `client/src/features/admin/AdminApp.test.tsx` ("keeps feedback and alumni details from editors").

### 2. A missing `NODE_ENV` silently turned off production protections (Medium, confirmed)

- **Where:** `server/src/vercel.ts`, `server/src/config/appFromEnv.ts:28`.
- **Problem:** the deployment guide asks for `NODE_ENV=production`, but if it was forgotten the API
  would serve Swagger docs publicly, include stack traces in 500 responses, send the session cookie
  without `Secure`, ignore `X-Forwarded-For` (so every visitor would share one rate-limit count,
  Vercel's proxy address) and count rate limits in memory.
- **Fix:** on Vercel, `NODE_ENV` defaults to `production` (`vercelEnv`, `vercel.ts:83`).
- **Test:** `server/tests/deploy.test.ts` ("runs in production mode on Vercel…").

### 3. The privacy notice was wrong about rate-limit data (Medium, confirmed)

- **Where:** `client/src/features/connect/pages/PrivacyPage.tsx:84`.
- **Problem:** it said the per-connection form limit "is kept in memory only, never stored". Since
  #41 the counts are kept in MongoDB (`ratelimits`), keyed by IP address, for up to an hour, which
  the notice has to say (Nigeria Data Protection Act: tell people what is collected).
- **Fix:** the notice now says IP-address counts for forms and admin sign-in are stored for at most
  an hour, deleted automatically, and used for nothing else.

### 4. Settings links accepted any value (Low, confirmed)

- **Where:** `server/src/modules/settings/infrastructure/settings.model.ts:30`.
- **Problem:** `quickLinks[].url` and `homeBanner.url` had no format rule, so an editor could save
  `javascript:…` through the API. React 19 refuses to render `javascript:` links and the footer
  doesn't show quick links yet, so it wasn't exploitable today, but every other link field already
  insists on https.
- **Fix:** both must be a page on this site (`/…`, not `//…`) or an `https://` link.
- **Test:** `server/tests/admin.content.test.ts` (Contact & footer settings).

### 5. Editors could replace brand images (Low, confirmed)

- **Where:** `server/src/modules/media/http/media.routes.ts`.
- **Problem:** any signed-in admin could get an upload signature for the `brand` folder with a fixed
  public id, i.e. overwrite the badge or the link-preview image.
- **Fix:** the `brand` folder needs the `admin` role; content folders are unchanged.
- **Test:** `server/tests/media.test.ts` ("lets editors upload content photos, but only admins
  replace brand images").

### 6. No Content-Security-Policy (Low, hardening)

- **Where:** `vercel.json` (headers for every path).
- **Fix:** `default-src 'self'`; scripts only from the site plus the one inline theme script by its
  SHA-256 hash; images from the site and `res.cloudinary.com`; `connect-src` the site and
  `api.cloudinary.com` (uploads); no plugins, framing, foreign `<base>` or form targets. Also
  `Strict-Transport-Security`, `Permissions-Policy` (camera, microphone, location, payment, USB off),
  alongside the existing `nosniff`, `Referrer-Policy` and `X-Frame-Options: DENY`.
- **Checked:** the built site was opened in Chromium with the policy on 11 pages (home, events, an
  event, gallery and an album, CGPA calculator, search, feedback form, About, dashboard and an
  editor): **no violations**, and the theme script still ran. An injected inline script was
  blocked, which shows the policy is enforced.
- **Test:** `client/src/app/headers.test.ts` fails if the theme script in `index.html` changes
  without its hash being updated in `vercel.json`.

### 7. `//other-site` Markdown links (Low, confirmed)

- **Where:** `client/src/components/ui/MarkdownRenderer.tsx:32`.
- **Problem:** a link like `//elsewhere.example` in admin-written Markdown was treated as a page on
  this site (no new tab, no `noopener`).
- **Fix and test:** treated as an outside link; `Markdown.test.tsx`.

## Accepted (low risk, documented)

8. **Signing out doesn't revoke the token.** Sessions are signed JWTs in an `httpOnly` cookie,
   valid for 8 hours. Signing out deletes the cookie; a copied token would keep working until it
   expires. Resetting the admin's password (`create-admin --reset-password`) or removing them ends
   every session at once, because the admin and `tokenVersion` are checked on every request.
9. **No per-account lockout.** Sign-in is limited to 10 attempts per 15 minutes per IP address,
   across every server instance. Admin passwords are generated (24 random characters), so guessing
   from many addresses is impractical. Revisit if admins start choosing their own passwords.
10. **Atlas accepts connections from any IP.** Vercel has no fixed addresses. The database user has
    a long generated password, and only the API holds it.

## Checked and found sound

- **Passwords:** argon2id with the library's OWASP defaults; an unknown email still runs a dummy
  verification, so timing doesn't reveal which emails exist (`authService.ts:13`); the same 401 for
  both failures; the hash is never selected by default or returned.
- **Sessions:** HS256 only, with issuer, audience and expiry checked (`sessionTokens.ts:36`); a
  `JWT_SECRET` of at least 32 characters is required to start; the admin is looked up on every
  request.
- **Cookie:** `httpOnly`, `Secure` in production, `SameSite=Lax`, path `/api`, 8 hours
  (`auth.routes.ts:42`).
- **CSRF:** `SameSite=Lax` keeps the cookie off cross-site POST, PATCH and DELETE requests;
  `vercel.app` is on the Public Suffix List, so other Vercel sites count as cross-site; every
  change uses a non-GET method with a JSON body.
- **Authorization:** every `/api/admin/*` and `/api/admin/media/*` route sits behind
  `requireAdmin` (401 without a valid session, covered by tests).
- **CORS:** an explicit allow-list with credentials; requests from unknown origins get no CORS
  headers (`app.ts:189`).
- **Headers on the API:** `helmet()` defaults, no `X-Powered-By`; admin, auth and form responses
  are `no-store`.
- **Validation:** every body and query goes through Zod strict schemas (unknown fields rejected)
  and then the Mongoose model; Express 5's simple query parser, so `?a[$ne]=` can't build query
  operators; JSON bodies limited to 100 kB (`app.ts:197`); search terms go to `$text`, with no
  regular expressions built from input.
- **Forms:** rate-limited (5 per hour per IP per form, shared across instances), a honeypot field,
  the same reply whether stored or dropped, and nothing submitted is ever returned by a public
  endpoint.
- **Rendering:** Markdown drops raw HTML (`skipHtml`) and allows a short list of elements;
  `javascript:` links are removed; no `dangerouslySetInnerHTML` anywhere in the client.
- **Disclosure:** 500 responses never include stack traces in production; request logs record the
  method, path (no query string), status and timing, not IP addresses or bodies; Swagger is off in
  production unless `API_DOCS_ENABLED=true`.
- **Uploads:** signed server-side; the API secret never leaves the server; folders come from an
  allow-list; JPG, PNG and WebP only.
- **Redirects:** the sign-in page only returns to `/admin…` paths (`safeNext`).
- **Secrets:** no `.env` file has ever been committed, and a pattern scan of all 90 commits (MongoDB
  passwords, API and JWT secrets, private keys, GitHub and AWS tokens) found nothing. `.gitignore`
  covers `.env`, backups (`dump/`, `*.archive`) and photo folders.
- **Dependencies:** `npm audit` reports 0 vulnerabilities (production and development).

## Backup and restore

See [backup-restore.md](backup-restore.md). The steps are `mongodump`, then `mongorestore` into a
scratch database, then `npm run backup:verify -w server`. That script compares every collection's
document count and a SHA-256 of its exact contents, and prints only counts (tested in
`server/tests/backup.test.ts`, with a real-database test when `MONGODB_URI_TEST` is set).

**The restore against production must be run by an account owner** once the live database exists.
Record the date and the "Restore verified" line in the PR, which completes the issue's second
acceptance criterion.
