import type { PageSection } from '../../pages/api/pages.ts'

/**
 * An office's duties from the "executive-council" page (pages.json), so the duties are written once.
 * Sections are either one office ("President") or several, with a "**Office:**" bullet for each.
 */
export function dutiesFor(
  office: string,
  sections: PageSection[],
): { markdown: string; articleRefs: string[] } | null {
  const own = sections.find((s) => s.heading === office)
  if (own) return { markdown: own.bodyMarkdown, articleRefs: own.articleRefs }

  const label = `**${office}:**`
  for (const section of sections) {
    const bullet = section.bodyMarkdown
      .split('\n')
      .find((line) => line.replace(/^-\s*/, '').startsWith(label))
    if (bullet) {
      return {
        markdown: bullet.replace(/^-\s*/, '').slice(label.length).trim(),
        articleRefs: section.articleRefs,
      }
    }
  }
  // Assistants are described inside their principal's bullet: "The **Assistant PRO** assists …".
  for (const alias of new Set([office, office.replace('Public Relations Officer', 'PRO')])) {
    for (const section of sections) {
      const sentence = section.bodyMarkdown
        .split(/(?<=\.)\s+/)
        .find((part) => part.startsWith(`The **${alias}**`))
      if (sentence)
        return { markdown: sentence.replace(/\*\*/g, ''), articleRefs: section.articleRefs }
    }
  }
  return null
}
