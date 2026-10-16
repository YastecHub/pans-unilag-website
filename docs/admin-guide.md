# PANS UNILAG Administrator & Executive Guide

Welcome to the **PANS UNILAG Website Administrator Guide**. This document is designed for the President, General Secretary, Committee Leads, and Media Officers to manage and keep the website updated without needing developer intervention.

---

## 1. Accessing the Admin Dashboard

- **URL:** Visit `/admin` (e.g. `https://pansunilag.com/admin` or `http://localhost:5173/admin`).
- **Credentials:** Sign in using your registered executive email address and password.
- **Session Security:**
  - Sessions remain active for **8 hours**.
  - Always click **Sign Out** in the dashboard header when using shared or faculty computers.
  - Rate limiting protects the sign-in form against brute-force attacks.

---

## 2. Navigating the Dashboard

The dashboard is structured into specific functional sections:

1. **Overview & Placeholders:** Lists missing content items (e.g. bio photos, pending descriptions) that need executive attention.
2. **Announcements:** Post urgent news, notices, and updates with start and expiration dates.
3. **Events:** Create and update Health Week, Pharmalympics, seminars, and student gatherings.
4. **Opportunities:** Publish internships, scholarships, external competitions, and fellowships.
5. **Leadership & Committees:** Update executive council rosters, senator listings, and committee heads.
6. **Academic Resources:** Manage course documents, links, and student guides.
7. **Submissions:** Review submitted contact feedback, alumni registrations, and student queries.

---

## 3. How to Post Content

### A. Announcements
1. Click **Announcements** → **New Announcement**.
2. Fill in:
   - **Title:** Clear, concise headline.
   - **Body:** Markdown supported (bold, links, lists).
   - **Priority:** Mark as `Urgent` if it needs a prominent banner.
   - **Publish Date / Expiration Date:** Announcements automatically unpublish after the expiration date.
3. Click **Save & Publish**.

### B. Events
1. Click **Events** → **New Event**.
2. Fill in:
   - **Title & Slug:** e.g., `Health Week 2026 - Day 1`.
   - **Date & Time:** Date precision can be exact day or month-level (`April 2027`).
   - **Venue:** Specific hall, faculty premises, or virtual link.
   - **Cover Photo:** Upload an event flyer or photo (Cloudinary integration handles optimization automatically).
   - **Alt Text:** Mandatory description of the image for accessibility (e.g., *"Flyer for PANS UNILAG Health Week opening ceremony"*).
   - **Registration URL:** Optional Google Form or ticket link.
3. Click **Save Event**. The event will automatically appear under **Upcoming Events** and transition to **Past Events** once concluded.

### C. Opportunities (Internships & Scholarships)
1. Click **Opportunities** → **New Opportunity**.
2. Specify:
   - **Title:** e.g., `Graduate Trainee Pharmacist 2026`.
   - **Organisation:** Company, hospital, or foundation offering the role.
   - **Type:** Internship, Scholarship, Competition, or Job.
   - **Deadline:** Choose a date or leave empty for rolling admissions.
   - **Application Link:** Direct link to application form.
3. Save the listing. Expired opportunities are automatically archived from the public page.

---

## 4. Media & Photo Uploads (Cloudinary)

- **Supported Formats:** JPG, PNG, WEBP.
- **Dimensions:** Keep cover images and flyers under **2500 px** on the long edge.
- **Alt Text Requirement:** Every uploaded image **must** include descriptive alt text to meet WCAG accessibility standards.
- **Albums & Gallery:** Photos for Pharmalympics and Health Week should be categorized into their respective album days.

---

## 5. Clearing Placeholders

When content is pending (for instance, a newly appointed committee head whose bio is not yet drafted), the website displays an elegant placeholder card:
1. Go to **Placeholders** in the Admin dashboard.
2. Click on the flagged item (e.g., *"Academic Committee description"*).
3. Fill in the missing information and uncheck **Is Placeholder**.
4. Click **Save**. The live site will immediately replace the placeholder with the real content.

---

## 6. Managing Submissions

- **Feedback & Queries:** Located under **Submissions → Feedback**. Read incoming feedback, update statuses (`New`, `Reviewed`, `Resolved`), and take necessary actions.
- **Alumni Directory:** Review alumni sign-ups under **Submissions → Alumni**. Data remains strictly private and protected under PANS data protection standards.

---

## 7. Need Help or Technical Support?

If you encounter technical issues, forget your login, or require new admin accounts:
- **Web Lead / Developer Team:** Contact the Technical Committee via the PANS portal developer channel.
- **President & General Secretary:** Authorized to approve new admin account creation.
- **Repository & Bugs:** Report any system bugs to [GitHub Issues](https://github.com/YastecHub/pans-unilag-website/issues).
