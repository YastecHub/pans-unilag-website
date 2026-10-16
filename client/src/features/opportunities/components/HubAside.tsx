import { Link } from 'react-router'

/** Who runs the hub and how to share a listing. */
export function HubAside() {
  return (
    <section aria-labelledby="hub-about-title" className="flex flex-col gap-2">
      <h2 id="hub-about-title" className="text-[1.25rem]">
        About the hub
      </h2>
      <p className="text-small">
        Run by the{' '}
        <Link to="/leadership/committees/cpd-cbc">
          Career and Professional Development & Capacity Building Committee (CPD & CBC)
        </Link>
        . Listings disappear the day after their deadline.
      </p>
      <p className="text-small">
        Know of an opportunity for pharmacy students?{' '}
        <Link to="/connect/feedback">Tell us about it</Link>.
      </p>
    </section>
  )
}
