import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { type Call, fakeApi, sent } from '../../../test/fakeAdminApi.ts'
import { renderRoute } from '../../../test/renderRoute.tsx'
import { EDITORS } from './editors.ts'
import { currentSession, linesToList } from './types.ts'

afterEach(() => vi.unstubAllGlobals())

const main = () => document.getElementById('main')!
const one = (calls: Call[], method: string, path: string) => {
  const found = sent(calls, method, path)
  expect(found, `${method} ${path}`).toHaveLength(1)
  return found[0]!.body as Record<string, unknown>
}
/** Answers GET and PATCH for one record; PATCH echoes the body as saved real content. */
const record = (path: string, data: Record<string, unknown>) => (c: Call) =>
  c.path === path
    ? c.method === 'PATCH'
      ? { json: { ...data, ...(c.body as object), isPlaceholder: false } }
      : { json: data }
    : undefined
const conflict = (fields: string[]) => ({
  status: 409,
  json: {
    error: { code: 'CONFLICT', message: 'exists', details: { fields }, requestId: 'r' },
  },
})
const save = (user: ReturnType<typeof userEvent.setup>, name = 'Save changes') =>
  user.click(screen.getByRole('button', { name }))
const summary = () => within(screen.getByRole('alert'))

const PRESIDENT = {
  id: 'x1',
  session: '2026/2027',
  office: 'President',
  order: 1,
  name: 'Abigail Moejoh',
  level: '',
  bio: '',
  photo: '',
  roleEmail: '',
  isPlaceholder: true,
  placeholderNote: 'Bio and photo to come',
}

describe('every placeholder can be filled from the dashboard', () => {
  it('links each placeholder to its editor', async () => {
    const collections = [
      'pages',
      'executives',
      'senators',
      'committees',
      'patrons',
      'events',
      'albums',
      'announcements',
      'opportunities',
      'publications',
      'documents',
      'resources',
      'gradingscales',
      'settings',
    ]
    // Every collection on the API's placeholder list has an editor.
    expect(EDITORS.map((e) => e.name).sort()).toEqual([...collections].sort())
    fakeApi((c) =>
      c.path === '/api/admin/placeholders'
        ? {
            json: {
              total: collections.length,
              groups: collections.map((collection, i) => ({
                collection,
                page: `Page ${i}`,
                path: '/',
                items: [{ id: `id${i}`, label: `Item ${i}`, note: 'Missing', updatedAt: null }],
              })),
            },
          }
        : undefined,
    )
    renderRoute('/admin/placeholders')
    await screen.findByRole('heading', { level: 1, name: 'Placeholders' })
    const links = await within(main()).findAllByRole('link', { name: /^Fill in/ })
    expect(links.map((a) => a.getAttribute('href'))).toEqual(
      collections.map((c, i) => `/admin/${c}/id${i}`),
    )
    expect(links[1]!.textContent).toBe('Fill in: Item 1')
  })

  it('lists every kind of content on the Content page, by section', async () => {
    fakeApi(() => undefined)
    renderRoute('/admin/content')
    expect(await screen.findByRole('heading', { level: 1, name: 'Content' })).toBeTruthy()
    const people = within(screen.getByRole('region', { name: 'People' }))
    expect(people.getAllByRole('link').map((a) => a.textContent)).toEqual([
      'Executive Council',
      'Senate',
      'Committees',
      'Patrons',
    ])
    expect(within(main()).getAllByRole('link')).toHaveLength(EDITORS.length)
    expect(
      within(screen.getByRole('navigation', { name: 'Admin' })).getByRole('link', {
        current: 'page',
      }).textContent,
    ).toBe('Content')
  })
})

describe('Executive Council', () => {
  it('fills in a placeholder officer with a bio and photo, clearing the placeholder', async () => {
    const user = userEvent.setup()
    const calls = fakeApi((c) => {
      if (c.path === '/api/admin/media/signature')
        return {
          json: {
            uploadUrl: 'https://api.cloudinary.com/v1_1/demo/image/upload',
            apiKey: 'k',
            params: { folder: 'pans-unilag/executives/2026-2027', timestamp: 1 },
            signature: 's',
          },
        }
      if (c.path === '/v1_1/demo/image/upload')
        return { json: { public_id: 'pans-unilag/executives/2026-2027/abc' } }
      return record('/api/admin/executives/x1', PRESIDENT)(c)
    })
    renderRoute('/admin/executives/x1')
    expect(await screen.findByLabelText('Office')).toHaveProperty('value', 'President')

    await user.type(screen.getByLabelText(/^Bio/), Array(201).fill('word').join(' '))
    await save(user)
    expect(summary().getByText(/Keep the bio to 200 words or fewer \(it’s 201\)/)).toBeTruthy()

    await user.clear(screen.getByLabelText(/^Bio/))
    await user.type(screen.getByLabelText(/^Bio/), 'A 400L student and former Welfare Secretary.')
    await user.upload(
      screen.getByLabelText('Photo (optional)'),
      new File(['x'], 'p.jpg', { type: 'image/jpeg' }),
    )
    expect(await screen.findByText('Photo uploaded. Save to put it on the site.')).toBeTruthy()
    // The site describes officer photos by name and office, so there's no alt box to fill.
    expect(screen.queryByLabelText('Describe the photo')).toBeNull()
    expect(one(calls, 'POST', '/api/admin/media/signature')).toEqual({
      folder: 'executives/2026-2027',
    })

    await user.click(screen.getByRole('checkbox', { name: /Still waiting/ }))
    await save(user)
    const body = one(calls, 'PATCH', '/api/admin/executives/x1')
    expect(body).toMatchObject({
      session: '2026/2027',
      office: 'President',
      name: 'Abigail Moejoh',
      bio: 'A 400L student and former Welfare Secretary.',
      photo: 'pans-unilag/executives/2026-2027/abc',
    })
    expect(body).not.toHaveProperty('isPlaceholder')
    expect(await within(main()).findByText(/It’s on the site now/)).toBeTruthy()
  })

  it('explains when the office is already filled for that session', async () => {
    const user = userEvent.setup()
    fakeApi((c) =>
      c.method === 'POST' && c.path === '/api/admin/executives'
        ? conflict(['session', 'office'])
        : undefined,
    )
    renderRoute('/admin/executives/new')
    expect(await screen.findByLabelText('Session')).toHaveProperty('value', currentSession())
    await user.selectOptions(screen.getByLabelText('Office'), 'Treasurer')
    await user.type(screen.getByLabelText('Name'), 'Chidera Obi')
    await save(user, 'Publish executive')
    expect(
      await screen.findByText(
        'Office: Someone already holds this for that session. Edit their entry instead.',
      ),
    ).toBeTruthy()
  })
})

describe('Committees', () => {
  const ADMAP = {
    id: 'c1',
    slug: 'admap',
    name: 'Anti-Drug Misuse and Abuse Program (ADMAP)',
    shortName: 'ADMAP',
    session: '2026/2027',
    order: 1,
    description: 'Advocating against drug misuse.',
    activities: ['Campus walk'],
    achievements: [],
    plans: [],
    motto: '',
    officers: [
      { title: 'Lead', name: 'Dada Aishat', level: '500L' },
      { title: 'Assistant', name: 'Akintomide Maizah', level: '300L' },
    ],
    coverImage: '',
    isPlaceholder: false,
    placeholderNote: '',
  }

  it('adds, reorders and removes officers, and saves lists one per line', async () => {
    const user = userEvent.setup()
    const calls = fakeApi(record('/api/admin/committees/c1', ADMAP))
    renderRoute('/admin/committees/c1')
    const officers = await screen.findByRole('group', { name: 'Officers' })
    expect(
      within(officers)
        .getAllByRole('group')
        .map((g) => g.getAttribute('id')),
    ).toEqual(['officers-row-0', 'officers-row-1'])

    await user.click(within(officers).getByRole('button', { name: 'Add officer' }))
    expect(document.activeElement?.id).toBe('officers-2-title')
    expect(within(officers).getByRole('status').textContent).toBe('Officer 3 added.')
    await user.type(document.activeElement as HTMLElement, 'Secretary')
    await save(user)
    expect(summary().getByText('Officers: Officer 3 needs a title and a name.')).toBeTruthy()

    await user.type(screen.getByLabelText('Name', { selector: '#officers-2-name' }), 'Bisi Ade')
    await user.click(within(officers).getByRole('button', { name: 'Move up: Officer 3' }))
    expect(within(officers).getByRole('status').textContent).toBe('Officer 3 moved to position 2.')
    await user.click(within(officers).getByRole('button', { name: 'Remove: Officer 1' }))

    await user.clear(screen.getByLabelText(/^Activities/))
    await user.type(
      screen.getByLabelText(/^Activities/),
      '- Campus walk{Enter}School outreach{Enter}',
    )
    await save(user)
    expect(one(calls, 'PATCH', '/api/admin/committees/c1')).toMatchObject({
      officers: [
        { title: 'Secretary', name: 'Bisi Ade', level: '' },
        { title: 'Assistant', name: 'Akintomide Maizah', level: '300L' },
      ],
      activities: ['Campus walk', 'School outreach'],
      order: 1,
    })
  })

  it('turns one-per-line text into a list', () => {
    expect(linesToList('- One\n\n* Two\n• Three  \n')).toEqual(['One', 'Two', 'Three'])
  })
})

describe('Pages', () => {
  it('edits sections but can’t create or delete pages, and checks article references', async () => {
    const user = userEvent.setup()
    const calls = fakeApi((c) =>
      c.path.startsWith('/api/admin/pages?')
        ? {
            json: {
              items: [{ id: 'p1', slug: 'who-we-are', title: 'Who we are', sections: [{}] }],
              total: 1,
              page: 1,
              pageSize: 25,
            },
          }
        : record('/api/admin/pages/p1', {
            id: 'p1',
            slug: 'who-we-are',
            title: 'Who we are',
            sections: [
              { heading: 'Our name', bodyMarkdown: 'PANS UNILAG.', articleRefs: ['Art. 1'] },
            ],
          })(c),
    )
    const router = renderRoute('/admin/pages')
    await screen.findByRole('heading', { level: 1, name: 'Pages' })
    const row = await within(main()).findByRole('link', { name: 'Who we are' })
    expect(row.closest('li')!.textContent).toContain('/about · 1 sections')
    expect(within(main()).queryByRole('link', { name: /New page/ })).toBeNull()

    await user.click(row)
    const refs = await screen.findByLabelText('Constitution articles (optional)')
    expect(refs).toHaveProperty('value', 'Art. 1')
    expect(screen.queryByRole('button', { name: /Delete/ })).toBeNull()
    await user.clear(refs)
    await user.type(refs, 'Art. 1, Article 2')
    await save(user)
    expect(summary().getByText(/“Article 2” isn’t an article reference/)).toBeTruthy()

    await user.clear(refs)
    await user.type(refs, 'Art. 1, Art. 4 S.B')
    await save(user)
    expect(one(calls, 'PATCH', '/api/admin/pages/p1')).toEqual({
      title: 'Who we are',
      sections: [
        {
          heading: 'Our name',
          bodyMarkdown: 'PANS UNILAG.',
          articleRefs: ['Art. 1', 'Art. 4 S.B'],
        },
      ],
    })
    expect(
      within(main())
        .getByRole('link', { name: /View on the site/ })
        .getAttribute('href'),
    ).toBe('/about')

    router.navigate('/admin/pages/new')
    expect(await within(main()).findByRole('heading', { level: 1, name: 'Pages' })).toBeTruthy()
  })
})

describe('Contact & footer settings', () => {
  const SITE = {
    id: 's1',
    key: 'site',
    postalAddress: 'Faculty of Pharmacy, Idi-Araba',
    location: '',
    contactEmail: '',
    socialLinks: [{ platform: 'Instagram', url: 'https://www.instagram.com/pans_unilag/' }],
    quickLinks: [],
    homeBanner: { text: '', url: '' },
    isPlaceholder: true,
    placeholderNote: 'Official email needed',
  }

  it('opens the one settings record straight away and saves links and the banner', async () => {
    const user = userEvent.setup()
    const calls = fakeApi((c) =>
      c.path.startsWith('/api/admin/settings?')
        ? { json: { items: [SITE], total: 1, page: 1, pageSize: 25 } }
        : record('/api/admin/settings/s1', SITE)(c),
    )
    const router = renderRoute('/admin/settings')
    expect(await screen.findByLabelText('Postal address')).toHaveProperty(
      'value',
      'Faculty of Pharmacy, Idi-Araba',
    )
    expect(router.state.location.pathname).toBe('/admin/settings/s1')
    expect(screen.queryByRole('button', { name: /Delete/ })).toBeNull()

    await user.type(screen.getByLabelText('Official email (optional)'), 'pans@unilag.edu.ng')
    await user.click(screen.getByRole('button', { name: 'Add a social media link' }))
    await user.selectOptions(
      screen.getByLabelText('Platform', { selector: '#socialLinks-1-platform' }),
      'X',
    )
    await user.type(
      screen.getByLabelText('Address', { selector: '#socialLinks-1-url' }),
      'http://x.com/pans',
    )
    await user.type(
      screen.getByLabelText('Banner text (optional)'),
      'Freshers’ Week starts 30 November',
    )
    await user.type(screen.getByLabelText('Banner link (optional)'), '/events/freshers-week-2026')
    await user.click(screen.getByRole('checkbox', { name: /Still waiting/ }))
    await save(user)
    expect(
      summary().getByText('Social media: Link 2: the address must start with https://.'),
    ).toBeTruthy()

    const url = screen.getByLabelText('Address', { selector: '#socialLinks-1-url' })
    await user.clear(url)
    await user.type(url, 'https://x.com/PANS_Unilag')
    await save(user)
    expect(one(calls, 'PATCH', '/api/admin/settings/s1')).toEqual({
      postalAddress: 'Faculty of Pharmacy, Idi-Araba',
      location: '',
      contactEmail: 'pans@unilag.edu.ng',
      socialLinks: [
        { platform: 'Instagram', url: 'https://www.instagram.com/pans_unilag/' },
        { platform: 'X', url: 'https://x.com/PANS_Unilag' },
      ],
      quickLinks: [],
      homeBanner: { text: 'Freshers’ Week starts 30 November', url: '/events/freshers-week-2026' },
    })
  })
})

describe('Gallery', () => {
  const ALBUM = {
    id: 'al1',
    slug: 'health-week-2026-day-1',
    title: 'Trade Fair & Cooking Competition',
    event: 'health-week-2026-day-1',
    series: 'PANS Health Week 2026',
    photos: [],
    cover: '',
    sourceFolderUrl: '',
    consentConfirmed: false,
    isPlaceholder: true,
    placeholderNote: 'Photos to be curated',
  }

  it('uploads several photos, needs alt text and consent, and uses the first as the cover', async () => {
    const user = userEvent.setup()
    let n = 0
    const calls = fakeApi((c) => {
      if (c.path === '/api/events?page=1&pageSize=100')
        return {
          json: {
            events: [{ slug: 'health-week-2026-day-1', title: 'Health Week Day 1' }],
            totalPages: 1,
          },
        }
      if (c.path === '/api/admin/media/signature')
        return {
          json: {
            uploadUrl: 'https://api.cloudinary.com/up',
            apiKey: 'k',
            params: {},
            signature: 's',
          },
        }
      if (c.path === '/up') return { json: { public_id: `pans-unilag/events/hw/p${++n}` } }
      return record('/api/admin/albums/al1', ALBUM)(c)
    })
    renderRoute('/admin/albums/al1')
    await user.upload(await screen.findByLabelText('Add photos'), [
      new File(['a'], 'a.jpg', { type: 'image/jpeg' }),
      new File(['b'], 'b.webp', { type: 'image/webp' }),
    ])
    expect(
      await screen.findByText('2 photos uploaded. Describe each one below, then save.'),
    ).toBeTruthy()
    expect(document.activeElement?.id).toBe('photos-0-alt')
    expect(sent(calls, 'POST', '/api/admin/media/signature')).toHaveLength(2)
    expect(sent(calls, 'POST', '/api/admin/media/signature')[0]!.body).toEqual({
      folder: 'events/health-week-2026-day-1',
    })
    expect(screen.getByRole('radio', { name: 'Album cover: photo 1' })).toHaveProperty(
      'checked',
      true,
    )

    await user.click(screen.getByRole('checkbox', { name: /Still waiting/ }))
    await user.type(screen.getByLabelText('Describe photo 1'), 'Students at the trade fair stands')
    await save(user)
    expect(summary().getByText(/Photos: Describe photo 2/)).toBeTruthy()
    expect(summary().getByText(/Consent: Confirm the people pictured agreed/)).toBeTruthy()
    expect(screen.getByLabelText('Describe photo 2').getAttribute('aria-invalid')).toBe('true')

    await user.type(screen.getByLabelText('Describe photo 2'), 'The cooking competition judges')
    await user.click(screen.getByRole('radio', { name: 'Album cover: photo 2' }))
    await user.click(screen.getByRole('checkbox', { name: /people pictured agreed/ }))
    await save(user)
    expect(one(calls, 'PATCH', '/api/admin/albums/al1')).toMatchObject({
      photos: [
        {
          publicId: 'pans-unilag/events/hw/p1',
          alt: 'Students at the trade fair stands',
          caption: '',
        },
        {
          publicId: 'pans-unilag/events/hw/p2',
          alt: 'The cooking competition judges',
          caption: '',
        },
      ],
      cover: 'pans-unilag/events/hw/p2',
      consentConfirmed: true,
    })
  })
})

describe('Academics', () => {
  it('refuses a link to a piracy site and saves the course code in capitals', async () => {
    const user = userEvent.setup()
    const calls = fakeApi((c) =>
      c.method === 'POST' ? { status: 201, json: { id: 'r1', title: 'x' } } : undefined,
    )
    renderRoute('/admin/resources/new')
    await user.type(await screen.findByLabelText('Title'), 'Organic chemistry notes')
    await user.selectOptions(screen.getByLabelText('Level'), '200L')
    await user.selectOptions(screen.getByLabelText('Semester'), 'first')
    await user.type(screen.getByLabelText('Course code (optional)'), 'pch201')
    await user.type(screen.getByLabelText('Link'), 'https://libgen.is/book/1')
    await save(user, 'Publish resource')
    expect(summary().getByText(/Link: This site is known for pirated books/)).toBeTruthy()

    await user.clear(screen.getByLabelText('Link'))
    await user.type(screen.getByLabelText('Link'), 'https://ocw.mit.edu/courses/5-12')
    await save(user, 'Publish resource')
    expect(one(calls, 'POST', '/api/admin/resources')).toMatchObject({
      course: 'PCH201',
      url: 'https://ocw.mit.edu/courses/5-12',
      verifiedBy: 'Academics Committee',
    })
  })

  it('checks the grade table covers 0–100, and explains when another scale is in use', async () => {
    const user = userEvent.setup()
    const SCALE = {
      id: 'g1',
      slug: 'faculty-of-pharmacy-5-point',
      active: false,
      source: 'Handbook §3.5',
      grades: [
        { letter: 'A', min: 70, max: 100, point: 5 },
        { letter: 'F', min: 0, max: 69, point: 0 },
      ],
      bands: [
        { name: 'Pass', min: 2.4, max: 5 },
        { name: 'Fail', min: 0, max: 2.39 },
      ],
      passMark: 2.4,
      units: { min: 1, max: 3 },
    }
    fakeApi((c) =>
      c.method === 'PATCH' ? conflict(['active']) : record('/api/admin/gradingscales/g1', SCALE)(c),
    )
    renderRoute('/admin/gradingscales/g1')
    const fMax = await screen.findByLabelText('Highest score', { selector: '#grades-1-max' })
    expect(fMax).toHaveProperty('value', '69')
    await user.clear(fMax)
    await user.type(fMax, '60')
    await save(user)
    expect(summary().getByText(/The grades must cover every score from 0 to 100/)).toBeTruthy()

    await user.clear(fMax)
    await user.type(fMax, '69')
    await user.click(screen.getByRole('checkbox', { name: 'Use this scale on the calculator' }))
    await save(user)
    expect(await screen.findByText(/Use this scale: Another scale is already in use/)).toBeTruthy()
  })
})

describe('Documents, publications and patrons', () => {
  it('saves the constitution’s PDF with its size in bytes', async () => {
    const user = userEvent.setup()
    const calls = fakeApi(
      record('/api/admin/documents/d1', {
        id: 'd1',
        slug: 'constitution',
        title: 'Constitution of PANS UNILAG',
        version: '2026',
        approvedOn: '2026-07-08T23:00:00.000Z',
        pageCount: 55,
        fileUrl: '',
        isPlaceholder: true,
        placeholderNote: 'PDF to be uploaded',
      }),
    )
    renderRoute('/admin/documents/d1')
    expect(await screen.findByLabelText('Approved on')).toHaveProperty('value', '2026-07-09')
    await user.click(screen.getByRole('checkbox', { name: /Still waiting/ }))
    await save(user)
    expect(summary().getByText(/PDF link: Add the PDF link/)).toBeTruthy()

    await user.type(screen.getByLabelText('PDF link'), 'https://example.org/constitution.pdf')
    await user.type(screen.getByLabelText('File size in MB (optional)'), '7.1')
    await save(user)
    expect(one(calls, 'PATCH', '/api/admin/documents/d1')).toMatchObject({
      approvedOn: '2026-07-09T00:00:00+01:00',
      fileUrl: 'https://example.org/constitution.pdf',
      fileSizeBytes: 7444890,
      pageCount: 55,
    })
    expect(
      within(main())
        .getByRole('link', { name: /View on the site/ })
        .getAttribute('href'),
    ).toBe('/governance/constitution')
  })

  it('needs a PDF or page link for a real publication', async () => {
    const user = userEvent.setup()
    const calls = fakeApi((c) =>
      c.method === 'POST' ? { status: 201, json: { id: 'pb1', title: 'x' } } : undefined,
    )
    renderRoute('/admin/publications/new')
    await user.type(await screen.findByLabelText('Title'), 'Recipharm 2026')
    expect(screen.getByLabelText('Web address')).toHaveProperty('value', 'recipharm-2026')
    await user.selectOptions(screen.getByLabelText('Series'), 'recipharm')
    await save(user, 'Publish publication')
    expect(summary().getByText(/PDF link: Add the PDF link or the page link/)).toBeTruthy()
    await user.type(screen.getByLabelText('PDF link (optional)'), 'https://example.org/r.pdf')
    await save(user, 'Publish publication')
    expect(one(calls, 'POST', '/api/admin/publications')).toMatchObject({
      slug: 'recipharm-2026',
      series: 'recipharm',
      fileUrl: 'https://example.org/r.pdf',
    })
  })

  it('names the Dean as a patron', async () => {
    const user = userEvent.setup()
    const calls = fakeApi(
      record('/api/admin/patrons/pt1', {
        id: 'pt1',
        order: 1,
        title: 'Dean, Faculty of Pharmacy',
        isDean: true,
        name: 'Name to be announced',
        isPlaceholder: true,
        placeholderNote: 'Name needed',
      }),
    )
    renderRoute('/admin/patrons/pt1')
    const name = await screen.findByLabelText('Name')
    await user.clear(name)
    await user.type(name, 'Prof. A. B. Example')
    await user.clear(screen.getByLabelText('Position in the list'))
    await save(user)
    expect(summary().getByText('Position in the list: A whole number from 1 to 20.')).toBeTruthy()
    await user.type(screen.getByLabelText('Position in the list'), '1')
    await user.click(screen.getByRole('checkbox', { name: /Still waiting/ }))
    await save(user)
    expect(one(calls, 'PATCH', '/api/admin/patrons/pt1')).toEqual({
      name: 'Prof. A. B. Example',
      title: 'Dean, Faculty of Pharmacy',
      order: 1,
      isDean: true,
    })
  })
})
