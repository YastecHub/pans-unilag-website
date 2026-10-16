# PANS UNILAG website: admin guide

For the executives who keep the website up to date: the President, the Secretary General, the
PRO, committee leads and the Media Committee. No coding needed. Everything here is done in the
dashboard, except the few jobs marked **web lead**.

## 1. Signing in

- Go to the website's address with **/admin** at the end (for example `…/admin`).
- Sign in with the email and password the web lead gave you. There is no sign-up page: accounts
  are only created by the web lead (section 9).
- You stay signed in for **8 hours**. On a shared or faculty computer, always click **Sign out**
  (top right) when you finish.
- After too many wrong passwords the sign-in form makes you wait about 15 minutes. If you've
  forgotten your password, ask the web lead to reset it.
- If your session ends while you're editing, the page says so. Sign in again **in a new tab**,
  then come back and click save again: your changes are still on the page.

## 2. The dashboard

The menu at the top has five parts:

| Menu | What it's for |
| --- | --- |
| **Overview** | How many placeholders are left to fill, new feedback messages and alumni sign-ups. |
| **Content** | Every editor, in four groups (below). |
| **Placeholders** | Everything the site is still waiting for, shown to visitors as "Coming soon". |
| **Feedback** | Messages sent from the feedback form (admins only). |
| **Alumni** | Alumni who signed up for the directory (admins only). |

The **Content** groups:

- **News & events:** Events, Announcements, Opportunities, Gallery (photo albums).
- **People:** Executive Council, Senate, Committees, Patrons.
- **Pages & documents:** Pages (the constitution-based pages such as About and Governance),
  Documents, Publications.
- **Academics:** Academic resources, Grading scale. **Site:** Contact & footer.

Every editor works the same way: open it from **Content**, click **New …** (or an existing item)
to open the form, fill it in, then click **Publish …** (new items) or **Save changes**. It's on
the site straight away. Mistakes in the form are listed at the top, with links to the fields.
To remove an item, open it and use **Delete** at the bottom; this can't be undone.

General rules for every form:

- **Never invent anything.** If a detail isn't confirmed, leave it out or tick
  **Still waiting for some details** (section 6).
- **Links** must start with `https://`.
- **Emails** are office emails only (e.g. the Secretary General's role address), never a
  personal one. Don't put anyone's phone number on the site.
- **Description and Message boxes** accept simple formatting: `**bold**`, lists starting with
  `- `, and links written as `[text](https://…)`.
- All dates and times are **Lagos time**.

## 3. Posting an event

**Content → Events → New event.**

1. **Title**, e.g. "Pharmalympics 2027". The **Web address** fills itself in from the title
   (`/events/pharmalympics-2027`); change it only if you need to, and never after the event has
   been shared, or old links break.
2. **When:** choose one:
   - **Exact dates:** the start day, and an end day for a multi-day event. Leave both times empty
     for an all-day event.
   - **Months only:** when only the month is fixed, e.g. "April – May 2027". The site never shows
     a made-up day.
   - **Not known yet:** for a past event whose dates weren't recorded. It stays a placeholder.
3. **Venue**, **Organised by** and a **Description**.
4. **Registration link** (optional): the Google Form or ticket page. The **Register** button
   appears on the event once this is set.
5. For a week of events (e.g. Health Week), make **one event per day** and give them the same
   **Series** name ("PANS Health Week 2027") and a **Day** number. The site groups them.
6. Click **Publish event**.

The event shows under **Upcoming** until it ends, then moves to **Past events** by itself.
Events don't have a flyer upload; photos from an event go in a Gallery album (section 5).

## 4. Posting an opportunity or an announcement

**Opportunity** (internships, scholarships, competitions…): **Content → Opportunities → New
opportunity.**

1. **Title**, **Type** (scholarship, internship, competition, conference, training, job or
   other) and **Offered by** (the organisation).
2. **Apply link:** the organisation's official page, not a copy of it. Required.
3. **Deadline:** the last day to apply. The opportunity disappears from the site the day after.
   Leave it empty only if applications are always open.
4. **Who can apply** (e.g. "300L and 400L students"), a **Description**, and **Details checked
   on**: the day you confirmed the details on the official site (students see it).
5. Click **Publish opportunity**.

**Announcement** (a short notice on the home page): **Content → Announcements → New
announcement.** Give it a **Title**, a **Message** and, if there's more to read, a
**"Read more" link**. **Show from** schedules it (empty = straight away) and **Hide after**
removes it at the end of that day (empty = until you delete it). **Pin to the top** puts it
before the others. Use it for notices, not events: events go in Events.

## 5. Adding a photo album

**Content → Gallery → New album.** One album per event (or per day of a multi-day event).

1. Choose the **Event** it belongs to (create the event first if it isn't there), and the
   **Series** if it's part of a week of events.
2. **Get consent first.** Only upload photos the people pictured agreed to share; the Media
   Committee confirms this. Then tick **The people pictured agreed to these photos being
   published**: the album can't be saved with photos until it's ticked.
3. Under **Photos**, choose the pictures (JPG, PNG or WebP; you can select several at once, up to
   40 per album). Pick the best ones, not the whole folder. They're resized for phones
   automatically.
4. **Describe each photo** for people who can't see it, e.g. "Students at the Day 3 medical
   outreach". Say what's happening, not "image of".
5. Optionally paste the **Full photo folder** (the Drive folder with every photo). Only admins
   see it.
6. Click **Publish album**.

For a large album (dozens of photos from a folder on a computer), the web lead can upload it in
one go with `npm run upload-album -w server` instead (instructions at the top of
`server/scripts/upload-album.ts`).

## 6. Clearing placeholders

When something isn't confirmed yet (a bio, a photo, a committee's write-up, an event's dates), the
site shows it as **"Coming soon"** or **"To be announced"** instead of guessing.

1. Open **Placeholders** in the menu. It lists everything still waiting, by page, with a note of
   what's missing.
2. Click an item: its form opens.
3. Fill in the confirmed details.
4. Untick **Still waiting for some details** if it's now complete. (If you still need something,
   leave it ticked and update **What's missing?**, which only admins see.)
5. Click **Save changes**. The page says whether it's now on the site as finished or still marked
   "Coming soon", and the item leaves the Placeholders list once it's unticked.

## 7. Feedback and alumni (admins only)

- **Feedback:** messages from the site's feedback form, newest first, anonymous unless the sender
  left an email. Filter them by **New**, **Read** or **Resolved**. The list is read-only: reply
  from the official PANS email, never a personal account. Messages are deleted automatically
  after 12 months.
- **Alumni:** sign-ups for the alumni network, read-only. This is personal information: don't
  copy or share it outside the executive team. If someone asks to be removed, tell the web lead.
- Accounts with the **editor** role can edit content but can't see Feedback or Alumni. Only the
  web lead's **developer** account sees **Accounts**.

## 8. Every new session (handover)

The Secretary General, with the web lead:

1. **Executive Council:** for each office, set the new **Session** (e.g. 2027/2028), **Name**,
   **Level**, a short **Bio** and **Photo** (with consent and a description). Use "To be
   announced" for anyone not yet confirmed.
2. **Senate** and each **Committee's** officers: update them the same way.
3. **Contact & footer:** check the office email, social links and the home-page banner.
4. Ask the web lead to remove the outgoing admins and create accounts for the new ones
   (section 9), then sign in to check yours works.

Monthly: delete expired announcements, check that opportunities are still open, add photos and
write-ups for past events, and go through the Placeholders list.

## 9. Jobs for the web lead

- **Creating and removing admins** (there is no sign-up page). Sign in with your **developer**
  account and open **Accounts**: **Add someone** (name, office email, Admin or Editor), **New
  password** for someone who's forgotten theirs, the **Role** list, or **Remove**. A new password
  is shown once on screen: give it to the person privately, not in a group chat, and ask them to
  keep it in a password manager. A new password or removal signs the person out at once. Keep at
  least two admins at all times.
- **Developer accounts** (yours, and a second for whoever takes over) can't be changed from the
  dashboard. Create, reset or remove them from the project folder, with the live database
  settings in `server/.env` (the same commands also work for admins and editors if the dashboard
  is down):

  ```powershell
  npm run create-admin -w server -- --email <email> --name "<full name>" --role developer
  npm run create-admin -w server -- --email <office email> --reset-password
  npm run create-admin -w server -- --email <office email> --remove
  ```

  (In PowerShell type the `--` as `'--'`.) The password is printed once. Resetting or removing
  signs the person out everywhere.
- **Backups and restores:** `docs/backup-restore.md`. **Deploying:** `docs/deployment.md`.
- **Something broken on the site?** Note the page address, what you did and what you saw (a
  screenshot helps), and send it to the web lead, who records it as an issue in the project's
  GitHub repository.
