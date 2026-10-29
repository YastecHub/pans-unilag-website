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
      title="Your data and privacy"
      section={navSection('Connect')}
      intro="How PANS UNILAG handles information collected through this website, who can access it, how long it is kept, and how you can request its removal."
    >
      <p className="text-small text-text-muted">Last updated 29 October 2026.</p>

      <Section title="Browsing our website">
        <p>
          You can browse the PANS UNILAG website without creating an account. We do not use
          advertising or tracking cookies.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Theme preferences:</strong> if you choose light or dark mode, your preference is
            saved in your browser so it can be remembered on your next visit. This preference stays
            on your device.
          </li>
          <li>
            <strong>CGPA calculator:</strong> the calculator runs entirely in your browser. The
            courses and results you enter are not saved or sent to our servers.
          </li>
          <li>
            <strong>Visit statistics:</strong> we use Vercel Web Analytics to count page visits. It
            does not use cookies or identify you.
          </li>
          <li>
            <strong>Technical logs:</strong> our server records limited technical information about
            requests, such as the page requested, the response status, and how long the request
            takes. These logs do not include IP addresses or the information you type into website
            forms.
          </li>
        </ul>
      </Section>

      <Section title="Feedback and suggestions">
        <p>We welcome your feedback, suggestions, and concerns about the Association.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>What we collect:</strong> the subject and content of your message, along with
            your email address if you choose to provide one. If you do not provide an email address,
            your submission is anonymous.
          </li>
          <li>
            <strong>Who can access it:</strong> the Secretary General receives submissions through
            the administrative dashboard and may refer welfare-related concerns to the Welfare
            Secretary or direct other matters to the relevant officers. Only authorised, signed-in
            PANS administrators can access these messages.
          </li>
          <li>
            <strong>How long we keep it:</strong> feedback submissions are deleted after 12 months.
          </li>
        </ul>
      </Section>

      <Section title="Alumni network">
        <p>
          Our alumni network helps former students stay connected with PANS UNILAG, build meaningful
          networks, and foster growth, career and professional development.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>What we collect:</strong> your name, graduation year, email address, phone
            number if provided, and a record of when you gave consent.
          </li>
          <li>
            <strong>Who can access it:</strong> the Alumni Network Committee and authorised PANS
            administrators can view submissions through the administrative dashboard.
          </li>
          <li>
            <strong>How long we keep it:</strong> we retain your information until you request
            removal from the alumni network.
          </li>
          <li>
            <strong>Public access and sharing:</strong> your information is not published on the
            website or shared outside PANS UNILAG.
          </li>
        </ul>
      </Section>

      <Section title="How we protect your information">
        <p>We take reasonable measures to protect information submitted through our website.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Secure connections:</strong> forms are submitted over an encrypted HTTPS
            connection.
          </li>
          <li>
            <strong>Restricted access:</strong> only a limited number of authorised PANS
            administrators can sign in to access submissions. There is no public sign-up for
            administrative access.
          </li>
          <li>
            <strong>Spam and login protection:</strong> to help prevent spam and unauthorised
            sign-in attempts, we count form submissions and administrative login attempts associated
            with each IP address. These counts are stored in our database for no longer than one
            hour and are automatically deleted afterwards. They are not used for other purposes.
          </li>
          <li>
            <strong>Service providers:</strong> we use trusted third-party services for website and
            server hosting, database management, and image delivery. These providers process or
            store information as needed to operate the website on our behalf.
          </li>
        </ul>
      </Section>

      <Section title="Your information, your choice">
        <p>You can ask us to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>tell you what personal information we hold about you;</li>
          <li>correct inaccurate or outdated information;</li>
          <li>delete your information;</li>
          <li>record your withdrawal of consent to participate in the alumni network.</li>
        </ul>
        <p>
          To make a request, contact us through the{' '}
          <Link to="/connect/feedback">feedback form</Link>. Please include your email address so we
          can respond. You can also write to the Secretary General using the contact details on our{' '}
          <Link to="/connect/contact">Contact page</Link>. We will review your request and respond
          as soon as reasonably possible.
        </p>
        <p className="text-small text-text-muted">
          We do not publish personal phone numbers or personal email addresses on this website.
        </p>
      </Section>

      <Section title="Questions?">
        <p>
          If you have questions about how PANS UNILAG handles your information or would like to
          exercise your data rights, please contact us through our{' '}
          <Link to="/connect/feedback">feedback form</Link> or{' '}
          <Link to="/connect/contact">Contact page</Link>. We are committed to handling your
          information responsibly and treating every request with care.
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
