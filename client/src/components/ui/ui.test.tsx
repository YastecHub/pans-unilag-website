import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../lib/http.ts'
import { Badge } from './Badge.tsx'
import { Button, ButtonLink } from './Button.tsx'
import { Img } from './Img.tsx'
import { Placeholder, PlaceholderImage, PlaceholderText } from './Placeholder.tsx'
import { EmptyState, ErrorState, LoadingState } from './States.tsx'

afterEach(() => vi.unstubAllEnvs())

describe('Placeholder', () => {
  it('shows "Coming soon" and what will appear there', () => {
    render(<Placeholder note="Recipharm 2026 edition coming soon" />)
    expect(screen.getByText('Coming soon')).toBeTruthy()
    expect(screen.getByText('Recipharm 2026 edition coming soon')).toBeTruthy()
  })

  it('announces image placeholders as "Photo coming soon"', () => {
    render(
      <>
        <PlaceholderImage kind="person" />
        <PlaceholderImage kind="badge" />
      </>,
    )
    expect(screen.getAllByRole('img', { name: 'Photo coming soon' })).toHaveLength(2)
  })

  it('looks the same everywhere: every variant uses the dashed muted border', () => {
    const { container } = render(
      <>
        <Placeholder />
        <PlaceholderImage kind="person" />
        <PlaceholderText>Name to be announced</PlaceholderText>
      </>,
    )
    const variants = Array.from(container.children)
    expect(variants).toHaveLength(3)
    for (const element of variants) {
      expect(element.className).toContain('border-dashed')
      expect(element.className).toContain('border-text-muted')
    }
  })
})

describe('states', () => {
  it('EmptyState is a plain panel, not a placeholder', () => {
    const { container } = render(<EmptyState title="No upcoming events yet. Check back soon." />)
    expect(screen.getByText('No upcoming events yet. Check back soon.')).toBeTruthy()
    expect((container.firstElementChild as HTMLElement).className).not.toContain('border-dashed')
  })

  it('LoadingState announces itself to screen readers', () => {
    render(<LoadingState label="Loading events" />)
    expect(screen.getByRole('status').textContent).toBe('Loading events…')
  })

  it('ErrorState shows the API message, a retry button and the reference to quote', async () => {
    const onRetry = vi.fn()
    render(
      <ErrorState
        error={
          new ApiError(500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.', {
            requestId: 'req-42',
          })
        }
        onRetry={onRetry}
      />,
    )
    expect(screen.getByRole('alert').textContent).toContain(
      'Something went wrong. Please try again.',
    )
    expect(screen.getByText('req-42')).toBeTruthy()

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('ErrorState falls back to a friendly message for unknown errors', () => {
    render(<ErrorState error={new Error('TypeError: x is undefined')} />)
    expect(screen.getByRole('alert').textContent).toContain('Check your connection and try again.')
    expect(screen.getByRole('alert').textContent).not.toContain('TypeError')
  })
})

describe('Button', () => {
  it('is type="button" by default so it never submits a form by accident', () => {
    render(<Button>Save</Button>)
    expect(screen.getByRole('button', { name: 'Save' }).getAttribute('type')).toBe('button')
  })

  it('is disabled and busy while loading', () => {
    render(<Button loading>Saving</Button>)
    const button = screen.getByRole('button', { name: 'Saving' }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    expect(button.getAttribute('aria-busy')).toBe('true')
  })

  it('ButtonLink is a real link', () => {
    render(
      <MemoryRouter>
        <ButtonLink to="/events/past">See past events</ButtonLink>
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'See past events' }).getAttribute('href')).toBe(
      '/events/past',
    )
  })
})

describe('Badge', () => {
  it('renders its label', () => {
    render(<Badge tone="accent">Pinned</Badge>)
    expect(screen.getByText('Pinned').className).toContain('bg-accent')
  })
})

describe('Img', () => {
  it('builds a cropped, auto-format, auto-quality Cloudinary URL with the alt text', async () => {
    vi.stubEnv('VITE_CLOUDINARY_CLOUD_NAME', 'pans-demo')
    render(
      <Img
        publicId="pans-unilag/brand/badge"
        alt="PANS UNILAG badge"
        width={640}
        height={400}
        lazy={false}
      />,
    )

    const img = screen.getByRole('img', { name: 'PANS UNILAG badge' }) as HTMLImageElement
    expect(img.src).toContain('https://res.cloudinary.com/pans-demo/image/upload/')
    expect(img.src).toContain('c_fill,h_400,w_640')
    expect(img.src).toContain('f_auto')
    expect(img.src).toContain('q_auto')
    expect(img.src).toContain('pans-unilag/brand/badge')
    expect(img.getAttribute('width')).toBe('640')
    expect(img.getAttribute('height')).toBe('400')
  })

  it('shows the photo placeholder when Cloudinary is not configured', () => {
    vi.stubEnv('VITE_CLOUDINARY_CLOUD_NAME', '')
    render(<Img publicId="x" alt="Something" width={300} height={200} />)
    expect(screen.getByRole('img', { name: 'Photo coming soon' })).toBeTruthy()
  })

  it('requires alt text (checked by TypeScript)', () => {
    // @ts-expect-error alt is required: every image must describe itself or pass "" if decorative.
    const element = <Img publicId="x" width={1} height={1} />
    expect(element).toBeTruthy()
  })
})
