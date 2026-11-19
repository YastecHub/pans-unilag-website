/**
 * Parts of the site switched off for now. The code and data stay; turning a feature back on is a
 * one-line change here.
 *
 * - academicResources: the Academics Committee's study resources (/academics/resources), its
 *   menu links, search results and dashboard editor. Off for launch (executive decision,
 *   30 Oct 2026) until the committee has vetted the first resources.
 * - comingSoon: the "Coming soon" / "To be announced" placeholders for details still being
 *   gathered (patron names, Senate officers, event dates, committee write-ups, albums without
 *   photos…). Off for launch: anything unconfirmed is left out of the public site instead, and
 *   appears by itself once it's filled in the dashboard. The dashboard's Placeholders list still
 *   shows everything that's missing.
 */
export const FEATURES = {
  academicResources: false,
  comingSoon: false,
} as const
