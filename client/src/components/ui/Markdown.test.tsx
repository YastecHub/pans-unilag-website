import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { Markdown } from './Markdown.tsx'

const show = (md: string) =>
  render(
    <MemoryRouter>
      <Markdown>{md}</Markdown>
    </MemoryRouter>,
  )

describe('Markdown', () => {
  it('opens outside links in a new tab and keeps site links in the app', async () => {
    show('[Constitution](/governance/constitution) and [IPSF](https://www.ipsf.org)')
    expect(
      (await screen.findByRole('link', { name: 'Constitution' })).getAttribute('target'),
    ).toBeNull()
    const outside = screen.getByRole('link', { name: /IPSF/ })
    expect(outside.getAttribute('target')).toBe('_blank')
    expect(outside.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('starts content headings at h3 and drops images and raw HTML', async () => {
    const { container } = show('# Big\n\n![x](https://x.org/a.png)\n\n<b onclick="x()">bold</b>')
    expect(await screen.findByRole('heading', { level: 3, name: 'Big' })).toBeTruthy()
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('[onclick]')).toBeNull()
  })

  it('never runs javascript: links', async () => {
    const { container } = show('[click](javascript:void(0)) and [ok](/about)')
    await screen.findByRole('link', { name: 'ok' })
    for (const a of container.querySelectorAll('a')) {
      expect(a.getAttribute('href') ?? '').not.toMatch(/javascript/i)
    }
  })
})
