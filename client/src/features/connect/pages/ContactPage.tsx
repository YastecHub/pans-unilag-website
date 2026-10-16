import { Link } from 'react-router'
import { navSection } from '../../../app/siteMap.ts'
import { PlaceholderText } from '../../../components/ui/Placeholder.tsx'
import { ContentPage } from '../../pages/components/ContentPage.tsx'
import { useContactSettings } from '../api/settings.ts'

const mapsUrl = (place: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`

/**
 * /connect/contact: postal address and correspondence (pages.json "contact", Art. 2), then where
 * the Faculty is, the official email (once supplied) and social media. No personal emails or
 * phone numbers, ever (README → Security, privacy and data protection).
 */
export function ContactPage() {
  return (
    <ContentPage
      slug="contact"
      title="Contact"
      section={navSection('Connect')}
      after={<ContactDetails />}
    />
  )
}

function ContactDetails() {
  const settings = useContactSettings()
  return (
    <>
      <section aria-labelledby="location-title" className="flex flex-col gap-3">
        <h2 id="location-title" className="text-h3">
          Where to find us
        </h2>
        <p>{settings.location}</p>
        <p>
          <a href={mapsUrl(settings.location)} target="_blank" rel="noopener noreferrer">
            Get directions on Google Maps
          </a>{' '}
          <span className="text-small text-text-muted">(opens in a new tab)</span>
        </p>
      </section>

      <section aria-labelledby="online-title" className="flex flex-col gap-3">
        <h2 id="online-title" className="text-h3">
          Online
        </h2>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[max-content_1fr]">
          <dt className="font-heading font-medium text-text-muted">Email</dt>
          <dd>
            {settings.contactEmail ? (
              <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
            ) : (
              <PlaceholderText>Official email address coming soon</PlaceholderText>
            )}
          </dd>
          <dt className="font-heading font-medium text-text-muted">Messages</dt>
          <dd>
            Use the <Link to="/connect/feedback">feedback form</Link>. You can stay anonymous.
          </dd>
          <dt className="font-heading font-medium text-text-muted">Social media</dt>
          <dd>
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {settings.socialLinks.map((s) => (
                <li key={s.platform}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`PANS UNILAG on ${s.platform} (opens in a new tab)`}
                  >
                    {s.platform}
                  </a>
                </li>
              ))}
            </ul>
          </dd>
        </dl>
        <p className="text-small text-text-muted">
          We don’t list personal phone numbers or emails. Officers can be reached through the
          Secretary General, the feedback form or our social media.
        </p>
      </section>
    </>
  )
}
