# PANS UNILAG Website

The official website of the **Pharmaceutical Association of Nigeria Students, University of Lagos (PANS UNILAG)**. Motto: ***Service to Humanity***.

A fast, accessible, mobile-first home for the association's identity, leadership, governance, events, opportunities, publications and student services, with an admin dashboard so executives can keep it up to date without a developer.

> **Stack:** MERN (MongoDB, Express, React, Node.js) in TypeScript, with Cloudinary for images. Agreed by the whole team on 14 Oct 2026.
> **Launch:** **Friday 16 October 2026** (the PRD's original date was 31 October).
> **Session:** 2026/2027 administration. President: Abigail Moejoh.
> **Status:** In development. Client and server are scaffolded (issue #1); feature work follows the [GitHub issues](https://github.com/YastecHub/pans-unilag-website/issues).

---

## Contents

1. [Sources of truth](#sources-of-truth)
2. [Identity and naming](#identity-and-naming)
3. [Brand and design system](#brand-and-design-system)
4. [Site map and pages](#site-map-and-pages)
5. [Content: what we have and what is a placeholder](#content-what-we-have-and-what-is-a-placeholder)
6. [Placeholder rules](#placeholder-rules)
7. [Leadership and committees (2026/2027)](#leadership-and-committees-20262027)
8. [Governance content from the constitution](#governance-content-from-the-constitution)
9. [Events and gallery](#events-and-gallery)
10. [CGPA calculator](#cgpa-calculator)
11. [Who owns which content](#who-owns-which-content)
12. [Tech stack](#tech-stack)
13. [System overview](#system-overview)
14. [Project structure](#project-structure)
15. [Architecture rules](#architecture-rules)
16. [Data model](#data-model)
17. [API reference (planned)](#api-reference-planned)
18. [Getting started](#getting-started)
19. [Environment variables](#environment-variables)
20. [Images and Cloudinary](#images-and-cloudinary)
21. [Security, privacy and data protection](#security-privacy-and-data-protection)
22. [Performance, SEO and accessibility](#performance-seo-and-accessibility)
23. [Deployment](#deployment)
24. [Contributing and project management](#contributing-and-project-management)
25. [Timeline](#timeline)
26. [Definition of done](#definition-of-done)
27. [Decisions log](#decisions-log)
28. [Using the AI agent prompts (`.agent/`)](#using-the-ai-agent-prompts-agent)
29. [Maintenance and handover](#maintenance-and-handover)

---

## Sources of truth

When sources disagree, the higher row wins.

| Rank | Source | What it governs |
| --- | --- | --- |
| 1 | **PANS UNILAG Constitution** (reviewed and adopted 9 July 2026; full 55-page PDF received 15 Oct), summarised in *PANS UNILAG Website: Content to Include* | Name, motto, objectives, membership, governance, offices, elections, committees' constitutional roles, finance, members' rights, contact address |
| 2 | **Faculty of Pharmacy student handbook**, §3.5 (grading) and §3.7 (academic standing), pp. 22–23 | CGPA scale, pass mark, credit units, academic standing rules. University rules override the constitution (Art. 1) |
| 3 | **Leadership updates from the PANS President**, relayed by the web lead (see *Decisions log*) | Who is shown for the Senate and Executive Council this session, and when names, bios and photos arrive |
| 4 | **President's announcement of committee leads, 2026/2027** | Which committees exist this session and who leads them |
| 5 | **PANS Committees write-ups** | Committee descriptions, activities, achievements and plans |
| 6 | **Brand Guidelines (PANS UNILAG Website)** | Logo, colours, fonts, type scale |
| 7 | **PRD** and the team's *Recommendations & Build Plan* doc | Features, priorities, launch scope |

Photo sources (Google Drive folders for Pharmalympics 2026 and PANS Health Week 2026) are listed in the team's content inventory sheet. Their links are not kept in this repository.

## Identity and naming

| Item | Use exactly |
| --- | --- |
| Full name | **Pharmaceutical Association of Nigeria Students, University of Lagos** |
| Short name | **PANS UNILAG** (in running text the constitution also uses "the Association") |
| Motto | **Service to Humanity** |
| Members | **PANSites**: all duly registered students of the Faculty of Pharmacy |
| Official language | English |
| Postal address | c/o The Dean's Office, Faculty of Pharmacy, College of Medicine Campus, University of Lagos, P.M.B. 12003, Lagos |
| Location | Faculty of Pharmacy, Lagos University Teaching Hospital, off Ishaga Road, Idi-Araba, Lagos |
| Correspondence | Directed to the **Secretary General**, through the postal address above |

> **Name rule:** the constitution says "Nigeria Students". The brand deck's logo lockup and the PRD say "Nigerian Students"; **the constitution wins**. The Design Committee should update the lockup artwork to "Nigeria".

## Brand and design system

From the Brand Guidelines deck, with accessibility rules added after contrast checks against WCAG 2.1 AA.

### Colours

| Token | Hex | Role | Usage rules |
| --- | --- | --- | --- |
| `--color-primary` | `#0e6434` | Dark green, primary | Buttons, links, active nav, headings on light backgrounds. White text on it: **7.3:1** ✅ |
| `--color-primary-bright` | `#07913c` | Bright green, primary | Large headings, icons, illustrations, borders. **Not** for body text or white-text buttons (4.1:1, fails for normal text) |
| `--color-navy` | `#003463` | Navy, primary | Footer, hero overlays, secondary buttons. White text: **12.6:1** ✅ |
| `--color-surface` | `#ffffff` | White, secondary | Page background |
| `--color-surface-alt` | `#e1e8db` | Pale green-grey, secondary | Alternate section backgrounds, cards, placeholders. Dark green text on it: **5.8:1** ✅ |
| `--color-accent` | `#ffbd04` | Yellow, accent | Highlights, badges, focus rings, "New" labels. Only on navy (7.5:1) or dark green (4.3:1, large text only), or **behind black/dark text** (12.5:1). **Never as text on white** (1.7:1) |
| `--color-text` | `#1f2a24` | Body text (derived) | 14.8:1 on white |
| `--color-text-muted` | `#4a5a50` | Secondary text (derived) | 7.3:1 on white, 5.8:1 on `#e1e8db` |

**Dark mode** (derived, all checked):

| Token | Hex | Contrast |
| --- | --- | --- |
| Background | `#0b1a12` | n/a |
| Surface / cards | `#132a1d` | n/a |
| Text | `#e1e8db` | 14.3:1 on background |
| Muted text | `#b8c4b2` | 9.9:1 on background |
| Links | `#5cc98a` | 8.7:1 on background |
| Accent | `#ffbd04` | 10.7:1 on background |
| Buttons | `#0e6434` with white text and a `#5cc98a` border | 7.3:1 text; the border keeps the button visible on the dark background |

### Typography

| Use | Font | Weights |
| --- | --- | --- |
| Headings, menus, buttons | **Poppins** | 600 (bold), 500 (semibold) |
| Paragraphs, descriptions | **Inter** | 400 (regular), 500 |

| Level | Desktop (brand spec) | Mobile (≤ 640 px) | Use |
| --- | --- | --- | --- |
| H1 | 56–64 px | 36 px | Page titles |
| H2 | 40–48 px | 28 px | Section headings |
| H3 | 24–30 px | 20–22 px | Subheadings |
| Body | 16–18 px | 16 px | Text |
| Small | 12–14 px | 13–14 px | Metadata, dates, labels |

Implement with `clamp()` so sizes scale smoothly. Load only the weights above, with `font-display: swap`, to keep pages light on data.

### Logo

- Circular badge: mortar and pestle, "PANS UNILAG", "Faculty of Pharmacy", "Service to Humanity".
- Approved uses: the badge alone on white or pale grey; the badge with the full name lockup in **green** or **black** text, on white or pale grey.
- Do not recolour, stretch or place the badge on busy photos without a solid backing.
- ⚠️ The only file we have is **200 × 200 px**. Use it for the header and favicon for now. **A vector (SVG) or ≥ 1000 px version is needed** for hero sections, link previews and print.

## Site map and pages

Eight menu items. On phones they collapse into a menu button; on desktop, items with sub-pages open dropdowns.

```
Home
├── About ──────────── Who we are (name, motto, preamble, objectives)
│                      Membership & rights
│                      History & milestones            [placeholder]
│                      Impact                          [placeholder]
├── Leadership ─────── Executive Council 2026/27       [names, bios: placeholders except the President's name; photos after the October photoshoot]
│                      Senate 2026/27                  [4 principal officers only; placeholders until the Senate election]
│                      Committees (11)                 [leads known; 4 descriptions placeholder]
│                      Patrons                         [placeholder]
├── Governance ─────── How PANS is governed (Congress, EC, Senate, Interim Council, representation)
│                      Elections
│                      Finance & accountability
│                      Meetings & procedures
│                      Constitution                    [PDF download (file received)]
├── Events ─────────── Upcoming                        [empty state until events are added]
│                      Past events (Health Week 2026, Pharmalympics 2026)
│                      Gallery
├── Opportunities ──── Hub (run by CPD & CBC)          [empty state until listings are added]
├── Publications ───── Recipharm (annual magazine)     [placeholder editions]
│                      Newspaper · Substack            [placeholder links]
├── Academics ──────── CGPA calculator                 [ready: Faculty of Pharmacy scale and pass mark]
│                      Resources                       [placeholder]
│                      Student support (Welfare & Academic support)
└── Connect ────────── Feedback & suggestions (to the Secretary General)
                       Alumni network (Alumni Network Committee)
                       Contact · Privacy notice
Header: search · light/dark toggle         Footer: name, motto, address, socials [placeholder], privacy
/admin (not linked publicly): sign-in · content · placeholders to fill · submissions
```

### Home page sections (in order)

1. Hero: full name, motto "Service to Humanity", one-line purpose, buttons to *About* and *Events*
2. Announcements (pinned first; hidden after expiry)
3. Upcoming events (next 3), or a friendly empty state
4. Open opportunities (closing soonest), or a friendly empty state
5. Our committees (cards linking to each committee)
6. Highlights from the gallery (Health Week 2026, Pharmalympics 2026)
7. Tools: CGPA calculator and feedback form
8. Footer

## Content: what we have and what is a placeholder

| Page / item | Status | Source or what is missing |
| --- | --- | --- |
| Name, motto, preamble, objectives | ✅ Ready | Constitution Art. 2, 3, Preamble |
| About the constitution (supremacy, non-discrimination, adoption) | ✅ Ready | Art. 1, 26 |
| Membership, honorary members, patrons' roles, extra-year students | ✅ Ready | Art. 4, 15 |
| Members' rights, officer accountability, discipline | ✅ Ready | Art. 15, 21, 24 |
| Governance: Congress, EC, Senate, Interim Council, representation | ✅ Ready | Art. 5, 7, 11, 12, 13, 14, 22, 25 |
| Executive offices and their duties (14 offices) | ✅ Ready | Art. 6, 8 |
| Senate composition, duties, principal officers | ✅ Ready | Art. 5, 16, 17, 18 |
| Elections, eligibility, Electoral Committee, swearing-in | ✅ Ready | Art. 9, 19, 24 |
| Constitutional standing committees | ✅ Ready | Art. 19 |
| Student support (Welfare and Academic) | ✅ Ready | Art. 8, 19 |
| Finance and accountability | ✅ Ready | Art. 10, 15, 20 |
| Meetings and procedures | ✅ Ready | Art. 22, 23 |
| Constitution amendment process | ✅ Ready | Art. 26 |
| Contact address | ✅ Ready | Art. 2 |
| Committees 2026/27: names and leads (11) | ✅ Ready | President's announcement |
| Committee descriptions: ADMAP, PPHT, SDG, Research Club, CPD & CBC, Alumni Network, IPSF | ✅ Ready | Committees write-ups |
| Committee descriptions: Content, Media, Design, Academics | 🟨 Placeholder | Write-ups needed |
| President | 🟨 Partial | Name known (Abigail Moejoh). Short bio to come from the President; official photo after the photoshoot (by 31 Oct 2026) |
| Other 13 executive officers | 🟨 Placeholder | Names and short bios to come from the President; official photos after the photoshoot (by 31 Oct 2026) |
| Senate principal officers (4) | 🟨 Placeholder | The Senate election has not been held yet. Only the four principal officers are shown, as placeholders |
| Patrons (Dean of the Faculty + four others) | 🟨 Placeholder | Names needed |
| History & milestones (first Pharmalympics, first Pharmathon, etc.) | 🟨 Placeholder | Verified dates and facts needed |
| Impact (numbers, outcomes) | 🟨 Placeholder | Figures needed |
| Full constitution PDF | ✅ Received | 55 pages, 7.1 MB (Canva export). The last page shows three handwritten signatures: confirm with the President that it may be published as is |
| Upcoming events | 🟨 Empty state | Event details needed |
| Past events: Health Week 2026, Pharmalympics 2026 | 🟨 Partial | Photos ready; descriptions and dates needed |
| Opportunities | 🟨 Empty state | Listings from CPD & CBC |
| Recipharm, newspaper, Substack | 🟨 Placeholder | Editions and links needed |
| Academic resources | 🟨 Placeholder | Vetted links from Academics Committee |
| CGPA calculator and academic standing | ✅ Ready | Faculty of Pharmacy handbook §3.5 and §3.7 |
| Official email and social handles | 🟨 Placeholder | Needed. Never use personal emails or phone numbers |
| High-resolution logo | 🟨 Placeholder | SVG or ≥ 1000 px needed |

## Placeholder rules

Missing content must be **visible as missing**, so nobody mistakes a placeholder for real information, and so admins can find and fill it.

1. **Never invent content.** No fake names, dates, numbers or "Lorem ipsum". A placeholder states what will appear there: *"Photo and bio coming soon"*, *"Recipharm 2026 edition coming soon"*, *"Date to be announced"*.
2. **Structure is real, details are pending.** For example, all 14 executive offices are shown with their constitutional duties; each officer card shows "Name to be announced" until filled.
3. **One look for every placeholder:** a `Placeholder` component with a dashed border in `#4a5a50`, a `#e1e8db` background, an icon and the text "Coming soon". Image placeholders use a neutral silhouette (people) or the PANS badge on pale grey (events and publications) with the label "Photo coming soon".
4. **Data flag:** every content document has `isPlaceholder: boolean` and `placeholderNote: string`. The seed script creates placeholders; saving real content in the dashboard clears the flag.
5. **Admin to-do list:** the dashboard has a **Placeholders** screen listing every item still marked `isPlaceholder`, grouped by page, so the team can work through them.
6. **Empty lists are not placeholders.** Upcoming events and opportunities show a friendly empty state ("No upcoming events yet. Check back soon.") rather than fake entries.
7. **Search ignores placeholders**, and link previews never use placeholder images.

## Leadership and committees (2026/2027)

### Executive Council: the 14 offices (Art. 6, 8)

| Office | Holder 2026/27 | Key duties (summary) | Eligibility at election (Art. 9) |
| --- | --- | --- | --- |
| President | **Abigail Moejoh** | Heads the EC; casting vote; co-ordinates activities; signatory; National Vice President of PANS | 3+ sessions in the Faculty (500L during tenure) |
| Vice President | *Placeholder* | Assists and acts for the President | 2+ sessions (400L/500L) |
| Secretary General | *Placeholder* | Meetings, correspondence, records, reports; secretariat; **receives complaints and suggestions** | 3+ sessions (500L) |
| Assistant Secretary General | *Placeholder* | Minutes in the SG's absence; property stock-taking | 200L at election (300L in tenure) |
| Treasurer | *Placeholder* | Receives and banks cash within four days; ledger; signatory | 2+ sessions (400L/500L) |
| Financial Secretary | *Placeholder* | Budgets, project finance, monthly reports; chairs Fundraising | 2+ sessions (400L/500L) |
| Public Relations Officer | *Placeholder* | Public liaison, media releases, publicity, notice board | 2+ sessions (400L/500L) |
| Assistant PRO | *Placeholder* | Assists and acts for the PRO | 200L at election (300L in tenure) |
| Editor-in-Chief | *Placeholder* (PRD names "Anu"; confirm full name) | Chairs the Editorial Board; Recipharm | 3+ sessions (500L) |
| Social Secretary | *Placeholder* | Social functions incl. PANS Dinner, Freshers Party | 2+ sessions (400L/500L) |
| Assistant Social Secretary | *Placeholder* | Assists and acts | 200L at election (300L in tenure) |
| Sports Secretary | *Placeholder* | Sporting activities; at least one annual sporting event | 2+ sessions (400L/500L) |
| Assistant Sports Secretary | *Placeholder* | Assists and acts | 200L at election (300L in tenure) |
| Welfare Secretary | *Placeholder* | Academic, social and psychological welfare; chairs Academic and Welfare Committees | 3+ sessions (500L) |

Each officer card shows **office, name, short bio and photo**.

- **Names and short bios** come from the President. Until then: "Name to be announced" and "Bio coming soon".
- **Photos** are taken at the October photoshoot and added by **31 October 2026**. Until then every card uses the person silhouette with "Photo coming soon", including the President's.
- Art. 8 lists no duties for the Editor-in-Chief; use the Editorial Board section (Art. 19 S.F: chairs the board, publishes Recipharm annually).

### Senate (Art. 5, 16–18)

**The Senate page shows only the four principal officers**, in this order:

| Office | Holder 2026/27 | Key duties (summary) | Eligibility |
| --- | --- | --- | --- |
| Senate President | *Placeholder* | Presides over the Senate and Congress; interprets the constitution; heads the Interim Council | Senator from 400L (going to 500L) with one session in the Senate |
| Deputy Senate President | *Placeholder* | Acts for the Senate President; always votes | Senator from 300L (400L in tenure) |
| Senate Leader | *Placeholder* | Minutes, attendance register, notices; Senate secretariat; secretary of the Interim Council | Senator from 400L with one session in the Senate |
| Chief Whip | *Placeholder* | Keeps order at Congress and Senate meetings | Senator from 400L (going to 500L) with one session in the Senate |

**The 2026/27 Senate election has not been held yet**, so all four are placeholders ("Election pending"). The ordinary Senators are not listed. The Governance page still explains the Senate's make-up: 22 Senators, 6 each from 200L–400L and 4 from 500L.

### Committees shown on the site

**Decision (14 Oct):** the Committees page shows the **11 committees appointed for 2026/2027** in the President's announcement. The constitution's **standing committees** (Electoral, Audit, Editorial Board, Social, Academic, Welfare, Sports, Fundraising) are described on the *Governance* page as part of how PANS works, without members. The PRD's "Flagship" committee is dropped because it is in neither source.

| # | Committee | Officers 2026/27 | Description |
| --- | --- | --- | --- |
| 1 | Anti-Drug Misuse and Abuse Program (**ADMAP**) | Lead: Dada Aishat (500L) · Assistant: Akintomide Oluwatomilola Maizah (300L) | ✅ Write-up |
| 2 | **Content** Committee | Lead: Obe Ipinuoluwa Deborah (500L) · Assistant: Ayanwola Favour (300L) | 🟨 Placeholder |
| 3 | **Media** Committee | Lead: Adekunle Oluwatimileyin (300L) · Assistant: Sobayo Eniola Olamide (300L) | 🟨 Placeholder |
| 4 | **Design** Committee | Lead: Odey Martins Wohu-owo (400L) · Assistant: Inyang Joel Ifiok (300L) | 🟨 Placeholder |
| 5 | PANS **Public Health Team** (PPHT) | Lead: Kosiso Okonkwo (500L) · Assistant: Uzoka Ugochukwu Samuel (400L) | ✅ Write-up |
| 6 | Sustainable Development Goals (**SDG**) Committee | Lead: Anjolaoluwa Oguntade (500L) · Assistant: Anekwe Chioma Jennifer (400L) | ✅ Write-up; motto "From Awareness to Action, From Service to Impact" |
| 7 | PANS **Research Club** | Lead: Abdulqoyyum Olayinka Shittu (500L) · Assistant: Arifalo Rufus (400L) | ✅ Write-up |
| 8 | Career and Professional Development & Capacity Building Committee (**CPD & CBC**) | Lead: Oladimeji Halimah Oladunmomi (400L) · Assistant: Daramola Babalola (300L) | ✅ Write-up; **owns the Opportunities Hub** |
| 9 | **Academics** Committee | Lead: John Oguntoyinbo (500L) · Assistant: Emmanuel Naomi (400L) | 🟨 Placeholder |
| 10 | PANS **Alumni Network** Committee | Chairman: Echezonah Momah · Secretary: Solola Amos | ✅ Write-up (titled "Alumni and Network Committee" in the write-ups) |
| 11 | International Pharmaceutical Students' Federation (**IPSF**) UNILAG | Local Exchange Officer (LEO): Kehinde Dora (500L) · Local Liaison Officer (LLO): Obatomisin Grace Obafemi (300L) | ✅ Write-up |

Committee pages show: name, short name, description, activities, achievements, plans, officers, and photos (placeholder until provided). Officer titles vary (Lead/Assistant, Chairman/Secretary, LEO/LLO), so officers are stored as a list of `{ title, name, level }`.

## Governance content from the constitution

The *Content to Include* PDF is the copy source for these pages; each section cites its article (e.g. "Art. 19") so readers can check the constitution. The full PDF prints "Article 18" twice and has no Article 19. We cite the second one, Standing Committees, as **Art. 19**, the order it falls in. The Constitution page offers the PDF as a download labelled with its size (7.1 MB). Key facts the UI must get right:

- **Three levels of government:** Executive Council (one session), Senate (22 members, tenure runs with the EC), General Assembly/**Congress** (all registered members; the highest organ).
- **Congress quorum:** one quarter of registered members. **Senate quorum:** one third.
- **Elections:** secret ballot; whole process within two weeks; candidate list published at least three days before; complaints within 48 hours; unopposed candidates need two thirds of votes; vacancies filled by by-election within 21 days.
- **Finance:** budget to the Senate within two weeks of swearing-in; no spending without a Senate-approved budget; Treasurer banks within four days; Audit Committee audits three times a semester.
- **Amendment:** two thirds of total Senate membership at a special sitting, ratified by two thirds at a Special General Assembly.
- **Editorial Board:** EIC plus nine others; publishes **Recipharm annually**.
- **Patrons:** the Dean of the Faculty of Pharmacy and four others.

## Events and gallery

### Past events with photos ready

| Series | Items (each becomes an event and an album) | Notes |
| --- | --- | --- |
| **PANS Health Week 2026: Redefine+** | Day 1 Trade Fair & Cooking Competition · Day 2 Trade Fair · Day 3 Medical Outreach 2026 · Day 4 FOP Preshow · Day 5 **Pharmathon** · Day 6 Quiz & Debate · Day 7 IPSF Counselling Competition · Day 8 Symposium · Day 9 ADMAP Rally | Fix Drive folder typos before import ("DAY 9Q"; two "Trade Fair … Day 1" folders). Dates to be confirmed |
| **Pharmalympics 2026** | Day 1 Opening Ceremony & Court Games · Day 2 Athletics & Swimming · Day 3 Football (1) · Day 4 Football (2) · Day 5 Court Games (Lawn Tennis & Volleyball) · Day 6 Football (3) · Day 7 Indoor Games · Day 8 Court Games Finals · Day 9 Football Finale | 100+ photos on Day 1 alone. Dates to be confirmed |

### Gallery rules

- Curate **20–40 photos per album**, resized to ≤ 2500 px on the long edge before upload; link to the full Drive folder for the rest (link stored in the album, not in this repo).
- Copy the chosen photos out of the personal Drive accounts into PANS-owned storage before upload.
- Albums belong to an event, and events can belong to a **series** (e.g. Pharmalympics 2026 → Day 1 … Day 9).
- Every photo needs alt text; captions are optional. Remove any photo on request.

## CGPA calculator

Source: **Faculty of Pharmacy student handbook, §3.5 "Scoring and grading system" (p. 22)**. These rules override anything else in this README.

| Score (%) | Grade | Grade point |
| --- | --- | --- |
| 70–100 | A | 5 |
| 60–69 | B | 4 |
| 50–59 | C | 3 |
| 45–49 | D | 2 |
| 40–44 | E | 1 |
| 0–39 | F | 0 |

> ⚠️ The handbook prints F as "<50", which overlaps C, D and E. We use **0–39**, the only reading consistent with the rest of the table. **To confirm with the Faculty.**

| CGPA | Result (handbook wording) |
| --- | --- |
| 2.40–5.00 | **Pass** |
| 0.00–2.39 | **Fail** |

The handbook defines only Pass and Fail. It does **not** list classes of degree (First Class, etc.), so the calculator doesn't show one. Add classes only if the Faculty supplies them.

- **Credit units:** each course is 1–3 units (handbook: "Min of 1 and Max of 3").
- **Grade point** for a course = units × grade point.
- **GPA** (one semester) = Σ(units × grade point) ÷ Σ(units).
- **CGPA** = the same sum across every semester entered.
- Results are shown to **2 decimal places**. Pass/Fail and the 2.40 checks use the rounded value, so the label always matches the number on screen.

### Academic standing (handbook §3.7, p. 23)

Shown as a short explainer under the result. The calculator gives guidance only; it doesn't decide anyone's standing. The pass mark for every rule is **2.40**.

| Status | When (summary) |
| --- | --- |
| **Good standing** | CGPA **and** semester GPA are both 2.40 or above |
| **Warning** | Previously in good standing, CGPA is at least 2.40 but the semester GPA is below 2.40 (not for first-year students) |
| **Probation** | E.g. on Warning and the semester GPA is below 2.40 again, or both CGPA and GPA fall below 2.40 |
| **Withdrawal** | E.g. on Probation and the semester GPA is below 2.40 again; CGPA below 2.40 for a third time after two probations; absent for three consecutive semesters |
| **New entrants** (first year: 100L UTME, 200L or 300L direct entry) | First-semester GPA below 2.40 → Probation; below 2.40 again → Withdrawal |

Calculator behaviour:

- When the latest semester GPA or the CGPA is below 2.40, show a calm note: *"Below the 2.40 pass mark. Check the academic standing rules and speak to your level adviser."* The note never says "you are on probation".
- Students enter, per course: course code (optional), units (1–3) and either a score or a grade. Scores map to grades using the table above.
- Runs **entirely in the browser**; nothing is stored or sent. The scale is fetched from `/api/grading-scale` so admins can update it without code (bundled copy as a fallback).
- Footnote: *"Calculated with the Faculty of Pharmacy grading scale (student handbook §3.5). Your official result is the one issued by the University."*
- **Unit tests** cover:
  - score boundaries: 39/40, 44/45, 49/50, 59/60, 69/70, 100;
  - units outside 1–3 are rejected;
  - zero total units and empty input;
  - failed courses;
  - rounding at x.xx5;
  - the pass mark: 2.39 vs 2.40, including 2.395 rounding up to 2.40.

## Who owns which content

| Content | Owner after launch |
| --- | --- |
| Overall copy and editorial approval | **Editor-in-Chief** with the **Content Committee** |
| Photos, gallery albums | **Media Committee** |
| Visual assets, logo artwork, banners | **Design Committee** |
| Opportunities Hub | **CPD & CBC** (the committee's own plan includes an Opportunities Hub) |
| Alumni form submissions | **Alumni Network Committee** (Chairman and Secretary) |
| Feedback and suggestions | **Secretary General** (constitutional duty, Art. 8); welfare issues to the **Welfare Secretary** |
| CGPA scale and academic resources | **Academics Committee** |
| Events and announcements | **PRO** and the organising committee |
| Recipharm and publications | **Editor-in-Chief** / Editorial Board |
| Executive and Senate lists each session | **Secretary General** |
| Website, accounts, backups | Web lead plus two named admins |

## Tech stack

| Layer | Choice | Status |
| --- | --- | --- |
| Database | **MongoDB** on MongoDB Atlas, modelled with **Mongoose** | Decided |
| API | **Express** on **Node.js**, TypeScript | Decided |
| Frontend | **React** + TypeScript, **Vite**, **React Router** | Decided (Vite and React Router proposed) |
| Images | **Cloudinary**: `cloudinary` SDK on the server; `@cloudinary/react` + `@cloudinary/url-gen` on the client | Decided |
| Validation | **Zod** at every API entry point | Proposed |
| Styling | Tailwind CSS with the brand tokens above as CSS variables | Proposed |
| Server state on the client | TanStack Query | Proposed |
| Admin auth | Email + password (argon2), session JWT in an `httpOnly`, `Secure`, `SameSite=Lax` cookie | Proposed |
| Markdown rendering | For constitution-derived page sections (sanitised) | Proposed |
| Testing | Vitest, Supertest, Playwright | Proposed |
| Hosting | Client: static host. API: Render. DB: Atlas | Proposed |
| Node.js | **22 LTS** (Vite needs 20.19+ or 22.12+) | Required |
| Repository | npm workspaces: `client/`, `server/` | Proposed |

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

## Project structure

Follows [`.agent/architect.md`](.agent/architect.md): Node API as `src/modules/<feature>/{http,application,domain,infrastructure}`; React SPA as `src/features/<feature>/{api,components,pages}`.

```
pans-unilag-website/
├── client/                          # React + Vite + TypeScript SPA
│   ├── public/                      # favicon (from the badge), manifest, robots.txt, og-default.png
│   └── src/
│       ├── app/                     # router.tsx, providers.tsx, layouts/ (Public, Admin)
│       ├── features/
│       │   ├── home/
│       │   ├── about/               # who we are, membership & rights, history, impact
│       │   ├── leadership/          # executive council, senate, committees, patrons
│       │   ├── governance/          # governance, elections, finance, meetings, constitution
│       │   ├── events/              # upcoming, past, series, detail
│       │   ├── gallery/
│       │   ├── opportunities/
│       │   ├── publications/
│       │   ├── academics/
│       │   │   ├── cgpa/            # calculator UI + model/ (pure maths, unit tested)
│       │   │   └── resources/
│       │   ├── connect/             # feedback, alumni, contact, privacy
│       │   ├── search/
│       │   └── admin/               # sign-in, editors, placeholders list, submissions
│       ├── components/
│       │   ├── layout/              # Header, Footer, Navigation, SkipLink
│       │   └── ui/                  # Button, Card, Badge, ThemeToggle, Placeholder, EmptyState
│       ├── lib/                     # http, cloudinary, dates (Africa/Lagos), env
│       └── styles/                  # tokens.css (brand + dark mode), globals.css
├── server/                          # Express + TypeScript API
│   ├── src/
│   │   ├── app.ts                   # builds the app (middleware, routes, errors)
│   │   ├── server.ts                # connects to MongoDB and listens
│   │   ├── config/                  # env.ts (Zod-validated), db.ts, cloudinary.ts
│   │   ├── docs/                    # OpenAPI document + Swagger UI (/api/docs)
│   │   ├── lib/                     # httpError (error codes), logger
│   │   ├── middleware/              # requestId, requestLogger, validate, rateLimit, errorHandler, notFound, requireAdmin
│   │   └── modules/
│   │       ├── pages/               # constitution-derived page sections
│   │       ├── executives/
│   │       ├── senate/
│   │       ├── committees/
│   │       ├── patrons/
│   │       ├── milestones/
│   │       ├── events/              # includes series (Health Week, Pharmalympics)
│   │       ├── albums/
│   │       ├── announcements/
│   │       ├── opportunities/
│   │       ├── publications/
│   │       ├── documents/           # constitution PDF etc.
│   │       ├── resources/
│   │       ├── grading/             # Faculty grading scale + pass mark
│   │       ├── submissions/         # feedback + alumni
│   │       ├── settings/            # contact, socials, quick links
│   │       ├── placeholders/        # aggregated to-do list for admins
│   │       ├── search/
│   │       ├── media/               # Cloudinary upload signatures
│   │       └── auth/
│   ├── scripts/                     # seed.ts, create-admin.ts, backup notes
│   ├── seed/                        # JSON built from the sources (see below)
│   └── tests/
├── docs/                            # admin guide (before handover)
├── .github/
│   ├── ISSUE_TEMPLATE/              # feature, bug and content issue forms
│   └── pull_request_template.md
├── tests/e2e/                       # Playwright smoke tests
├── package.json                     # npm workspaces root
├── CONTRIBUTING.md                  # how to claim issues and raise PRs
├── .gitattributes · .gitignore · README.md
```

### Seed files (`server/seed/`)

| File | Built from | Placeholders inside |
| --- | --- | --- |
| `pages.json` | Content to Include PDF (sections 1–14) | None |
| `executives.json` | 14 offices from the constitution | 13 names (President's name filled); all bios and photos |
| `senate.json` | The 4 principal offices | All names (election pending) |
| `committees.json` | President's announcement + write-ups | 4 descriptions, all photos |
| `patrons.json` | Constitution Art. 4 | All names |
| `milestones.json` | To be supplied | All |
| `events.json` | Health Week 2026 (9), Pharmalympics 2026 (9) | Dates and descriptions |
| `albums.json` | Drive folders (curated) | None once photos are uploaded |
| `publications.json` | To be supplied | Recipharm, newspaper, Substack |
| `grading.json` | Faculty handbook §3.5: grades, Pass/Fail bands, 1–3 units | None |
| `settings.json` | Constitution contact address | Email, social handles |

## Architecture rules

1. **Thin HTTP layer.** Routes validate with Zod, call a service, shape the response. Business rules live in `application/` and `domain/`; Mongoose stays in `infrastructure/`.
2. **Validate every input on the server**, including admin requests; reject unknown fields.
3. **Return only intended fields.** Never expose password hashes, submissions or internal notes publicly.
4. **Secrets stay on the server.** Anything prefixed `VITE_` is public.
5. **Pure logic is unit-tested:** CGPA maths, archive rules, deadline rules.
6. **Every screen handles all states:** loading, empty, error, not-found, and placeholder.
7. **`/admin` is code-split** so public visitors never download it.
8. **Use the brand tokens**, never raw hex values in components.
9. **No new libraries without a reason** agreed in a pull request.

### API conventions (server)

The API skeleton (issue #3) provides these building blocks. Use them instead of writing your own:

| Need | Use | Where |
| --- | --- | --- |
| Validate params, query or body | `validate({ params, query, body })` with **`z.strictObject(...)`** schemas, so unknown fields are rejected | `server/src/middleware/validate.ts` |
| Return an error from a route or service | `throw HttpError.notFound('Event not found')` (also `badRequest`, `validation`, `unauthorized`, `forbidden`, `conflict`, `tooManyRequests`) | `server/src/lib/httpError.ts` |
| Handle Mongoose / MongoDB errors | Nothing: bad ObjectIds, schema validation and duplicate keys are mapped automatically (see *Error codes*) | `server/src/middleware/errorHandler.ts` |
| Log something | `logger.info/warn/error(message, { requestId: req.id, ... })`. Never log secrets or personal data | `server/src/lib/logger.ts` |
| Limit abuse on a route (login, forms) | `createRateLimiter({ windowMs, limit })` | `server/src/middleware/rateLimit.ts` |
| Add a new environment variable | Add it to the Zod schema in `config/env.ts` **and** to `server/.env.example` | `server/src/config/env.ts` |
| Add a feature | `modules/<feature>/http/<feature>.routes.ts` exporting a router, mounted under `/api/<feature>` in `app.ts` | `server/src/modules/` |
| Document an endpoint | `modules/<feature>/http/<feature>.openapi.ts` exporting its paths, spread into `docs/openapi.ts`. **Every endpoint must be documented in the same PR** | `server/src/docs/` |
| Test an endpoint | Supertest against `createApp(...)` (no port, no database needed) | `server/tests/` |

Define each Zod schema **once** and use it for both validation and the docs, so they can't drift apart:

```ts
// modules/events/http/events.schemas.ts
export const eventSlugParams = z.strictObject({ slug: z.string().min(1) })
export const eventSchema = z.object({ title: z.string(), slug: z.string() /* ... */ }).meta({ id: 'Event' })

// modules/events/http/events.routes.ts
router.get('/:slug', validate({ params: eventSlugParams }), async (req, res) => {
  const event = await eventsService.findBySlug(req.params.slug)
  if (!event) throw HttpError.notFound('Event not found')
  res.json(event)
})

// modules/events/http/events.openapi.ts
export const eventsPaths: ZodOpenApiPathsObject = {
  '/api/events/{slug}': {
    get: {
      tags: ['Events'],
      operationId: 'getEvent',
      summary: 'One event',
      requestParams: { path: eventSlugParams },
      responses: {
        '200': { description: 'The event', content: { 'application/json': { schema: eventSchema } } },
        ...errors.badRequest,
        ...errors.notFound,
        ...errors.internal,
      },
    },
  },
}
```

Express 5 passes errors thrown in async handlers to the error handler automatically, so no `try/catch` is needed in routes.

**API docs (Swagger):** with the API running, open **http://localhost:4000/api/docs** (or http://localhost:5173/api/docs through the client) to browse and try every endpoint. The raw OpenAPI 3.1 document is at `/api/docs/openapi.json`. Docs are on by default outside production; set `API_DOCS_ENABLED=true` or `false` to override.

## Data model

All collections share `isPlaceholder` (boolean), `placeholderNote` (string), `createdAt` and `updatedAt`. Dates are stored in UTC and shown in **Africa/Lagos** time.

| Collection | Key fields | Notes / indexes |
| --- | --- | --- |
| `pages` | slug (unique), title, sections[{ heading, bodyMarkdown, articleRefs[] }], order | About, Membership, Governance, Elections, Finance, Meetings, Student support |
| `executives` | office (one of the 14), name, level, session, photo, bio (≤ 60 words), roleEmail, order | Earlier sessions build Past Executives |
| `senate` | position (Senate President, Deputy Senate President, Senate Leader, Chief Whip), name, level, session, order | Principal officers only for 2026/27 |
| `committees` | name, shortName, slug (unique), description, activities[], achievements[], plans[], motto, officers[{ title, name, level }], session, order | 11 for 2026/27 |
| `patrons` | name, title, isDean, order | |
| `milestones` | year, title, description, verifiedBy | `verifiedBy` required unless placeholder |
| `events` | title, slug (unique), series, dayNumber, startsAt, endsAt, venue, description, coverImage, registrationUrl, committeeRef | Upcoming vs past by `endsAt`; text index |
| `albums` | title, slug, eventRef, series, date, cover, photos[{ publicId, alt, caption }], sourceFolderUrl, consentConfirmed | Grouped by series and year |
| `announcements` | title, body, publishAt, expiresAt, pinned | Hidden after `expiresAt` |
| `opportunities` | title, slug, type, eligibility, deadline, applyUrl, lastCheckedAt | Hidden after `deadline` |
| `publications` | title, series (`recipharm`, `newspaper`, `substack`), edition, date, cover, fileUrl or link | |
| `documents` | title, version, approvedOn, approvedBy, fileUrl | Constitution adopted 9 July 2026 |
| `resources` | title, level, semester, course, url, verifiedBy | |
| `gradingscales` | grades[{ letter, min, max, point }], bands[{ name, min, max }] (Pass/Fail), passMark (2.40), units { min: 1, max: 3 }, active, source | One active scale |
| `settings` | contactEmail, socialLinks, quickLinks, homeBanner, postalAddress, location | Single document |
| `feedback` | category (`suggestion`, `complaint`, `welfare`, `other`), message, contactEmail?, status, createdAt | Admin-only; deleted after 12 months |
| `alumni` | name, graduationYear, email, phone?, interests[], consentAt | Admin-only; kept until opt-out |
| `admins` | name, email (unique), passwordHash, role (`admin`, `editor`), lastLoginAt | Never public |

## API reference (planned)

All responses are JSON. Errors always have the same shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": [{ "location": "body", "path": "email", "message": "Invalid email address" }],
    "requestId": "2f1c6c1e-6a3b-4d8e-9a43-1c2b7a5d9e10"
  }
}
```

- **`code`** is stable: the client should switch on it, never on `message`.
- **`message`** is safe to show to users.
- **`details`** appears only when useful (validation errors, conflicts).
- **`requestId`** matches the `X-Request-Id` response header and the server log line. Show it in error screens so users can quote it.
- Outside production, 500 responses also include `debug` (the stack trace). Production never exposes internal details.

#### Error codes

| Status | `code` | When |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Failed Zod or Mongoose validation (`details` lists each field) |
| 400 | `INVALID_JSON` | Request body is not valid JSON |
| 400 | `INVALID_ID` | Malformed id, e.g. not an ObjectId |
| 400 | `BAD_REQUEST` | Any other bad request |
| 401 | `UNAUTHORIZED` | Not signed in (admin routes) |
| 403 | `FORBIDDEN` | Signed in but not allowed |
| 404 | `NOT_FOUND` | Unknown route or item |
| 409 | `CONFLICT` | Duplicate of a unique field (`details.fields` names it; the value is never echoed) |
| 413 | `PAYLOAD_TOO_LARGE` | Request body over 100 KB |
| 429 | `RATE_LIMITED` | Rate limit reached (`Retry-After` header set) |
| 500 | `INTERNAL_ERROR` | Unexpected error; logged with the request id |

Unexpected crashes outside a request (an unhandled promise rejection or exception) are logged and the process exits with code 1, so the host restarts it cleanly.

`GET /api/health` (live) returns `{ "status": "ok" | "degraded", "db": "connected" | "disconnected" | …, "uptimeSeconds": n }`.

Public (read-only unless noted):

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| GET | `/api/settings` | Contact, socials, quick links, banner |
| GET | `/api/pages/:slug` | Constitution-derived page content |
| GET | `/api/executives?session=` | Executive Council (current session by default) |
| GET | `/api/senate?session=` | Senate principal officers |
| GET | `/api/committees`, `/api/committees/:slug` | Committees |
| GET | `/api/patrons` | Patrons |
| GET | `/api/milestones` | History timeline |
| GET | `/api/events?status=upcoming\|past&series=&month=` | Events |
| GET | `/api/events/:slug` | One event |
| GET | `/api/albums`, `/api/albums/:slug` | Gallery |
| GET | `/api/announcements` | Active announcements |
| GET | `/api/opportunities?type=`, `/api/opportunities/:slug` | Opportunities |
| GET | `/api/publications?series=` | Publications |
| GET | `/api/documents` | Constitution and approved documents |
| GET | `/api/resources?level=&semester=` | Academic resources |
| GET | `/api/grading-scale` | Grading scale, Pass/Fail bands, pass mark and unit limits |
| GET | `/api/search?q=` | Search (excludes placeholders) |
| POST | `/api/feedback` | Feedback (rate-limited, anonymous allowed) |
| POST | `/api/alumni` | Alumni details (rate-limited, consent required) |

Admin (signed-in only): `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`; `GET/POST /api/admin/:resource`; `GET/PATCH/DELETE /api/admin/:resource/:id`; `GET /api/admin/placeholders`; `GET /api/admin/submissions/{feedback,alumni}`; `POST /api/admin/media/signature`.

## Getting started

### Prerequisites

Node.js **22 LTS**, npm, Git, a MongoDB connection string (personal free Atlas cluster or local MongoDB for development), and Cloudinary credentials from the web lead.

### Setup

```bash
git clone https://github.com/YastecHub/pans-unilag-website.git
cd pans-unilag-website
npm install                            # installs the root, client and server workspaces
cp server/.env.example server/.env     # Windows: copy server\.env.example server\.env
cp client/.env.example client/.env     # Windows: copy client\.env.example client\.env
npm run dev                            # client http://localhost:5173, API http://localhost:4000
```

In development the client forwards `/api/*` requests to the API, so open **http://localhost:5173** and everything works from one address. Check the API directly at http://localhost:4000/api/health, and browse the API docs at http://localhost:4000/api/docs. Never commit `.env` files.

The API needs a `MONGODB_URI` in `server/.env` (a free personal Atlas cluster or local MongoDB). Without one it stops at startup with a message saying what is missing; if Atlas refuses the connection, add your IP address under **Network Access**.

### Scripts (run from the repository root)

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the API (`tsx watch`) and the client (Vite) together |
| `npm run build` | Production build of both workspaces (`client/dist`, `server/dist`) |
| `npm run lint` | ESLint across the whole repo (one shared config: `eslint.config.js`) |
| `npm run typecheck` | TypeScript checks in both workspaces |
| `npm run test` | Vitest in both workspaces |
| `npm run format` / `npm run format:check` | Prettier for code files |
| `npm run <script> -w client` or `-w server` | Run a script in one workspace only |

The seed command (`npm run seed -w server`) arrives with issue #8.

## Environment variables

**`server/.env`:** `NODE_ENV`, `PORT`, `MONGODB_URI` (secret), `CLIENT_ORIGIN`, `API_DOCS_ENABLED` (optional; docs default on outside production), `JWT_SECRET` (secret), `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (secret).

**`client/.env`** (all public): `VITE_API_URL`, `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_SITE_URL`.

## Images and Cloudinary

- Render with `AdvancedImage` (`@cloudinary/react`), automatic format and quality, sized for where the image appears; `alt`, `width`, `height` always; lazy-load below the fold.
- Folders:

```
pans-unilag/
├── brand/                                   # badge, lockups, og-default
├── executives/2026-2027/
├── senate/2026-2027/
├── committees/<committee-slug>/
├── events/health-week-2026/<day-slug>/
├── events/pharmalympics-2026/<day-slug>/
└── publications/<series>/
```

- Uploads from the dashboard are **signed** via `/api/admin/media/signature`. No unsigned presets.

## Security, privacy and data protection

- **Admin sign-in:** argon2 hashes; `httpOnly`/`Secure`/`SameSite` cookie; rate-limited login; no public sign-up (`scripts/create-admin.ts`); at least two admins.
- **API hardening:** `helmet`, CORS allowlist, Zod validation rejecting unknown fields, rate limits on forms and login, request size limits; never pass raw request objects into Mongoose queries.
- **Personal data:** never publish personal phone numbers or personal emails (including those on letterheads). Use role emails or the Secretary General's official channel.
- **Forms:** feedback can be anonymous; alumni needs consent; only admins read submissions; the privacy notice states who reads them, retention and deletion requests.
- **Backups:** Atlas's free tier has no automatic backups. Run `mongodump` weekly and before major changes; test a restore before launch.
- **Nigeria Data Protection Act 2023:** confirm with the Faculty or UNILAG's data protection office whether PANS needs NDPC registration. Not legal advice.
- Run a security review with `.agent/red-team.md` on the auth and submissions modules before launch.

## Performance, SEO and accessibility

| Target | Threshold |
| --- | --- |
| Home page weight (mobile, first load) | < 1 MB including JavaScript |
| Lighthouse mobile (Performance, Accessibility, Best Practices, SEO) | ≥ 90 each |
| Accessibility | WCAG 2.1 AA; brand contrast rules above; keyboard navigation; visible focus (yellow `#ffbd04` ring on dark, dark green on light); alt text; no text inside images |
| Fonts | Poppins 500/600 and Inter 400/500 only |
| Real-device check | Mid-range Android on throttled 3G/4G |

**Link previews:** a React SPA renders in the browser, and WhatsApp and most crawlers don't run JavaScript. For v1, set site-wide Open Graph tags (name, motto, badge on pale green) in `client/index.html`. After launch, add per-page previews for events and opportunities via Express or pre-rendering.

## Deployment

| Part | Host | Notes |
| --- | --- | --- |
| Client | Vercel, Netlify or Cloudflare Pages | SPA fallback rewrite to `index.html` |
| API | Render | Free instances sleep after 15 min idle (~1 min to wake); Starter (~$7/month) stays on |
| Database | MongoDB Atlas M0 | 512 MB, no automatic backups |
| Images | Cloudinary | Free plan; curate albums to stay within limits |

All accounts belong to the official PANS account, never a personal one.

## Contributing and project management

**Read [CONTRIBUTING.md](CONTRIBUTING.md) before picking up work.** It covers claiming issues, branch names, commits, pull requests, reviews and the Definition of Done. The short version:

1. Pick an unassigned issue in the **Launch: Fri 16 Oct 2026** milestone, starting with `priority: P0`. Check its *Depends on* list.
2. Comment "I'm taking this" and assign yourself (two open issues max).
3. Branch from the latest `main`: `<type>/<issue-number>-<short-description>`, e.g. `feat/15-events-api`.
4. Commit with Conventional Commits: `feat(server): add events endpoints`.
5. Open a **draft PR within 3 hours**, titled `feat(server): add events endpoints (#15)`, with `Closes #15` in the description.
6. Mark it ready when lint, typecheck, tests and build pass and the acceptance criteria are met; add mobile and desktop screenshots for UI.
7. One approval and green CI, then the author **squash-merges** and deletes the branch.

### Repository and branch rules

- Repo: `YastecHub/pans-unilag-website`. Move it to a PANS-owned GitHub organisation before handover.
- **Protect `main`** (Settings → Branches): require a pull request, one approval, the `ci` status check (available after CI has run once), and an up-to-date branch; block force pushes.
- Issue forms (feature, bug, content) and the PR template live in `.github/`. Blank issues are disabled.
- **CI** (`.github/workflows/ci.yml`, job `ci`) runs on every pull request and every push to `main`: `npm ci`, lint, format check, typecheck, tests and build, on Node from `.nvmrc`. To catch failures before pushing, run:

  ```bash
  npm run lint && npm run format:check && npm run typecheck && npm run test && npm run build
  ```

  If only formatting fails, `npm run format` fixes it.

### Labels and milestones

| Group | Labels |
| --- | --- |
| Type | `type: feature`, `type: bug`, `type: content`, `type: design`, `type: chore`, `type: docs`, `type: test` |
| Area | `area: client`, `area: server`, `area: admin`, `area: infra`, `area: content` |
| Priority | `priority: P0` (launch blocker), `priority: P1` (should ship Friday), `priority: P2` (after launch) |
| Size | `size: S` (~2 h), `size: M` (half a day), `size: L` (a day or more) |
| Status | `status: blocked`, `status: needs-info`, `good first issue`, `help wanted` |

Milestones: **Launch: Fri 16 Oct 2026** and **Post-launch**.

### Backlog

All work is tracked as **46 GitHub issues** in build order: [github.com/YastecHub/pans-unilag-website/issues](https://github.com/YastecHub/pans-unilag-website/issues). Each issue has tasks, acceptance criteria, dependencies, labels and a milestone, and ends with a "How to work on this issue" section linking to the [Contributing guide](CONTRIBUTING.md) with its branch name and PR title. New issues use the forms in `.github/ISSUE_TEMPLATE/` (feature, bug, content).

### Build order (critical path)

Work flows top to bottom; items in the same row can run in parallel.

| Phase | Issues | Who |
| --- | --- | --- |
| 1. Foundation | #1 scaffold → #2 CI, #3 API skeleton, #4 design tokens | Web lead + 1 dev |
| 2. Building blocks | #5 screen designs, #6 app shell, #7 UI primitives, #8 seed script | Frontend, backend, Design Committee |
| 3. Content | #9 pages seed, #10 leadership seed, #11 committees seed, #12 events/grading/settings seed, #13 gallery photos, #14 missing content | Content and Media committees + 1 dev |
| 4. API | #15 pages, #16 leadership, #17 events, #18 content, #19 grading/settings, #20 submissions, #22 admin auth → #23 admin CRUD, #24 uploads, #21 search | Backend |
| 5. Pages | #25 home, #26 about, #27 leadership, #28 governance, #29 events, #33 CGPA, #35 connect, then #30 gallery, #31 opportunities, #32 publications, #34 academics, #36 search, #40 SEO | Frontend |
| 6. Admin | #37 admin shell → #38 editors | Frontend + backend |
| 7. Launch | #41 deploy → #42 security and backups, #43 QA | Web lead + everyone |
| After launch | #39 more editors, #44 admin guide, #45 link previews, #46 offline/PWA | Team |

#33 (CGPA) only needs #7, so it can start early. Seed files (#9–#12) can be written as soon as the JSON shape is agreed in #8.

## Timeline

| Day | Backend | Frontend | Content |
| --- | --- | --- | --- |
| **Wed 14 Oct** | Scaffold; models; seed files (pages, executives, committees, grading, events); public read endpoints | Scaffold; tokens and fonts; layout and navigation; Home, About, Leadership, Governance pages; Placeholder component | **Content freeze (evening)**; missing items become placeholders |
| **Thu 15 Oct** | Admin auth and CRUD (announcements, events, opportunities, placeholders); submissions; upload signatures; security pass | Events, gallery, opportunities, publications, academics (CGPA), connect; admin sign-in and editors | Photos curated and uploaded; **executive review and approval** |
| **Fri 16 Oct** | Deploy API and DB; backup; smoke tests | Deploy client; Lighthouse and accessibility checks | **Launch** |
| Week after | Remaining admin editors; per-page previews | Polish; PWA if time | Fill placeholders through the dashboard |

## Definition of done

- [ ] All launch pages render correctly on mobile and desktop, with real content or clearly marked placeholders.
- [ ] No invented content anywhere; the admin Placeholders list is reviewed.
- [ ] Navigation, links and forms tested.
- [ ] Content reviewed for accuracy, spelling, permissions; name and motto exactly as in the constitution.
- [ ] CGPA calculator passes its boundary tests.
- [ ] Named administrators and an admin guide exist.
- [ ] Admin auth, validation, rate limits, CORS in place; secrets only in server env vars.
- [ ] A backup has been taken and restored once.
- [ ] Performance and accessibility targets met.
- [ ] Executive team approval.
- [ ] Every `priority: P0` issue in the launch milestone is closed.

## Decisions log

| Date | Decision |
| --- | --- |
| 12 Oct | Launch moved to Fri 16 Oct; CGPA calculator added; member accounts deferred to phase 2 |
| 14 Oct | Stack changed to MERN (TypeScript, Cloudinary kept); admin dashboard replaces a headless CMS |
| 14 Oct | Name follows the constitution: "Pharmaceutical Association of **Nigeria** Students" |
| 14 Oct | Committees page = the 11 committees appointed for 2026/27; constitutional standing committees described on Governance; "Flagship" dropped |
| 14 Oct | Missing content ships as clearly marked placeholders, never invented content |
| 14 Oct | CGPA uses the UNILAG standard 5-point scale, confirmed by the Faculty |
| 14 Oct | Work is tracked as 46 GitHub issues; contributions follow CONTRIBUTING.md with squash-merged PRs |
| 15 Oct | CGPA follows the Faculty of Pharmacy handbook §3.5: Pass 2.40–5.00 / Fail 0–2.39, no degree classes, 1–3 units per course; F read as 0–39 (handbook typo "<50", to confirm); academic standing (§3.7) shown as guidance |
| 15 Oct | Senate page shows only the four principal officers, as placeholders until the Senate election |
| 15 Oct | Executive cards show office, name, short bio and photo; names and bios to come from the President; photos after the October photoshoot (by 31 Oct) |
| 15 Oct | Full constitution PDF received (55 pp., 7.1 MB) |

## Using the AI agent prompts (`.agent/`)

Plain Markdown role prompts (architect, engineer, database specialist, react engineer, red team, accessibility reviewer, test engineer, …). Tell your assistant which to apply, for example:

> Read and apply `.agent/engineer.md`, `.agent/database-specialist.md` and `.agent/project-context.md`. Implement `server/src/modules/committees` as described in the README.

- `.agent/` is committed, so everyone who clones the repo gets the prompts and `project-context.md`.
- The prompts say `agent/…`; here the folder is `.agent/`.
- Next.js, payments, background-job and hackathon roles don't apply.

## Maintenance and handover

- **Ownership:** domain, hosting, Atlas, Cloudinary, GitHub and analytics on the official PANS account, two admins each, two-factor on.
- **Monthly:** check links, review opportunities, update events, clear expired announcements, back up the database, `npm audit`.
- **Each session:** the Secretary General updates the Executive Council, Senate and committee officers; departing admins are removed and new ones created.
- **Admin guide:** `docs/admin-guide.md` (how to post an event, opportunity or album; how to clear placeholders) before handover.

---

*Maintained by the PANS UNILAG web team. Content owned by the PANS UNILAG Executive Council. Service to Humanity.*
