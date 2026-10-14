<!--
Title format: <type>(<scope>): <what changed> (#<issue>)
Example:      feat(server): add events endpoints (#15)
Open as a Draft first; mark Ready for review when the checklist is done.
-->

## What does this PR do?

<!-- One or two sentences in plain words. -->

Closes #

## How was it done?

<!-- Key decisions, files or patterns a reviewer should know about. Mention any .agent/ prompts used. -->

## How to test it

1.
2.
3.

## Screenshots (UI changes)

| Mobile 375 px | Desktop 1280 px |
| --- | --- |
|  |  |

<!-- Add dark mode screenshots if the change affects colours. -->

## Checklist

- [ ] Branch is up to date with `main` (rebased)
- [ ] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass
- [ ] Acceptance criteria in the issue are met
- [ ] Loading, empty, error and placeholder states handled (UI)
- [ ] Server input validated with Zod; admin routes require auth (API)
- [ ] Uses brand tokens, not raw colours; text meets contrast rules
- [ ] Keyboard accessible; images have alt text
- [ ] No secrets, `.env` values, personal phone numbers or personal emails
- [ ] No invented content; missing content is a placeholder
- [ ] Name written as "Pharmaceutical Association of Nigeria Students" where it appears
- [ ] Docs/README updated if setup or behaviour changed

## Notes for the reviewer

<!-- Anything unfinished, follow-up issues opened, or questions. -->
