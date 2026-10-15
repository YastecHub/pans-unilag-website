# Seed files

JSON files in this folder are loaded into MongoDB by the seed script. They hold the **starting content** of the site, built from the sources in the main README. After launch, executives change content in the admin dashboard, not here.

## Commands (from the repository root)

| Command                              | What it does                                                                                                                                   |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run seed -w server`             | Adds documents that don't exist yet. **Never changes existing ones**, so content edited in the dashboard is safe. Run it as often as you like. |
| `npm run seed -w server -- --update` | Also overwrites existing documents with the values in these files. Use only to deliberately refresh seed content.                              |
| `npm run seed -w server -- --reset`  | Empties the seeded collections, then seeds. **Development only**: refuses to run when `NODE_ENV=production`.                                   |
| `npm run seed:check -w server`       | Validates the files against the models without a database. Also runs in CI (`server/tests/seedFiles.test.ts`).                                 |
| `npm run content:status -w server`   | Lists every placeholder (`isPlaceholder: true`) grouped by its note, as Markdown checkboxes for the content tracking issue (#14). No database needed. |

**Keeping #14 up to date:** when content arrives, replace the placeholder (in the dashboard or here, setting `isPlaceholder: false`), run `npm run content:status -w server`, and paste the output into the issue's "Content still missing" section. A file marked `complete` has nothing left to collect.

The seed script reads `MONGODB_URI` from `server/.env` and prints the database it is about to write to. Every file is validated before anything is written, so a mistake never leaves a half-seeded database.

## Rules for every file

1. **A JSON array of documents**, one file per collection, named as below.
2. **Registered:** each file needs an entry in `server/src/seed/registry.ts` (file, model, key). A file without one makes the seed fail, so typos in file names are caught.
3. **Key fields identify a document across runs.** Never change a document's key once it has been seeded, or the seed will create a second one. The model must have a unique index on the key (a test checks this).
4. **Only fields the model defines.** Unknown fields are rejected (e.g. a typo like `nmae`).
5. **Missing content is a placeholder, never invented:** `"isPlaceholder": true` plus a `"placeholderNote"` saying what is missing (required). Use the placeholder wording from the main README, e.g. `"name": "Name to be announced"`.
6. **Dates** are ISO 8601 with the Lagos offset: `"2026-11-30T09:00:00+01:00"`.
7. **Images** are Cloudinary public ids (`"pans-unilag/committees/ppht/cover"`), never URLs to personal Drive folders.
8. **No personal phone numbers or personal emails**, ever (role emails only).
9. Leave out `_id`, `createdAt` and `updatedAt`: the seed sets them. `isPlaceholder` defaults to `false` and `placeholderNote` to `""`.

## Files, keys and shapes

The fields follow the main README's _Data model_. The issue that adds each model and file (#9–#12) confirms the exact fields in its PR and updates this table.

| File                                                  | Key                                   | Issue                |
| ----------------------------------------------------- | ------------------------------------- | -------------------- |
| `pages.json`                                          | `slug`                                | #9                   |
| `executives.json`                                     | `session`, `office`                   | #10                  |
| `senate.json`                                         | `session`, `position`                 | #10                  |
| `patrons.json`                                        | `order`                               | #10                  |
| `committees.json`                                     | `slug`                                | #11                  |
| `events.json`                                         | `slug`                                | #12                  |
| `grading.json`                                        | `slug`                                | #12                  |
| `settings.json`                                       | `key` (always `"site"`: one document) | #12                  |
| `milestones.json`, `albums.json`, `publications.json` | `slug`                                | later content issues |

### `pages.json`

Eleven pages built from _Content to Include_ (sections 2–14): who-we-are, membership-and-rights, governance (incl. standing committees), executive-council (office duties), senate, elections, finance-and-accountability, meetings-and-procedures, student-support, constitution, contact. Officer duties live here, not in `executives.json`. `bodyMarkdown` is Markdown; every section cites at least one article.

```json
[
  {
    "slug": "who-we-are",
    "title": "Who we are",
    "order": 1,
    "sections": [
      {
        "heading": "Our motto",
        "bodyMarkdown": "**Service to Humanity**",
        "articleRefs": ["Art. 2"]
      }
    ]
  }
]
```

### `executives.json`

```json
[
  {
    "session": "2026/2027",
    "office": "President",
    "order": 1,
    "name": "Abigail Moejoh",
    "bio": "",
    "photo": "",
    "isPlaceholder": true,
    "placeholderNote": "Bio from the President's Exco document; photo after the photoshoot (by 31 Oct)"
  },
  {
    "session": "2026/2027",
    "office": "Vice President",
    "order": 2,
    "name": "Name to be announced",
    "isPlaceholder": true,
    "placeholderNote": "Name and bio from the President's Exco document; photo after the photoshoot"
  }
]
```

### `senate.json`

```json
[
  {
    "session": "2026/2027",
    "position": "Senate President",
    "order": 1,
    "name": "Election pending",
    "isPlaceholder": true,
    "placeholderNote": "The 2026/27 Senate election has not been held"
  }
]
```

### `patrons.json`

```json
[
  {
    "order": 1,
    "title": "Dean, Faculty of Pharmacy",
    "isDean": true,
    "name": "Name to be announced",
    "isPlaceholder": true,
    "placeholderNote": "Dean's name needed"
  }
]
```

### `committees.json`

```json
[
  {
    "slug": "ppht",
    "name": "PANS Public Health Team",
    "shortName": "PPHT",
    "session": "2026/2027",
    "order": 5,
    "description": "Promoting public health awareness, disease prevention and community well-being…",
    "activities": ["Medical outreach at PANS Health Week", "Know Your Drug series"],
    "achievements": [],
    "plans": [],
    "motto": "",
    "officers": [
      { "title": "Lead", "name": "Kosiso Okonkwo", "level": "500L" },
      { "title": "Assistant", "name": "Uzoka Ugochukwu Samuel", "level": "400L" }
    ]
  }
]
```

### `events.json`

`datePrecision`: `day` (exact dates), `month` (only the month is known: first day of the first month to last day of the last, Lagos time) or `unknown` (already happened, dates not recorded: no `startsAt`/`endsAt`, must be a placeholder, listed as past). `committee` is a committee slug.

```json
[
  {
    "slug": "freshers-week-2026",
    "title": "Freshers' Week",
    "startsAt": "2026-11-30T00:00:00+01:00",
    "endsAt": "2026-12-04T23:59:59+01:00",
    "datePrecision": "day",
    "venue": "",
    "registrationUrl": "",
    "description": "",
    "isPlaceholder": true,
    "placeholderNote": "Venue and registration link to be confirmed"
  },
  {
    "slug": "health-week-2026-day-3",
    "title": "Medical Outreach 2026",
    "series": "PANS Health Week 2026: Redefine+",
    "dayNumber": 3,
    "datePrecision": "unknown",
    "committee": "ppht",
    "isPlaceholder": true,
    "placeholderNote": "Date and description needed"
  }
]
```

### `albums.json`

One album per event (key `slug`, same as the event's slug). Albums start as placeholders with no photos. **Don't edit photos by hand:** the upload script fills them in.

**Uploading an album (Media Committee + one developer):**

1. Choose 20–40 photos for the event from the Drive folder. Only use photos where the people pictured agreed to publication; remove any photo on request.
2. Copy them into `photos/<event-slug>/` in the repo (ignored by git), named in the order they should appear (e.g. `01.jpg`, `02.jpg`).
3. Put the Cloudinary keys from the web lead in `server/.env` (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).
4. Preview, from the repo root: `npm run upload-album -w server -- --event health-week-2026-day-3 --dir photos/health-week-2026-day-3 --dry-run`. In PowerShell write the `--` as `'--'`, or PowerShell removes it and npm swallows the options.
5. Upload: the same command with `--consent-confirmed` instead of `--dry-run` (add `--cover 5` to make photo 5 the cover).
6. The script resizes each photo to at most 2500 px on the long edge and **strips location and camera data**. It uploads to `pans-unilag/events/<series>/<day>/photo-NN` and records the photos in `albums.json` with a starting alt text.
7. **Replace each starting alt text** with what the photo shows, e.g. "Students checking a resident's blood pressure at the outreach". Add captions if useful.
8. Run `npm run seed:check -w server`, then open a PR.

Re-running for the same event replaces its photos and keeps alt text you already improved. The Drive folder link goes in the dashboard (`sourceFolderUrl`), never in this repository.

**Free plan:** at roughly 0.5–1 MB per resized photo, 18 albums × 40 photos is about 0.4–0.7 GB of storage, well within Cloudinary's free plan.

### `publications.json`

One entry per series until real editions exist; add each Recipharm edition as its own entry with a PDF (`fileUrl`) or a page (`link`). A publication needs one of the two unless it is a placeholder.

```json
[
  {
    "slug": "recipharm-2026",
    "title": "Recipharm 2026",
    "series": "recipharm",
    "edition": "2026",
    "publishedOn": "2026-09-01T00:00:00+01:00",
    "cover": "pans-unilag/publications/recipharm-2026/cover",
    "fileUrl": "https://…/recipharm-2026.pdf"
  }
]
```

### `documents.json`

Key: `slug` + `version`. A new constitution is a **new entry** with the same slug and a new version; the site shows the version with the latest `approvedOn`. `fileUrl` (https) is required unless the entry is a placeholder.

```json
[
  {
    "slug": "constitution",
    "title": "Constitution of PANS UNILAG",
    "version": "2026",
    "approvedOn": "2026-07-09T00:00:00+01:00",
    "pageCount": 55,
    "isPlaceholder": true,
    "placeholderNote": "PDF to be uploaded"
  }
]
```

Announcements, opportunities and resources have no seed files: they start empty and are added in the dashboard (the pages show their empty states).

### `grading.json`

```json
[
  {
    "slug": "faculty-of-pharmacy-5-point",
    "active": true,
    "source": "Faculty of Pharmacy student handbook §3.5, p. 22",
    "grades": [{ "letter": "A", "min": 70, "max": 100, "point": 5 }],
    "bands": [
      { "name": "Pass", "min": 2.4, "max": 5 },
      { "name": "Fail", "min": 0, "max": 2.39 }
    ],
    "passMark": 2.4,
    "units": { "min": 1, "max": 3 }
  }
]
```

### `settings.json`

```json
[
  {
    "key": "site",
    "postalAddress": "c/o The Dean's Office, Faculty of Pharmacy, College of Medicine Campus, University of Lagos, P.M.B. 12003, Lagos",
    "socialLinks": [{ "platform": "Instagram", "url": "https://www.instagram.com/pans_unilag/" }],
    "contactEmail": "",
    "isPlaceholder": true,
    "placeholderNote": "Official email address needed"
  }
]
```

## Adding a seed file (checklist for #9–#12)

1. Create the model in `server/src/modules/<feature>/infrastructure/` with `schema.plugin(contentPlugin)` and a unique index on the key.
2. Add `{ file, model, key }` to `SEED_TARGETS` in `server/src/seed/registry.ts`, in dependency order.
3. Add the JSON file here, following the rules above.
4. Run `npm run seed:check -w server`, then `npm run seed -w server` twice against your development database. The second run must report `+0 inserted`.
