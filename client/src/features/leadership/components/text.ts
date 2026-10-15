/** The first sentence of a Markdown write-up, as plain text, for cards and page intros. */
export function firstSentence(markdown: string, max = 200): string {
  const plain = markdown
    .replace(/[*_`#>]/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
  const end = plain.search(/[.!?](\s|$)/)
  const sentence = end === -1 ? plain : plain.slice(0, end + 1)
  return sentence.length <= max ? sentence : `${sentence.slice(0, max - 1).trimEnd()}…`
}
