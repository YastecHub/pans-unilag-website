import type { ReactNode } from 'react'
import { Container } from '../../components/layout/Container.tsx'
import { Badge } from '../../components/ui/Badge.tsx'
import { Button, ButtonLink } from '../../components/ui/Button.tsx'
import { Card } from '../../components/ui/Card.tsx'
import { Img } from '../../components/ui/Img.tsx'
import { Placeholder, PlaceholderImage, PlaceholderText } from '../../components/ui/Placeholder.tsx'
import { SkeletonCard } from '../../components/ui/Skeleton.tsx'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States.tsx'
import { ApiError } from '../../lib/http.ts'
import { usePageTitle } from '../../lib/usePageTitle.ts'

const sampleError = new ApiError(503, 'INTERNAL_ERROR', 'Something went wrong. Please try again.', {
  requestId: '2f1c6c1e-6a3b',
})

/** Development-only gallery of the UI kit at /_ui. Not part of the production site. */
export function UiKitPage() {
  usePageTitle('UI kit')
  return (
    <Container className="flex flex-col gap-12 py-12">
      <header className="flex flex-col gap-2">
        <h1>UI kit</h1>
        <p className="text-text-muted">
          Every shared component, in the current theme. Development only.
        </p>
      </header>

      <Section title="Buttons">
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Delete event</Button>
          <Button loading>Saving</Button>
          <Button size="sm">Small</Button>
          <ButtonLink to="/events" variant="outline">
            Link as a button
          </ButtonLink>
        </div>
        <div className="flex flex-wrap gap-3 rounded-xl bg-primary p-5">
          <Button variant="accent">Accent on green</Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge tone="accent">Pinned</Badge>
          <Badge>Health Week 2026</Badge>
          <Badge tone="neutral">Closed</Badge>
          <PlaceholderText>Date to be announced</PlaceholderText>
        </div>
      </Section>

      <Section title="Cards">
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4">
          <Card as="li">
            <Badge>Day 3</Badge>
            <h3 className="text-h3">Medical Outreach 2026</h3>
            <PlaceholderText>Date to be announced</PlaceholderText>
          </Card>
          <Card as="li" tone="filled">
            <h3 className="text-h3">CGPA calculator</h3>
            <p className="text-text-muted">
              Work out your GPA and CGPA. Nothing you enter is stored.
            </p>
          </Card>
        </ul>
      </Section>

      <Section title="Placeholders (content we are waiting for)">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4">
          <Placeholder note="Recipharm 2026 edition coming soon" />
          <PlaceholderImage kind="person" />
          <PlaceholderImage kind="badge" />
        </div>
      </Section>

      <Section title="Loading, empty and error">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] items-start gap-4">
          <LoadingState label="Loading events">
            <SkeletonCard />
          </LoadingState>
          <EmptyState
            title="No upcoming events yet. Check back soon."
            action={
              <ButtonLink to="/events/past" variant="outline" size="sm">
                See past events
              </ButtonLink>
            }
          />
          <ErrorState error={sampleError} title="We couldn’t load events." onRetry={() => {}} />
        </div>
      </Section>

      <Section title="Cloudinary image">
        <div className="max-w-sm">
          <Img
            publicId="samples/landscapes/nature-mountains"
            alt="Sample landscape"
            width={640}
            height={400}
          />
        </div>
        <p className="text-small text-text-muted">
          Shows the photo placeholder when VITE_CLOUDINARY_CLOUD_NAME is not set.
        </p>
      </Section>
    </Container>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h3">{title}</h2>
      {children}
    </section>
  )
}
