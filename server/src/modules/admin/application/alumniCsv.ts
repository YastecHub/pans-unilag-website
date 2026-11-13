import type { AlumnusRecord, SubmissionAdminStore } from './submissionsAdmin.js'

const INTEREST_LABELS: Record<string, string> = {
  mentoring: 'Mentoring students',
  speaking: 'Speaking at events',
  'internships-and-jobs': 'Internships and jobs',
  events: 'Coming to events',
  'supporting-pans': 'Supporting PANS',
}

const HEADERS = [
  'Name',
  'Graduated',
  'Email',
  'Phone',
  'Interested in',
  'Consent given',
  'Signed up',
]

/**
 * One spreadsheet cell. Quoted when needed, and anything a spreadsheet would run as a formula
 * (starting with = + - @, a tab or a return) gets a leading apostrophe, so a visitor can't plant
 * a formula in the committee's copy of the list.
 */
export function csvCell(value: string | number): string {
  let text = String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const day = (iso: string) => iso.slice(0, 10)

/** The alumni list as CSV (Excel and Google Sheets open it), newest first. */
export function alumniCsv(alumni: AlumnusRecord[]): string {
  const rows = alumni.map((a) => [
    a.name,
    a.graduationYear,
    a.email,
    a.phone ?? '',
    a.interests.map((i) => INTEREST_LABELS[i] ?? i).join('; '),
    day(a.consentAt),
    day(a.createdAt),
  ])
  // The byte-order mark makes Excel read names with accents correctly.
  return `\uFEFF${[HEADERS, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`
}

/** Every alumni entry, a page at a time. */
export async function allAlumni(store: SubmissionAdminStore): Promise<AlumnusRecord[]> {
  const pageSize = 100
  const all: AlumnusRecord[] = []
  for (let page = 1; ; page++) {
    const { items, total } = await store.listAlumni({ page, pageSize })
    all.push(...items)
    if (items.length < pageSize || all.length >= total) return all
  }
}
