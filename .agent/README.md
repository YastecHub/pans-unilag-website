# Reusable agent prompts

Copy this entire `agent` folder into the root of a Node.js, Next.js, or React repository. The files are ordinary Markdown prompts: no installer, dependencies, YAML metadata, or skill registration is required.

These prompts are project-neutral. Engineering roles adapt to the inspected codebase instead of assuming a product name, database, framework, payment provider, or folder structure. Principles transfer to other stacks, but their runtime guidance is designed for JavaScript and TypeScript. The hackathon idea role also works without a codebase.

## Start here

1. Copy `agent/` into your project.
2. Optionally fill in `agent/project-context.md` with confirmed project facts. Unknown fields can stay unknown.
3. Tell your coding assistant which file to read, or attach/paste the prompt when it cannot read repository files.

An ordinary folder is not a guarantee of automatic discovery. Explicitly ask the assistant to read the relevant file. The role names describe how it should work; they do not create separate running agents.

## Copyable prompts for every role

Copy one prompt below into your coding assistant and replace the text in `[brackets]`. These prompts tell the assistant to read and **apply** the corresponding file. They do not run separate agents automatically. If the assistant cannot read project files, attach or paste the selected role file along with your request.

### Orchestrator

> Read and apply `agent/orchestrator.md` for this task: [describe the goal]. Inspect this repository, select and read only the relevant role files from `agent/`, then complete the task. Tell me which roles you used, what you changed or found, and which checks actually ran.

### Architect

> Read and apply `agent/architect.md`. Inspect [repository or module] and design or review the architecture for [requirement]. Map current module dependencies and business boundaries, identify concrete problems, and recommend the smallest sound structure and migration steps. If implementation is requested, make the changes and verify them.

### Background Job Specialist

> Read and apply `agent/background-job-specialist.md`. Review or implement [queue, scheduled job, or worker] for [business operation]. Trace enqueueing, retries, duplicates, crashes, failures, and recovery using the actual queue system in this repository. Fix the requested scope and report how you verified the behavior.

### Bug Bounty Hunter

> Read and apply `agent/bug-bounty-hunter.md`. Hunt for business logic bugs in [feature or workflow], including invalid state transitions, boundary values, rounding, duplicate actions, and inconsistent rules across entry points. Report reproducible findings with file locations and expected versus actual behavior. [Review only / fix confirmed defects].

### Code Reviewer

> Read and apply `agent/code-reviewer.md`. Review [commit, pull request, files, or feature] against its intended behavior. Trace relevant callers and tests, then report only supported correctness, security, architecture, and performance findings with severity, file location, impact, and a concrete fix. This is a review only; do not edit code.

### Database Specialist

> Read and apply `agent/database-specialist.md`. Inspect the actual database and ORM, then review or implement [schema, query, transaction, or migration] for [feature]. Check constraints, concurrency, query plans where safe, existing data, and migration compatibility. Complete the requested changes and report verification.

### DevOps Engineer

> Read and apply `agent/devops-engineer.md`. Inspect the current build, CI/CD, runtime, and deployment configuration for [service or application]. [Describe the issue or desired change]. Make the requested configuration changes, validate them with available tools, and provide a deployment or rollback plan where relevant. Do not deploy unless that is part of this request.

### Edge-Case and Concurrency Handler

> Read and apply `agent/edge-case-concurrency-handler.md`. Analyze [state-changing operation] under simultaneous requests, worker retries, and timeouts. State the invariant, show a concrete harmful interleaving, then select and implement an appropriate database constraint, atomic update, lock, or idempotency strategy if a fix is requested. Verify with meaningful concurrent checks.

### Engineer

> Read and apply `agent/engineer.md`. Implement [backend feature or fix] in this repository. Inspect a comparable feature and established conventions before coding. Complete the applicable validation, authorization, business rules, persistence, API response, error handling, and focused verification; report any unresolved dependency.

### Frontend Architect

> Read and apply `agent/frontend-architect.md`. Inspect the React or Next.js frontend for [feature area or whole app]. Map routes, feature boundaries, component ownership, state, API contracts, and design-system usage. Propose a practical target structure and migration order with specific file placement and dependency rules. [Plan only / implement the requested scope].

### Frontend Performance Optimizer

> Read and apply `agent/frontend-performance-optimizer.md`. Investigate [slow page or interaction] on [device/network conditions]. Establish a repeatable baseline, locate the actual bottleneck across rendering, requests, bundles, and assets, then implement supported improvements. Measure under comparable conditions and report before/after results and limits.

### Frontend Specialist

> Read and apply `agent/frontend-specialist.md`. [Implement new feature / refactor existing frontend] for [user goal]. Research the repository's framework version, similar feature, design system, data flow, and relevant official documentation **before writing code**. State the pattern you will follow, use it consistently during implementation, and verify the finished user journey.

### Hackathon Idea Specialist

> Read and apply `agent/hackathon-idea-specialist.md`. Analyze this hackathon: [official URL or pasted brief]. Our team has [members, skills, time, budget, and existing assets]. Check eligibility and judging criteria, research relevant alternatives and dependencies when possible, generate varied ideas, score the best options, and recommend one idea, a backup, and a buildable demo plan. Mark unknowns clearly.

### Next.js Specialist

> Read and apply `agent/nextjs-specialist.md`. Inspect the installed Next.js version, router, rendering mode, and deployment configuration for [route or feature]. [Describe the behavior or problem]. Implement or audit the change using the correct server/client boundaries, authorization, data fetching, and caching rules for this version, then verify the affected route.

### Payments Edge-Case Reviewer

> Read and apply `agent/payments-edge-cases.md`. Review [payment, wallet, subscription, webhook, refund, or payout flow] with its actual provider and currencies. Trace initiation through provider confirmation, durable processing, ledger or business effects, and reconciliation. Apply the embedded checklist with evidence, identify duplicate or lost-money scenarios, and [report findings only / fix the specified gaps].

### Performance Optimizer

> Read and apply `agent/performance-optimizer.md`. Investigate [latency, throughput, memory, database, or end-to-end performance problem] under [representative workload]. Establish a baseline, identify measured bottlenecks across the relevant layers, implement the smallest useful improvement, and re-measure the same workload. Report trade-offs and uncertainty.

### React Engineer

> Read and apply `agent/react-engineer.md`. Implement or fix [component, form, hook, or user flow]. Inspect the repository's React version, styling, routing, data-fetching conventions, and a similar screen first. Follow its pattern, handle loading and failure states, preserve accessibility and responsive behavior, and verify the actual interaction.

### Red Team / Security Analyst

> Read and apply `agent/red-team.md`. Perform an authorized security review of [feature, files, or local test environment]. Trace identity, permissions, tenant isolation, input handling, sessions, and sensitive data through server entry points. Report evidence-backed findings with severity, a safe reproduction, and remediation. Limit active probing to the target I have authorized: [target or code-only review].

### Test Engineer

> Read and apply `agent/test-engineer.md`. Add meaningful regression coverage for [feature or bug] using this repository's existing test tools. Identify the risk and acceptance criteria, test observable behavior and relevant failure paths at the appropriate layer, run the focused checks, and report results and remaining gaps.

### Accessibility Reviewer

> Read and apply `agent/accessibility-reviewer.md`. Review [page, component, or user journey] for semantic markup, labels, keyboard access, focus, forms, contrast, responsive reflow, and reduced motion. Use automated and manual checks that are available, report confirmed barriers with reproduction and fixes, and [review only / implement fixes and recheck].

## Optional repository instruction

If your assistant reads a root `AGENTS.md` or another project instruction file, append the following to that existing file. Do not replace unrelated instructions. If your client uses a different instruction entry point, put it there or use the explicit prompts above.

```markdown
## Engineering role prompts

For engineering tasks, read `agent/orchestrator.md` and select only the relevant role prompts from `agent/`. Read `agent/project-context.md` when present. These are reusable defaults; follow the host's instruction precedence and existing project requirements. Inspect the actual stack before applying framework advice. Do not assume the folder creates workers or grants additional permissions. Report the actual changes, checks performed, and material unresolved risks.

For hackathon concept research and selection, read `agent/hackathon-idea-specialist.md`. Apply the official event rules and actual team constraints before ranking ideas.
```

## Included roles

| File | Use it for |
| --- | --- |
| [architect.md](architect.md) | Design or review Node.js and Next.js architecture, module boundaries, dependencies, domain language, and transaction ownership. Use for structural decisions and module splits. |
| [background-job-specialist.md](background-job-specialist.md) | Design or audit Node.js background jobs, queues, cron tasks, retries, durable enqueueing, deduplication, and dead-letter recovery. Use for worker or scheduling changes. |
| [bug-bounty-hunter.md](bug-bounty-hunter.md) | Find business-logic defects, state-machine violations, calculation errors, and reproducible edge cases in the solution. Use for logic audits and bug investigations. |
| [code-reviewer.md](code-reviewer.md) | Review JavaScript, TypeScript, Node.js, Next.js, and React changes for correctness, security, architecture, and regressions. Use for PR reviews or focused code audits. |
| [edge-case-concurrency-handler.md](edge-case-concurrency-handler.md) | Analyze races, duplicate effects, isolation anomalies, locks, retries, and compensation in Node.js and Next.js mutations. Use for concurrent updates or retry safety. |
| [engineer.md](engineer.md) | Implement backend features and fixes in Node.js or Next.js using existing project conventions. Use for API, domain-service, persistence, validation, or integration implementation. |
| [performance-optimizer.md](performance-optimizer.md) | Measure and improve Node.js, database, React, and Next.js performance. Use for latency, throughput, memory, bundle-size, rendering, or Core Web Vitals problems. |
| [red-team.md](red-team.md) | Audit application security in authorized Node.js, Next.js, and React code. Use for authentication, authorization, input, session, dependency, and data-exposure reviews. |
| [payments-edge-cases.md](payments-edge-cases.md) | Review payment, wallet, refund, subscription, webhook, payout, or ledger changes for duplicate effects, ambiguous outcomes, and reconciliation gaps. Use only when money movement is in scope. |
| [frontend-architect.md](frontend-architect.md) | Design React and Next.js frontend boundaries, state ownership, component contracts, and design-system structure. Use for frontend architecture or major UI refactoring. |
| [frontend-specialist.md](frontend-specialist.md) | Research an existing frontend before coding, implement new features using its established patterns, and refactor messy frontend code in working slices. |
| [frontend-performance-optimizer.md](frontend-performance-optimizer.md) | Measure and improve React and Next.js loading, rendering, interaction, bundles, and visual stability. |
| [react-engineer.md](react-engineer.md) | Build or fix React components, hooks, forms, and user flows in SPAs or Next.js client UI. Use for frontend implementation and React behavior bugs. |
| [nextjs-specialist.md](nextjs-specialist.md) | Implement or audit Next.js routing, Server Components, Server Actions, caching, metadata, and deployment behavior. Use only for Next.js-specific tasks. |
| [accessibility-reviewer.md](accessibility-reviewer.md) | Review React and Next.js interfaces for keyboard access, semantics, focus, forms, contrast, responsive usability, and WCAG concerns. Use for accessibility audits and UI acceptance. |
| [test-engineer.md](test-engineer.md) | Design and implement meaningful regression, integration, and end-to-end tests for Node.js, Next.js, and React. Use for testing tasks and significant correctness risks. |
| [database-specialist.md](database-specialist.md) | Design or review schemas, ORM queries, migrations, constraints, indexes, and transactions for the solution. Use for persistence or data-integrity changes. |
| [devops-engineer.md](devops-engineer.md) | Review or implement Node.js and Next.js build, container, CI/CD, runtime configuration, health checks, observability, and deployment reliability. |
| [hackathon-idea-specialist.md](hackathon-idea-specialist.md) | Decode an event brief, research constraints and alternatives, generate varied ideas, score them against the judging criteria, and recommend a buildable concept with a backup. |
| [orchestrator.md](orchestrator.md) | Select and coordinate relevant solution engineering skills for a feature, review, or bug investigation. Use for multi-area work or initial codebase orientation. |

## Editing and reuse

Each of the 20 role files includes its own instructions. You can use a role independently by copying its contents into a prompt. The payments checklist and role-routing table are embedded in their respective prompts, so there are no missing reference folders.

Keep product facts in `project-context.md`. Adapt the prompts to your team's rules when needed. Existing user/project restrictions on tests and deployments still apply. Reviews report findings; implementation requests authorize the relevant code changes. No prompt guarantees correctness or security without inspecting and verifying the actual system.
