/**
 * Parts of the site switched off for now. The code and data stay; turning a feature back on is a
 * one-line change here.
 *
 * - academicResources: the Academics Committee's study resources (/academics/resources), its
 *   menu links, search results and dashboard editor. Off for launch (executive decision,
 *   30 Oct 2026) until the committee has vetted the first resources.
 */
export const FEATURES = {
  academicResources: false,
} as const
