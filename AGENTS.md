# Agents

Instructions for AI agents working in this repository.

## Commit Convention

Every commit message follows [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```text
<type>: Title

Brief description.

- Action item 1.
- Action item n.
```

### Types

| Type    | When to use                       |
| ------- | --------------------------------- |
| `feat`  | New features or capabilities      |
| `fix`   | Bug fixes                         |
| `chore` | Tooling, config, dependencies, CI |
| `task`  | Changes to existing functionality |
| `spike` | Research or exploration           |

### Rules

- Subject line: imperative mood, lowercase, no period, max 72 characters
- Body: brief description followed by bullet points listing each concrete change
- No `Co-Authored-By` or AI attribution lines

## Tooling Contract

The `engines` field in `package.json` is the **only** source of truth for allowed runtimes and package managers. Any tool not declared there is forbidden. This applies to every agent, sub-agent, and orchestrator. No exceptions.

## Agent Prohibitions

### Compact Rules for Sub-Agent Injection

Orchestrators MUST inject these rules verbatim into every sub-agent prompt.

**PROHIB-TOOLS:**

- FORBIDDEN: `gh` (GitHub CLI) — no `gh auth`, `gh pr`, `gh api`. Use `curl`, `WebFetch`, or Playwright.
- FORBIDDEN: `npm`, `npx`, `yarn` — only `pnpm` (declared in `engines`).
- FORBIDDEN: `brew install`, `apt install` — no system-level installations.
- FORBIDDEN: `cat`, `grep`, `find`, `sed`, `ls` — use `bat`, `rg`, `fd`, `sd`, `eza`.
- FORBIDDEN: manual file creation when official CLI exists — use `pnpm dlx` + scaffolding.

**PROHIB-PATTERNS:**

- FORBIDDEN: hardcoded CSS values — always `var(--vh-*)`.
- FORBIDDEN: static imports of lazy-loaded libraries.

Violation → immediate kill. No second attempt on the same violation.

## Anti-Rationalization Protocol

Rules in this document are MECHANICAL, not ADVISORY. An agent does not have authority to:

- Judge whether a rule "applies" based on task size, complexity, or urgency
- Invent exceptions not explicitly written ("too small for a branch", "just a config change", "fix directa")
- Reinterpret a rule's intent to justify skipping it ("the spirit of the rule doesn't require this here")
- Defer compliance ("I'll create the handoff after this quick fix")

### The Rationalization Test

Before bypassing, reducing, or "scaling down" ANY protocol in this document:

1. **Quote the exact text** that authorizes the bypass. Not a paraphrase — the exact sentence.
2. If no exact sentence authorizes it → the bypass is unauthorized. Full stop.
3. If the agent finds itself writing phrases like "this doesn't warrant," "this is just," "given the simplicity," "an exception for," or "in this case we can skip" → rationalization signal. Stop and comply as written.

### Interpretation Rules

- Ambiguity resolves in favor of MORE compliance, not less
- "Scale to the work" means reduce content volume, never skip structural requirements
- Silence on a topic means the default protocol applies, not that the agent has discretion
- The agent cannot grant itself exceptions. Only an explicit user directive overrides a rule, and the agent MUST echo the override back for confirmation before acting

### Burden of Proof

The burden of proof for non-compliance lies with the agent, not with the document. "The document doesn't explicitly say I must" is not valid justification for skipping. If a reasonable reading implies the obligation, the obligation exists.

## Model Assignment Policy

Before launching a sub-agent, ask: does it need to REASON, IMPLEMENT, or SEARCH?

| Tier        | Model  | Use when                                                      |
| ----------- | ------ | ------------------------------------------------------------- |
| Search/Read | haiku  | Grep, read docs, lint checks, format, exploratory reads       |
| Implement   | sonnet | Write code, tests, reviews, verify quality gates              |
| Architect   | opus   | Design decisions, conflict resolution, multi-source synthesis |

With 6+ agents, tier discipline multiplies savings. Never burn opus on a grep.

## Orchestration Protocol

### Status Updates

Agents MUST include in every response:

```text
Status: [IN_PROGRESS | BLOCKED | DONE | FAILED]
Progress: X/Y items
Blocker: (if applicable)
```

- No status → STALLED → kill + relaunch
- BLOCKED > 1 iteration → kill + reassign with blocker context
- FAILED → diagnose root cause before relaunch

### Rejection Escalation

1. Gate fails → specific feedback with evidence → agent corrects
2. Same gate fails again → kill + relaunch fresh with error context
3. Third failure → orchestrator implements directly

### MIM Checkpoints (Man-in-the-Middle)

Orchestrator MUST NOT advance phases without explicit user approval.

| Rule         | Detail                                                                         |
| ------------ | ------------------------------------------------------------------------------ |
| Default      | MIM is mandatory at every phase boundary                                       |
| Override     | Handoff doc can declare `Mode: autonomous` for non-visual phases               |
| Visual gates | Always MIM regardless of mode (UX/layout/a11y require human eyes)              |
| Protocol     | Present result → user approves/requests changes/rejects → no LGTM = no advance |

### Evidence-Only Progress

A checkbox is a lie until confirmed by evidence. Mark ONLY after: diff verified, command output checked, or MIM approval received. Self-reported status from the executing agent is NOT evidence.

## Branching Model

```text
task/{name} → feature/{epic} → {integration-branch} → PR to master
```

- Task branches: `task/{descriptive-name}` — one per agent/work unit
- Epic branches: `feature/{epic-name}` — collects all task merges
- Integration branch: squash-merge from epic branch
- No direct commits to master or integration branch
- Independent tasks in same phase → `isolation: 'worktree'` for parallel execution

### No Exceptions

There is no "too small" exemption. A one-line typo fix follows the same branching model as a 50-file epic. The model exists for auditability and rollback safety, not complexity management.

If an agent writes "no requiere feature branch", "fix directa", "commit directo", or any variation that bypasses branching → protocol violation. Kill and restart with the branching model enforced.

Only an explicit user directive (e.g., "commit directly, skip branching") suspends this rule. The agent MUST echo the override back to the user for confirmation before acting on it.

### Handoff Coupling

The `{name}` in `task/{name}` MUST match an existing `.tmp-{name}-handoff.md` file (or a `.tmp-*-handoff.md` that declares that task). Before creating any branch, verify: `eza .tmp-*-handoff.md`. If no matching handoff file exists, the branch cannot be created. This is a hard prerequisite, not a recommendation.

## Quality Gate Framework

Every task in a handoff document MUST define its acceptance criteria as a gate table.

```markdown
| Gate | Verification | Command/Check | Type |
| ---- | ------------ | ------------- | ---- |
```

Type values:

- `EXE` — deterministic command, auto-verifiable by orchestrator
- `MAN` — requires human judgment or visual inspection (always MIM)

Minimum gates required for any task:

| Gate            | Command                                 | Type |
| --------------- | --------------------------------------- | ---- |
| Handoff exists  | `eza .tmp-*-handoff.md` (exit 0)        | EXE  |
| Lint clean      | `pnpm test:static`                      | EXE  |
| Types clean     | `pnpm test:types`                       | EXE  |
| No side effects | `git diff --stat` (only expected files) | EXE  |

## Handoff

**MANDATORY PRE-EXECUTION GATE — ORCHESTRATOR CANNOT PROCEED WITHOUT THIS.**

Structured work requires a handoff document generated via the `handoff` skill (`/handoff {name}`). Applies to any scale: features, bugs, spikes, epics, or investigations. The document lives at `.tmp-{name}-handoff.md` (repo root, not committed). It is the single source of truth for the work unit: agent assignments, quality gates, execution phases, and canonical contracts.

STOP. If no `.tmp-*-handoff.md` exists for the current work → you are in violation. Create it now before proceeding.

Auto-cleanup: when ALL checkboxes in the progress tracker are marked AND the user authorizes, the `.tmp-` file is deleted.

### Authorization Model (inverted default)

The orchestrator operates in TWO modes. There is no third option.

**READ-ONLY MODE** (default — no `.tmp-*-handoff.md` exists for the current work):

The orchestrator may read files, search code, run read-only commands, and respond to the user. It CANNOT call Edit, Write, Agent-with-write-permissions, or branch-creating commands. These capabilities are not available in this mode.

**EXECUTION MODE** (`.tmp-{name}-handoff.md` exists on disk):

The orchestrator may perform actions scoped to the work defined in the handoff. The handoff's Task Branches define which files and branches are in scope.

To transition from READ-ONLY to EXECUTION: run `/handoff {name}`. This is not a check to remember — it is the mechanism by which write permissions are granted.

### Trigger Rule (mandatory — no exceptions)

Every user request starts ONE of two tracks:

**Track A — Answer (no handoff needed):** The orchestrator's ENTIRE response is a message back to the user: an explanation, diagnosis, code review, or answer. No tool calls that create, edit, delete, or delegate. No branches. No file writes. No agent launches. If the response includes EVEN ONE action beyond answering → it is Track B.

**Track B — Act (handoff required FIRST):** The orchestrator will change repo state in any way — creating branches, editing files, launching sub-agents, running fix-and-verify cycles, generating plans to files.

Track B procedure (sequential, no skipping):

1. `eza .tmp-*-handoff.md` — does a handoff for this work already exist?
2. YES → proceed to execution under that handoff.
3. NO → run `/handoff {name}` NOW. Do not compose any Edit, Write, Agent, or Bash-that-mutates call until the `.tmp-{name}-handoff.md` file exists on disk.

**Enforcement by structural dependency, not self-monitoring:**

- The Branching Model requires `task/{name}` where `{name}` matches a handoff (see § Handoff Coupling).
- The Quality Gate Framework requires handoff existence as its FIRST gate (see minimum gates table).
- Sub-agent prompts MUST include the handoff file path. A sub-agent launched without a handoff reference is a protocol violation.

### Minimum Viable Handoff (mandatory structure — no exceptions)

"Scale to the work" means scale section DEPTH, not section PRESENCE. A bug fix Progress Tracker has 4 checkboxes; an epic has 60. Both have a Progress Tracker.

Every handoff, regardless of scale, MUST contain at minimum:

1. **Header block** — Status, Branch, Artifact declaration, Auto-cleanup rule
2. **Menu** — Anchor links to every section present in the document
3. **Back-links** — `[↑ Menu](#menu)` (or localized equivalent) after every section
4. **Orchestration** — At minimum: agent assignment table, agent prohibitions (verbatim from this file), and quality gates with gate type (EXE/MAN)
5. **Progress Tracker** — One checkbox per quality gate per task, plus MIM and MERGED checkboxes. Tracker MUST mirror gate tables 1:1.
6. **Branching model** — Branch name(s) following the model defined in this file. Even a single-task fix gets a task branch.
7. **Out of Scope** — At least one explicit exclusion to prevent scope creep

Sections that MAY be omitted for small work (bug fix, config change): Architecture, Canonical Interface Contracts, Data Mapping, Dependencies. Sections listed above are never optional. An empty table with correct headers is better than a missing section.

### Progress Tracking Obligation (mandatory during execution)

The handoff's Progress Tracker is a LIVE document, not a static plan. The orchestrator MUST update the `.tmp-` file as execution proceeds:

1. **After each gate passes**: mark the checkbox with `[x]` and append evidence inline (e.g., `- [x] Lint clean — pnpm test:static exit 0`)
2. **After each MIM approval**: mark the MIM checkbox with user's response
3. **After each merge**: mark the MERGED checkbox with the merge commit SHA
4. **On failure**: mark the checkbox with `[!]` and append failure reason. Differentiate "not yet attempted" from "attempted and failed."

**Staleness check**: if the orchestrator has completed 2+ tasks without updating the Progress Tracker → STOP. Update the tracker for ALL completed items before proceeding with new work. Zero checked boxes after substantive work = stalled tracking = protocol violation.

### Handoff Quality Gate (self-check before proceeding)

After generating the handoff, the orchestrator MUST verify against this checklist before any execution begins:

| Check              | Criteria                                       | Fail action           |
| ------------------ | ---------------------------------------------- | --------------------- |
| Header block       | Status, Branch, Artifact, Auto-cleanup present | Regenerate            |
| Menu               | Anchor links to all sections in the document   | Add menu              |
| Back-links         | Every section ends with `[↑ Menu](#menu)`      | Add links             |
| Agent Assignment   | Table with model tier per agent                | Add table             |
| Agent Prohibitions | Copied verbatim from this file, not summarized | Replace with verbatim |
| Quality Gates      | Full table per task with EXE/MAN type column   | Add gates             |
| Progress Tracker   | Checkboxes mirror Quality Gates 1:1            | Reconcile             |
| Branching model    | Branch names and merge target declared         | Add diagram           |
| Out of Scope       | At least one exclusion present                 | Add section           |

If any check fails, fix the handoff before proceeding. A malformed handoff is not "good enough for now."

### Reference Example

The handoff for the `download-resume-pdf` epic (git ref: `bdd2221^1:.tmp-download-resume-handoff.md`, 689 lines) is the canonical example of a well-formed handoff. Key patterns to replicate:

- **Back-links** — every section ends with `[↑ Menú](#menú)`
- **Per-agent gate tables** — specific, non-generic gates with exact verification commands
- **1:1 tracker mirroring** — every gate in Quality Gates has a matching checkbox in Progress Tracker
- **Explicit orchestrator instruction** — "mark checkboxes as evidence confirms" stated inside the document
- **Risk cross-references** — HIGH risks tagged as `CRITICAL (RN)` in relevant task branches

When in doubt about handoff quality or structure, consult this reference.

### Portable Handoffs

When a handoff document must travel cross-repo or cross-session (another agent, another day), the `.tmp-` prefix prevents committing because `.tmp` is in `.gitignore`. For these cases, use the `.handoff-` prefix instead.

| Type              | Prefix                   | Gitignored | Committed                                   | Lifecycle                                 |
| ----------------- | ------------------------ | ---------- | ------------------------------------------- | ----------------------------------------- |
| Ephemeral handoff | `.tmp-{name}-handoff.md` | Yes        | Never                                       | Born and dies within the same task        |
| Portable handoff  | `.handoff-{name}.md`     | No         | Yes, when cross-boundary transfer is needed | Travels with code, deleted at destination |

Rules for `.handoff-` documents:

1. Used ONLY when work crosses boundaries (another repo, mandatory cross-session transfer)
2. The destination agent reads it, uses it as handoff, and deletes it upon completion
3. Default is always `.tmp-` — portable handoffs require explicit user authorization
4. Auto-cleanup: the destination agent deletes the `.handoff-` file when work concludes
