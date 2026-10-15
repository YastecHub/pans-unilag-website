/**
 * First focusable element on every page: jumps keyboard users past the header.
 * It sits just above the screen and slides into view when it receives focus.
 */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="fixed top-3 left-3 z-[100] -translate-y-24 rounded-md bg-navy px-4 py-3 font-heading font-medium text-on-primary no-underline focus:translate-y-0"
    >
      Skip to main content
    </a>
  )
}
