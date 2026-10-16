import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fakeApi, sent, validation } from '../../../test/fakeAdminApi.ts'
import { renderRoute } from '../../../test/renderRoute.tsx'
import { lagosEnd, lagosStart, monthEnd, monthStart, slugify, splitLagos } from './lagos.ts'

const FRESHERS = {
  id: 'ev1',
  slug: 'freshers-week-2026',
  title: "Freshers' Week",
  series: '',
  datePrecision: 'day',
  startsAt: '2026-11-29T23:00:00.000Z',
  endsAt: '2026-12-04T22:59:59.000Z',
  venue: '',
  description: '',
  coverImage: '',
  coverImageAlt: '',
  registrationUrl: '',
  committee: '',
  isPlaceholder: true,
  placeholderNote: 'Venue to be confirmed',
  updatedAt: '2026-10-15T10:00:00.000Z',
}

afterEach(() => vi.unstubAllGlobals())

const main = () => document.getElementById('main')!

describe('Lagos dates in the dashboard', () => {
  it('converts the date and time boxes to and from Lagos time', () => {
    expect(lagosStart('2026-11-30', '09:30')).toBe('2026-11-30T09:30:00+01:00')
    expect(lagosStart('2026-11-30')).toBe('2026-11-30T00:00:00+01:00')
    expect(lagosEnd('2026-12-04')).toBe('2026-12-04T23:59:59+01:00')
    expect(monthStart('2027-04')).toBe('2027-04-01T00:00:00+01:00')
    expect(monthEnd('2027-02')).toBe('2027-02-28T23:59:59+01:00')
    expect(splitLagos('2026-11-30T08:30:00.000Z')).toEqual({ date: '2026-11-30', time: '09:30' })
    expect(slugify("  Freshers' Week 2026! ")).toBe('freshers-week-2026')
  })
})

describe('posting an event', () => {
  it('needs only a title and a date: the web address fills itself in', async () => {
    const user = userEvent.setup()
    const calls = fakeApi((c) =>
      c.method === 'POST' && c.path === '/api/admin/events'
        ? {
            status: 201,
            json: { ...FRESHERS, ...(c.body as object), id: 'ev9', isPlaceholder: false },
          }
        : c.path === '/api/admin/events/ev9'
          ? {
              json: {
                ...FRESHERS,
                id: 'ev9',
                slug: 'pharmacy-careers-fair',
                title: 'Pharmacy Careers Fair',
                isPlaceholder: false,
              },
            }
          : undefined,
    )
    const router = renderRoute('/admin/events/new')

    await user.type(await screen.findByLabelText('Title'), 'Pharmacy Careers Fair')
    expect(screen.getByLabelText('Web address')).toHaveProperty('value', 'pharmacy-careers-fair')
    await user.type(screen.getByLabelText('Starts on'), '2026-11-20')
    await user.type(screen.getByLabelText('Venue (optional)'), 'Faculty of Pharmacy, Idi-Araba')
    await user.click(screen.getByRole('button', { name: 'Publish event' }))

    expect(sent(calls, 'POST', '/api/admin/events')[0]!.body).toEqual({
      slug: 'pharmacy-careers-fair',
      title: 'Pharmacy Careers Fair',
      venue: 'Faculty of Pharmacy, Idi-Araba',
      registrationUrl: '',
      datePrecision: 'day',
      startsAt: '2026-11-20T00:00:00+01:00',
      endsAt: '2026-11-20T23:59:59+01:00',
      description: '',
      series: '',
      dayNumber: null,
      committee: '',
      coverImage: '',
      coverImageAlt: '',
    })
    expect(await within(main()).findByText(/It’s on the site now/)).toBeTruthy()
    expect(router.state.location.pathname).toBe('/admin/events/ev9')
    expect(
      within(main())
        .getByRole('link', { name: /View on the site/ })
        .getAttribute('href'),
    ).toBe('/events/pharmacy-careers-fair')
  })

  it('checks the form before sending, and lists the problems', async () => {
    const user = userEvent.setup()
    const calls = fakeApi(() => undefined)
    renderRoute('/admin/events/new')
    await user.click(await screen.findByRole('button', { name: 'Publish event' }))

    const summary = screen.getByRole('alert')
    expect(document.activeElement).toBe(summary)
    expect(
      within(summary)
        .getAllByRole('link')
        .map((a) => a.getAttribute('href')),
    ).toEqual(['#title', '#slug', '#startDate'])
    expect(screen.getByLabelText('Starts on').getAttribute('aria-invalid')).toBe('true')

    await user.click(screen.getByRole('radio', { name: /Months only/ }))
    await user.type(screen.getByLabelText('Title'), 'Pharmalympics 2027')
    await user.click(screen.getByRole('button', { name: 'Publish event' }))
    expect(
      within(screen.getByRole('alert')).getByText(/From month: Choose the month it starts/),
    ).toBeTruthy()
    expect(sent(calls, 'POST', '/api/admin')).toHaveLength(0)
  })

  it('shows the API’s messages on the right fields, including a taken web address', async () => {
    const user = userEvent.setup()
    let attempt = 0
    fakeApi((c) =>
      c.method === 'POST' && c.path === '/api/admin/events'
        ? ++attempt === 1
          ? validation([{ path: 'endsAt', message: 'endsAt must not be before startsAt' }])
          : {
              status: 409,
              json: {
                error: {
                  code: 'CONFLICT',
                  message: 'A record with that slug already exists',
                  details: { fields: ['slug'] },
                  requestId: 'r',
                },
              },
            }
        : undefined,
    )
    renderRoute('/admin/events/new')
    await user.type(await screen.findByLabelText('Title'), 'Freshers Week')
    await user.type(screen.getByLabelText('Starts on'), '2026-11-30')
    await user.click(screen.getByRole('button', { name: 'Publish event' }))
    expect(await screen.findByText('Ends on: EndsAt must not be before startsAt.')).toBeTruthy()
    expect(screen.getByLabelText('Ends on (optional)').getAttribute('aria-invalid')).toBe('true')

    await user.click(screen.getByRole('button', { name: 'Publish event' }))
    expect(
      await screen.findByText('Web address: Another item already uses this web address.'),
    ).toBeTruthy()
  })

  it('months-only dates become the first and last day of those months', async () => {
    const user = userEvent.setup()
    const calls = fakeApi((c) =>
      c.method === 'POST' ? { status: 201, json: { ...FRESHERS, id: 'ev2' } } : undefined,
    )
    renderRoute('/admin/events/new')
    await user.type(await screen.findByLabelText('Title'), 'Pharmalympics 2027')
    await user.click(screen.getByRole('radio', { name: /Months only/ }))
    await user.type(screen.getByLabelText('From month'), '2027-04')
    await user.type(screen.getByLabelText('To month (optional)'), '2027-05')
    await user.click(screen.getByRole('button', { name: 'Publish event' }))
    expect(sent(calls, 'POST', '/api/admin/events')[0]!.body).toMatchObject({
      datePrecision: 'month',
      startsAt: '2027-04-01T00:00:00+01:00',
      endsAt: '2027-05-31T23:59:59+01:00',
    })
  })
})

describe('editing an event', () => {
  it('opens with the saved values, saves changes and clears the placeholder flag', async () => {
    const user = userEvent.setup()
    const calls = fakeApi((c) =>
      c.path === '/api/admin/events/ev1'
        ? c.method === 'PATCH'
          ? { json: { ...FRESHERS, ...(c.body as object), isPlaceholder: false } }
          : { json: FRESHERS }
        : undefined,
    )
    renderRoute('/admin/events/ev1')
    expect(await screen.findByLabelText('Starts on')).toHaveProperty('value', '2026-11-30')
    // Stored as midnight to 23:59 Lagos: an all-day event, so the times stay empty.
    expect(screen.getByLabelText('Start time (optional)')).toHaveProperty('value', '')
    expect(screen.getByLabelText('Ends on (optional)')).toHaveProperty('value', '2026-12-04')
    expect(screen.getByRole('checkbox', { name: /Still waiting/ })).toHaveProperty('checked', true)
    expect(screen.getByLabelText('What’s missing?')).toHaveProperty(
      'value',
      'Venue to be confirmed',
    )

    await user.type(screen.getByLabelText('Venue (optional)'), 'Faculty of Pharmacy')
    await user.click(screen.getByRole('checkbox', { name: /Still waiting/ }))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    const body = sent(calls, 'PATCH', '/api/admin/events/ev1')[0]!.body as Record<string, unknown>
    expect(body).toMatchObject({
      venue: 'Faculty of Pharmacy',
      startsAt: '2026-11-30T00:00:00+01:00',
      endsAt: '2026-12-04T23:59:59+01:00',
    })
    expect(body).not.toHaveProperty('isPlaceholder')
    expect(await within(main()).findByText(/It’s on the site now/)).toBeTruthy()
  })

  it('uploads a cover photo with a signed request and requires alt text', async () => {
    const user = userEvent.setup()
    const calls = fakeApi((c) => {
      if (c.path === '/api/admin/events/ev1')
        return c.method === 'PATCH'
          ? { json: { ...FRESHERS, ...(c.body as object) } }
          : { json: FRESHERS }
      if (c.path === '/api/admin/media/signature')
        return {
          json: {
            uploadUrl: 'https://api.cloudinary.com/v1_1/demo/image/upload',
            cloudName: 'demo',
            apiKey: 'key123',
            params: {
              allowed_formats: 'jpg,jpeg,png,webp',
              folder: 'pans-unilag/events/freshers-week-2026',
              timestamp: 1,
            },
            signature: 'sig',
            expiresAt: '2026-10-16T10:00:00.000Z',
          },
        }
      if (c.path === '/v1_1/demo/image/upload')
        return { json: { public_id: 'pans-unilag/events/freshers-week-2026/abc' } }
      return undefined
    })
    renderRoute('/admin/events/ev1')
    const file = new File(['x'], 'cover.jpg', { type: 'image/jpeg' })
    await user.upload(await screen.findByLabelText('Cover photo (optional)'), file)

    expect(await screen.findByText('Photo uploaded. Describe it below, then save.')).toBeTruthy()
    expect(sent(calls, 'POST', '/api/admin/media/signature')[0]!.body).toEqual({
      folder: 'events/freshers-week-2026',
    })
    const upload = sent(calls, 'POST', '/v1_1/demo/image/upload')[0]!.body as Record<
      string,
      unknown
    >
    expect(upload).toMatchObject({
      api_key: 'key123',
      signature: 'sig',
      folder: 'pans-unilag/events/freshers-week-2026',
    })
    expect(upload.file).toBeInstanceOf(File)

    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(
      within(screen.getByRole('alert')).getByText(
        'Describe the photo: Describe the photo for people who can’t see it.',
      ),
    ).toBeTruthy()
    await user.type(screen.getByLabelText('Describe the photo'), 'New students at the welcome talk')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(sent(calls, 'PATCH', '/api/admin/events/ev1')[0]!.body).toMatchObject({
      coverImage: 'pans-unilag/events/freshers-week-2026/abc',
      coverImageAlt: 'New students at the welcome talk',
    })
  })

  it('explains when uploads aren’t set up on the server', async () => {
    const user = userEvent.setup()
    fakeApi((c) =>
      c.path === '/api/admin/events/ev1'
        ? { json: FRESHERS }
        : c.path === '/api/admin/media/signature'
          ? {
              status: 503,
              json: {
                error: {
                  code: 'SERVICE_UNAVAILABLE',
                  message: 'Image uploads are not set up',
                  requestId: 'r',
                },
              },
            }
          : undefined,
    )
    renderRoute('/admin/events/ev1')
    await user.upload(
      await screen.findByLabelText('Cover photo (optional)'),
      new File(['x'], 'cover.png', { type: 'image/png' }),
    )
    expect(await screen.findByText(/Photo uploads aren’t set up on the server yet/)).toBeTruthy()
  })

  it('deletes after a second, inline confirmation', async () => {
    const user = userEvent.setup()
    const calls = fakeApi((c) =>
      c.path === '/api/admin/events/ev1'
        ? c.method === 'DELETE'
          ? { status: 204 }
          : { json: FRESHERS }
        : c.path.startsWith('/api/admin/events?')
          ? { json: { items: [], total: 0, page: 1, pageSize: 25 } }
          : undefined,
    )
    const router = renderRoute('/admin/events/ev1')
    await user.click(await screen.findByRole('button', { name: 'Delete this event' }))
    expect(sent(calls, 'DELETE', '/api/admin')).toHaveLength(0)
    const yes = screen.getByRole('button', { name: 'Yes, delete it' })
    expect(document.activeElement).toBe(yes)
    await user.click(yes)

    expect(await screen.findByText(/Deleted “Freshers' Week”/)).toBeTruthy()
    expect(router.state.location.pathname).toBe('/admin/events')
    expect(sent(calls, 'DELETE', '/api/admin/events/ev1')).toHaveLength(1)
  })
})

describe('lists', () => {
  it('lists items with their dates and placeholder status, and links to New', async () => {
    fakeApi((c) =>
      c.path.startsWith('/api/admin/events?')
        ? { json: { items: [FRESHERS], total: 1, page: 1, pageSize: 25 } }
        : undefined,
    )
    renderRoute('/admin/events')
    await screen.findByRole('heading', { level: 1, name: 'Events' })
    const link = await within(main()).findByRole('link', { name: "Freshers' Week" })
    expect(link.getAttribute('href')).toBe('/admin/events/ev1')
    const row = link.closest('li')!
    expect(row.textContent).toContain('30 Nov – 4 Dec 2026')
    expect(within(row).getByText('Placeholder')).toBeTruthy()
    expect(within(main()).getByRole('link', { name: 'New event' }).getAttribute('href')).toBe(
      '/admin/events/new',
    )
    expect(
      within(screen.getByRole('navigation', { name: 'Admin' })).getByRole('link', {
        current: 'page',
      }).textContent,
    ).toBe('Content')
  })
})

describe('announcements and opportunities', () => {
  it('posts an announcement that hides itself at the end of a day', async () => {
    const user = userEvent.setup()
    const calls = fakeApi((c) =>
      c.method === 'POST' ? { status: 201, json: { id: 'an1', title: 'x' } } : undefined,
    )
    renderRoute('/admin/announcements/new')
    await user.type(await screen.findByLabelText('Title'), 'Freshers’ Week registration')
    await user.type(screen.getByLabelText(/^Message/), 'Register at the **PANS desk** by Friday.')
    await user.type(screen.getByLabelText('“Read more” link (optional)'), 'http://example.org')
    await user.type(screen.getByLabelText('Hide after (optional)'), '2026-11-27')
    await user.click(screen.getByRole('button', { name: 'Publish announcement' }))
    expect(
      within(screen.getByRole('alert')).getByText(
        '“Read more” link: The link must start with https://.',
      ),
    ).toBeTruthy()

    await user.clear(screen.getByLabelText('“Read more” link (optional)'))
    await user.click(screen.getByRole('button', { name: 'Publish announcement' }))
    expect(sent(calls, 'POST', '/api/admin/announcements')[0]!.body).toEqual({
      title: 'Freshers’ Week registration',
      body: 'Register at the **PANS desk** by Friday.',
      link: '',
      pinned: false,
      expiresAt: '2026-11-27T23:59:59+01:00',
    })
  })

  it('requires an apply link for a real opportunity, and a note to keep it as a placeholder', async () => {
    const user = userEvent.setup()
    const calls = fakeApi((c) =>
      c.method === 'POST' ? { status: 201, json: { id: 'op1', slug: 'x', title: 'x' } } : undefined,
    )
    renderRoute('/admin/opportunities/new')
    await user.type(await screen.findByLabelText('Title'), 'Emzor Industrial Internship')
    await user.selectOptions(screen.getByLabelText('Type'), 'internship')
    await user.type(screen.getByLabelText('Deadline (optional)'), '2026-11-15')
    await user.click(screen.getByRole('button', { name: 'Publish opportunity' }))
    expect(
      within(screen.getByRole('alert')).getByText(/Apply link: Add the apply link/),
    ).toBeTruthy()

    await user.click(screen.getByRole('checkbox', { name: /Still waiting/ }))
    await user.click(screen.getByRole('button', { name: 'Publish opportunity' }))
    expect(
      within(screen.getByRole('alert')).getByText(/What’s missing\?: Say what’s still missing/),
    ).toBeTruthy()

    await user.type(screen.getByLabelText('What’s missing?'), 'Apply link to come from CPD & CBC')
    await user.click(screen.getByRole('button', { name: 'Publish opportunity' }))
    expect(sent(calls, 'POST', '/api/admin/opportunities')[0]!.body).toMatchObject({
      slug: 'emzor-industrial-internship',
      type: 'internship',
      deadline: '2026-11-15T23:59:59+01:00',
      isPlaceholder: true,
      placeholderNote: 'Apply link to come from CPD & CBC',
    })
  })
})
