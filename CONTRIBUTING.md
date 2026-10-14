# Contributing to the PANS UNILAG Website

Thanks for helping build the PANS UNILAG website. This guide explains how we pick up work, write code, open pull requests (PRs) and get them merged. Read it once before your first task; it takes about five minutes.

> **Launch is Friday 16 October 2026.** Small, finished PRs beat big, half-finished ones.

---

## The workflow at a glance

```
Pick an issue → claim it → branch from main → build → open a draft PR early
→ keep it up to date → mark ready → review → squash and merge → delete branch
```

## 1. Before you start

- Read the [README](README.md), especially *Placeholder rules*, *Brand and design system*, *Architecture rules* and *Project structure*.
- Install **Node.js 22** and Git, then follow *Getting started* in the README.
- Never commit secrets. `.env` files stay on your machine.

## 2. Finding and claiming work

All work lives in [GitHub Issues](https://github.com/YastecHub/pans-unilag-website/issues). Use the filters:

| Filter | Meaning |
| --- | --- |
| Milestone **Launch: Fri 16 Oct 2026** | Must or should ship this week |
| `priority: P0` | Launch blocker; pick these first |
| `priority: P1` | Should ship Friday |
| `priority: P2` | After launch |
| `size: S / M / L` | About 2 hours / half a day / a day or more |
| `good first issue` | Well-defined; good for your first PR |
| `status: blocked` | Waiting on another issue or on information; don't start yet |
| `area: client / server / admin / content / infra` | Where the work happens |

**To claim an issue:**

1. Check it isn't assigned and isn't `status: blocked`. Check its **Depends on** list: those issues should be merged, or at least far enough along that you can build on them.
2. Comment **"I'm taking this"** and **assign yourself**. If you can't assign, the web lead will.
3. Hold **at most two** open issues at a time.
4. Open a **draft PR within 3 hours** of claiming, even if it only has one commit. This shows the team you're on it.
5. If you get stuck or can't continue, comment on the issue and unassign yourself. No shame in that; silence is the only problem.
6. An issue with no activity for **12 hours** during launch week may be reassigned.

**Need something that isn't an issue yet?** Open one with the right template (feature, bug or content) before you start, so nobody duplicates the work.

## 3. Branches

Always branch from the latest `main`. Never commit directly to `main`.

```bash
git checkout main
git pull origin main
git checkout -b feat/12-events-api
```

**Branch name:** `<type>/<issue-number>-<short-description>`

| Type | Use for |
| --- | --- |
| `feat/` | New functionality |
| `fix/` | Bug fixes |
| `content/` | Seed data, copy, photos |
| `design/` | Visual assets and styling-only changes |
| `chore/` | Tooling, config, dependencies, CI |
| `docs/` | Documentation |
| `test/` | Tests only |

Examples: `feat/14-leadership-endpoints`, `content/10-seed-committees`, `fix/52-navbar-overflow-mobile`.

## 4. Commits

We use [Conventional Commits](https://www.conventionalcommits.org):

```
<type>(<scope>): <what changed, in the imperative>
```

- **type:** `feat`, `fix`, `content`, `design`, `chore`, `docs`, `test`, `refactor`, `style`
- **scope:** `client`, `server`, `admin`, `seed`, `ci`, or a feature such as `events`, `cgpa`

Examples:

```
feat(server): add events endpoints with upcoming/past filter
fix(client): stop header menu overflowing at 375px
content(seed): add committee officers for 2026/27
test(cgpa): cover grade boundaries 44/45 and 69/70
```

Keep commits focused; several small commits are fine because we squash on merge.

## 5. Keeping your branch up to date

Before opening for review, and whenever `main` moves:

```bash
git fetch origin
git rebase origin/main
# fix any conflicts, then:
git push --force-with-lease
```

Use `--force-with-lease`, never plain `--force`. If rebasing feels risky, ask in the team chat first.

## 6. Opening a pull request

1. Push your branch and open a PR **against `main`**. Start it as a **Draft**.
2. **Title:** same format as a commit, ending with the issue number:
   `feat(server): add events endpoints (#15)`
3. **Description:** fill in the PR template. It must include **`Closes #<issue-number>`** so the issue closes automatically on merge.
4. Mark **Ready for review** only when:
   - the issue's acceptance criteria are met;
   - `npm run lint`, `npm run typecheck`, `npm run test` and `npm run build` pass locally and in CI;
   - UI changes have **screenshots at mobile (375 px) and desktop (1280 px)**, in light and dark mode where relevant;
   - you have reviewed your own diff on GitHub first.
5. Request a review from at least **one teammate** (for `area: server` or `area: admin` security-related work, ask the web lead).

### Keep PRs small

- One issue per PR. If an issue turns out to be large, split it: open new issues and link them.
- Aim for **under ~400 changed lines** (seed JSON and lockfiles don't count).
- Don't mix unrelated refactors or formatting into a feature PR.

## 7. Reviewing a PR

Reviewers check, in order:

1. **Does it do what the issue asks?** Acceptance criteria met.
2. **Correctness and states:** loading, empty, error, not-found and placeholder states handled.
3. **Security:** inputs validated on the server; no secrets or personal data in code, logs or responses; admin routes require auth.
4. **Architecture:** follows the README's structure (thin routes, logic in services/model, brand tokens not raw colours, server-only code not imported by the client).
5. **Accessibility:** labels, keyboard use, focus, alt text, contrast.
6. **Content rules:** name spelled "Pharmaceutical Association of Nigeria Students"; no invented content; placeholders where content is missing.
7. **Tests** for meaningful logic.

Comment with **suggestions, not orders**, and say which comments are blocking. Approve when the blocking points are fixed. Aim to review within **2 hours** during launch week.

## 8. Merging

- At least **one approval** and a **green CI** are required.
- The **author** merges using **Squash and merge**, keeping the PR title as the commit title.
- **Delete the branch** after merging.
- Check the linked issue closed. If it didn't, close it with a link to the PR.

## 9. Definition of Done (for every issue)

- [ ] Acceptance criteria met
- [ ] Lint, typecheck, tests and build pass
- [ ] Works at 375 px and 1280 px, light and dark
- [ ] Keyboard accessible; images have alt text
- [ ] No secrets, personal phone numbers or personal emails
- [ ] Missing content shown as a placeholder, never invented
- [ ] README or docs updated if behaviour or setup changed
- [ ] Reviewed, approved, squash-merged, branch deleted

## 10. Content contributors (non-developers)

Writers, the Content, Media and Design committees, and executives can contribute without writing code:

- Use the **Content** issue template to supply missing content (bios, photos, write-ups, dates, links).
- Attach files to the issue or share a Drive link with access for the team. Say who approved the content.
- Photos need consent; never share personal phone numbers or emails for publication.
- A developer will add the content to the seed files or the admin dashboard and link the PR back to your issue.

## 11. Using the AI agent prompts

The [`.agent/`](.agent/) folder has role prompts for AI coding assistants. Mention which you used in your PR description (e.g. "Applied `.agent/engineer.md` and `.agent/test-engineer.md`"). You are still responsible for every line you submit: read and test AI-generated code before opening a PR.

## 12. Getting help

- Ask on the issue first, so the answer is recorded.
- For anything blocking, tag the web lead in the issue and post in the team chat.
- Found a bug in someone else's merged work? Open a **Bug** issue rather than fixing it silently inside an unrelated PR.

---

*Service to Humanity, one pull request at a time.*
