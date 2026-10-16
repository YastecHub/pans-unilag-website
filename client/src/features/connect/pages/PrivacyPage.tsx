import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { navSection } from '../../../app/siteMap.ts'
import { InnerPageLayout } from '../../pages/components/InnerPageLayout.tsx'

/**
 * /connect/privacy: what the two forms collect, who reads it, how long it's kept and how to have it
 * removed (README → Security, privacy and data protection). Written to match what the code does:
 * server/src/modules/submissions and the request logger, which records no IP addresses or bodies.
 */
export function PrivacyPage() {
  return (
    <InnerPageLayout
      title="Privacy notice"
      section={navSection('Connect')}
      intro="What we collect through this website, who sees it, how long we keep it, and how to have it removed."
    >
      <p className="text-small text-text-muted">Last updated 16 October 2026.</p>

      <Section title="Browsing the website">
        <ul className="list-disc space-y-1 pl-5">
          <li>You don’t need an account, and we don’t use advertising or tracking cookies.</li>
          <li>
            If you choose a light or dark theme, that choice is saved in your own browser so it’s
            remembered next time. It never leaves your device.
          </li>
          <li>
            The CGPA calculator runs entirely in your browser: your courses and results are never
            saved or sent.
          </li>
          <li>
            Our server keeps a short technical log of each request (the page asked for, the result
            and how long it took). It doesn’t record IP addresses or anything you type.
          </li>
        </ul>
      </Section>

      <Section title="Feedback and suggestions">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>What we collect:</strong> what your message is about, the message, and your
            email only if you choose to give it. Without an email, your message is anonymous.
          </li>
          <li>
            <strong>Who reads it:</strong> the Secretary General, through the admin dashboard, who
            passes welfare issues to the Welfare Secretary and makes sure the officers concerned
            respond. Only signed-in PANS admins can see messages.
          </li>
          <li>
            <strong>How long:</strong> messages are deleted after 12 months.
          </li>
        </ul>
      </Section>

      <Section title="Alumni network">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>What we collect:</strong> your name, graduation year, email, your phone number
            if you give it, how you’d like to help, and when you gave consent.
          </li>
          <li>
            <strong>Who sees it:</strong> the Alumni Network Committee and PANS admins, through the
            admin dashboard. It’s never published on the website or shared outside PANS UNILAG.
          </li>
          <li>
            <strong>Why:</strong> to contact you about mentoring, events and supporting students, as
            you agreed when you joined.
          </li>
          <li>
            <strong>How long:</strong> until you ask to be removed.
          </li>
        </ul>
      </Section>

      <Section title="Keeping it safe">
        <ul className="list-disc space-y-1 pl-5">
          <li>Forms are sent over an encrypted connection (HTTPS).</li>
          <li>
            Only a small number of PANS admins can sign in to read submissions, and there is no
            public sign-up.
          </li>
          <li>
            To stop spam and password guessing, we count the forms and admin sign-in attempts sent
            from each internet (IP) address. The count is kept in our database for at most an hour,
            then deleted automatically, and isn’t used for anything else.
          </li>
          <li>
            We use trusted services to run the site: website and server hosting, a database and an
            image service. They store data on our behalf and don’t use it for anything else.
          </li>
        </ul>
      </Section>

      <Section title="Your rights">
        <p>
          You can ask to see, correct or delete what we hold about you, or withdraw your consent to
          the alumni network at any time. Send a request through the{' '}
          <Link to="/connect/feedback">feedback form</Link> (leave an email so we can reply) or
          write to the Secretary General at the <Link to="/connect/contact">postal address</Link>.
          We’ll act on it as soon as we can.
        </p>
        <p className="text-small text-text-muted">
          We never publish personal phone numbers or personal email addresses.
        </p>
      </Section>
    </InnerPageLayout>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = title.toLowerCase().replace(/[^a-z]+/g, '-')
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-h3">
        {title}
      </h2>
      {children}
    </section>
  )
}
