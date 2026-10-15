/** A MongoDB text index over `fields` (one per collection), for site search. */
export function textIndex(fields: readonly string[]): Record<string, 'text'> {
  return Object.fromEntries(fields.map((f) => [f, 'text' as const]))
}

/** The first field (the title or name) counts ten times as much as the others. */
export function textWeights(fields: readonly string[]): Record<string, number> {
  return Object.fromEntries(fields.map((f, i) => [f, i === 0 ? 10 : 1]))
}
