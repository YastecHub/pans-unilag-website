import ReactMarkdown, { type Components } from 'react-markdown'
import { Link } from 'react-router'

/**
 * Renders content Markdown (page sections, announcements, committee write-ups) safely:
 * raw HTML in the text is dropped, only the elements below are allowed, and links to our own pages
 * use the router. Headings inside content start at h3, under the page's h1 and section h2s.
 */
const ALLOWED = [
  'p',
  'strong',
  'em',
  'ul',
  'ol',
  'li',
  'a',
  'blockquote',
  'h3',
  'h4',
  'br',
  'hr',
  'code',
]

const components: Components = {
  h1: ({ children }) => <h3>{children}</h3>,
  h2: ({ children }) => <h3>{children}</h3>,
  h3: ({ children }) => <h3>{children}</h3>,
  h4: ({ children }) => <h4 className="font-heading font-medium">{children}</h4>,
  a: ({ href = '', children }) =>
    href.startsWith('/') ? (
      <Link to={href}>{children}</Link>
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children} <span className="sr-only">(opens in a new tab)</span>
      </a>
    ),
}

const styles = [
  'flex flex-col gap-3',
  '[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:my-1 [&_li]:pl-1',
  '[&_blockquote]:border-l-4 [&_blockquote]:border-border-strong [&_blockquote]:pl-4 [&_blockquote]:text-text-muted',
  '[&_strong]:font-semibold',
].join(' ')

/** Loaded on demand by Markdown.tsx, so pages without Markdown don't download the parser. */
export default function MarkdownRenderer({
  children,
  className = '',
}: {
  children: string
  className?: string
}) {
  return (
    <div className={`${styles} ${className}`}>
      <ReactMarkdown
        skipHtml
        allowedElements={[...ALLOWED, 'h1', 'h2']}
        unwrapDisallowed
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
