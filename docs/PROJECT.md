# Project Architecture Map

Hexagonal architecture. `@vh/profile` is the core/port. Everything else is an adapter.

## Layer Map

| Workspace                | Package             | Role      | Allowed Dependencies                                        |
| ------------------------ | ------------------- | --------- | ----------------------------------------------------------- |
| `packages/profile`       | `@vh/profile`       | Core/Port | none (must not import from any app)                         |
| `packages/design-system` | `@vh/design-system` | Shared UI | `@vh/profile` (type-only imports, presentational only)      |
| `apps/resume`            | `@vh/resume`        | Adapter   | `@vh/profile` (main entry), `@profile-data` (JSON snapshot) |
| `apps/readme`            | `@vh/app-readme`    | Adapter   | `@vh/profile/server`                                        |
| `quality/resume`         | (e2e)               | Test      | `apps/resume` (via Playwright, black-box)                   |
| `quality/readme`         | (e2e)               | Test      | `apps/readme` (black-box)                                   |

**Dependency rule**: arrows point one way, core to adapter is forbidden. `@vh/profile` importing from `apps/*` or `quality/*` is a defect, not a style issue.

## Port Boundary — `@vh/profile` Subpath Exports

| Subpath              | File                 | Contains                                          | Safe for    |
| -------------------- | -------------------- | ------------------------------------------------- | ----------- |
| `@vh/profile`        | `src/index.ts`       | Zod schemas, types, `parseDescription`            | Browser     |
| `@vh/profile/schema` | `src/schema.ts`      | Schema-only import, no data                       | Browser     |
| `@vh/profile/data`   | `src/data.ts`        | `PRIVATE_PROFILE`, `PUBLIC_PROFILE` (eager parse) | Server only |
| `@vh/profile/server` | `src/get-profile.ts` | `getProfile()` (lazy, memoized)                   | Server only |

Importing `@vh/profile/data` or `@vh/profile/server` from `apps/resume` (browser bundle) is a boundary violation.

## Add New Adapter — Recipe

1. Scaffold the workspace under `apps/<name>` with its own `package.json`, `tsconfig.json`, and declared `engines`.
2. Register the workspace in the root `pnpm-workspace.yaml` (or equivalent workspace glob).
3. Depend only on `@vh/profile` (browser-safe subpaths) or `@vh/profile/server` (server-safe subpaths) — never on another adapter.
4. If the adapter needs a pre-built data snapshot, add a `tsconfig` path alias (see `@profile-data` pattern) instead of importing JSON directly from `packages/profile`.
5. Add a matching `quality/<name>` workspace for e2e coverage before merging.
6. Do not add new exports to `@vh/profile/package.json` unless the port itself needs to expose new data — that is a schema/design decision, not an adapter-local one.

## Planned Future Adapters

| Adapter  | Mechanism      |
| -------- | -------------- |
| LinkedIn | Playwright RPA |
| Indeed   | TBD            |
| arc.dev  | TBD            |
| OCC      | TBD            |

## Decision Authority

| Change                                                                           | Authority                 |
| -------------------------------------------------------------------------------- | ------------------------- |
| Edits inside a single adapter that don't touch the port boundary                 | Autonomous                |
| Content additions under `packages/profile/content/`                              | Autonomous                |
| Test additions (unit, e2e)                                                       | Autonomous                |
| New workspace (adapter, package)                                                 | MIM required              |
| Changes to `@vh/profile` schemas, subpath exports, or `package.json` exports map | MIM required              |
| Edits to `AGENTS.md`                                                             | MIM required              |
| Any dependency-direction violation (core importing adapter code)                 | MIM required, block first |
| New third-party dependency in any workspace                                      | MIM required              |

## Non-Deducible Constraints

| Constraint                                                      | Detail                                                                                                                                                                                                                                           |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@profile-data` is not a package                                | It is a tsconfig path alias (see `apps/resume/tsconfig.app.json`) resolving to `packages/profile/profile-snapshot.json`, a generated file, not an npm dependency.                                                                                |
| RAG embedder never ships to apps                                | `src/rag/embedder.ts` loads the all-MiniLM-L6-v2 model (~45MB). Only type-only imports (`ProfileIndex`) may cross into other files — no runtime import from any `apps/*` workspace.                                                              |
| Content uses registry-controlled slugs                          | Files under `packages/profile/content/` reference skill slugs defined in `content/skills-registry.yaml`. An unknown slug throws at parse time, not at build time.                                                                                |
| `profileSchema` vs `profileSnapshotSchema` are different shapes | The description transform (raw strings → `DescriptionBlock[]`) in `src/schema.ts` is one-way and non-idempotent. Re-running `profileSchema.parse()` on already-transformed data fails. Use `profileSnapshotSchema` for pre-parsed/snapshot data. |

## Technical Debt Convention

Source of truth for TD is **source code** (`rg 'TODO: TD-'`), not external trackers.

### Format

```typescript
// TODO: TD-{SCOPE}-{NNN} — one-line description
// CONTEXT: why this is debt right now
// RESOLVE: how to fix it correctly
```

| Rule              | Detail                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------- |
| Line 1            | Mandatory. `rg`-searchable. ID + description.                                            |
| CONTEXT / RESOLVE | Optional — use for non-trivial TD only.                                                  |
| SCOPE             | Workspace: `PROFILE`, `DS`, `RESUME`, `README`                                           |
| Numbering         | Sequential per scope, zero-padded 3 digits                                               |
| On resolution     | **Delete the entire block.** Do not mark "RESOLVED" — that is noise.                     |
| History           | `git blame` has the commit that introduced and resolved each TD. No TICKET field needed. |
