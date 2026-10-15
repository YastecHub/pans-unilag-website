/**
 * The site map from the README, in one place. The router, the desktop and mobile navigation
 * and the tests all read from here, so a page added here appears everywhere.
 */

export type NavLinkItem = {
  label: string
  to: string
  /** One line shown on section overview pages. */
  description: string
}

export type NavSection = {
  label: string
  to: string
  /** Sections with children open a dropdown; the others are plain links. */
  children?: NavLinkItem[]
}

/** The 8 main menu items, in order. "Home" is the logo. */
export const MAIN_NAV: NavSection[] = [
  {
    label: 'About',
    to: '/about',
    children: [
      { label: 'Who we are', to: '/about', description: 'Our name, motto and objectives' },
      {
        label: 'Membership & rights',
        to: '/about/membership',
        description: 'Who PANSites are and their rights',
      },
      {
        label: 'History & milestones',
        to: '/about/history',
        description: 'How PANS UNILAG got here',
      },
      { label: 'Impact', to: '/about/impact', description: 'What our work has achieved' },
    ],
  },
  {
    label: 'Leadership',
    to: '/leadership',
    children: [
      {
        label: 'Executive Council',
        to: '/leadership/executive-council',
        description: 'The 14 elected officers for 2026/27',
      },
      {
        label: 'Senate',
        to: '/leadership/senate',
        description: 'The principal officers of the Senate',
      },
      {
        label: 'Committees',
        to: '/leadership/committees',
        description: 'The 11 committees for 2026/27',
      },
      { label: 'Patrons', to: '/leadership/patrons', description: 'The Dean and four patrons' },
    ],
  },
  {
    label: 'Governance',
    to: '/governance',
    children: [
      {
        label: 'How PANS is governed',
        to: '/governance',
        description: 'Congress, Executive Council and Senate',
      },
      {
        label: 'Elections',
        to: '/governance/elections',
        description: 'Eligibility, voting and the Electoral Committee',
      },
      {
        label: 'Finance & accountability',
        to: '/governance/finance',
        description: 'Budgets, audits and reports',
      },
      {
        label: 'Meetings & procedures',
        to: '/governance/meetings',
        description: 'Sittings, quorum and standing orders',
      },
      {
        label: 'Constitution',
        to: '/governance/constitution',
        description: 'The 2026 constitution in full',
      },
    ],
  },
  {
    label: 'Events',
    to: '/events',
    children: [
      { label: 'Upcoming events', to: '/events', description: 'What is coming up this session' },
      {
        label: 'Past events',
        to: '/events/past',
        description: 'Health Week, Pharmalympics and more',
      },
      { label: 'Gallery', to: '/gallery', description: 'Photos from our events' },
    ],
  },
  { label: 'Opportunities', to: '/opportunities' },
  { label: 'Publications', to: '/publications' },
  {
    label: 'Academics',
    to: '/academics',
    children: [
      {
        label: 'CGPA calculator',
        to: '/academics/cgpa-calculator',
        description: 'Work out your GPA and CGPA',
      },
      {
        label: 'Resources',
        to: '/academics/resources',
        description: 'Vetted study resources by level',
      },
      {
        label: 'Student support',
        to: '/academics/student-support',
        description: 'Welfare and academic support',
      },
    ],
  },
  {
    label: 'Connect',
    to: '/connect',
    children: [
      {
        label: 'Feedback & suggestions',
        to: '/connect/feedback',
        description: 'Write to the Secretary General',
      },
      {
        label: 'Alumni network',
        to: '/connect/alumni',
        description: 'Stay in touch after graduation',
      },
      { label: 'Contact', to: '/connect/contact', description: 'Address and social media' },
      {
        label: 'Privacy notice',
        to: '/connect/privacy',
        description: 'How we handle your information',
      },
    ],
  },
]

export type StubPage = {
  path: string
  title: string
  /** The issue that builds the real page. */
  issue: number
}

/** Every page that is still a stub, with the issue that replaces it. */
export const STUB_PAGES: StubPage[] = [
  { path: '/leadership/executive-council', title: 'Executive Council 2026/27', issue: 27 },
  { path: '/leadership/senate', title: 'Senate 2026/27', issue: 27 },
  { path: '/leadership/committees', title: 'Committees', issue: 27 },
  { path: '/leadership/committees/:slug', title: 'Committee', issue: 27 },
  { path: '/leadership/patrons', title: 'Patrons', issue: 27 },
  { path: '/governance', title: 'How PANS is governed', issue: 28 },
  { path: '/governance/elections', title: 'Elections', issue: 28 },
  { path: '/governance/finance', title: 'Finance & accountability', issue: 28 },
  { path: '/governance/meetings', title: 'Meetings & procedures', issue: 28 },
  { path: '/governance/constitution', title: 'Constitution', issue: 28 },
  { path: '/events', title: 'Upcoming events', issue: 29 },
  { path: '/events/past', title: 'Past events', issue: 29 },
  { path: '/events/:slug', title: 'Event', issue: 29 },
  { path: '/gallery', title: 'Gallery', issue: 30 },
  { path: '/gallery/:slug', title: 'Album', issue: 30 },
  { path: '/opportunities', title: 'Opportunities', issue: 31 },
  { path: '/opportunities/:slug', title: 'Opportunity', issue: 31 },
  { path: '/publications', title: 'Publications', issue: 32 },
  { path: '/academics/cgpa-calculator', title: 'CGPA calculator', issue: 33 },
  { path: '/academics/resources', title: 'Academic resources', issue: 34 },
  { path: '/academics/student-support', title: 'Student support', issue: 34 },
  { path: '/connect/feedback', title: 'Feedback & suggestions', issue: 35 },
  { path: '/connect/alumni', title: 'Alumni network', issue: 35 },
  { path: '/connect/contact', title: 'Contact', issue: 35 },
  { path: '/connect/privacy', title: 'Privacy notice', issue: 35 },
  { path: '/search', title: 'Search', issue: 36 },
]

/** The menu section with this label (the About pages show its links beside them). */
export function navSection(label: string): NavSection {
  const section = MAIN_NAV.find((s) => s.label === label)
  if (!section) throw new Error(`No menu section called ${label}`)
  return section
}

/** Sections whose own URL is an overview of their pages (the others use their first page). */
export const OVERVIEW_SECTIONS = MAIN_NAV.filter(
  (section) => section.children && !section.children.some((child) => child.to === section.to),
)

/** True when the current path belongs to this section (for highlighting the menu). */
export function isInSection(section: NavSection, pathname: string): boolean {
  const paths = [section.to, ...(section.children?.map((child) => child.to) ?? [])]
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}
