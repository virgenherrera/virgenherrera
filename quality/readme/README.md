> [← Developer Hub](../../CONTRIBUTING.md)

# @vh/quality-readme

Jest integration tests validating the README generation pipeline ([`apps/readme`](../../apps/readme/README.md)). Verifies that `ReadmeService` writes a `README.md` file and that the generated content includes the expected profile data, section headings, featured projects, and language distribution chart.

## Menú

- [Test Suite](#test-suite)
- [Architecture](#architecture)
- [Running Tests](#running-tests)
- [Scripts](#scripts)
- [Workspace Dependencies](#workspace-dependencies)

---

## Test Suite

Single spec file: `src/readme-generation.spec.ts` — 5 integration tests.

The suite bootstraps a NestJS application context, mocks `HttpService.get` to return a fixed list of `GitHubRepo` objects, and calls `ReadmeService.generate()`. File I/O (`writeFileSync`) is also mocked so no files are written to disk during tests.

| Test                                                 | What it asserts                                                             |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| should call writeFileSync with generated markdown    | `writeFileSync` is called exactly once with a path containing `README.md`   |
| should generate markdown containing profile name     | Output contains the full profile name (`Hugo Enrique Virgen Herrera`)       |
| should generate markdown with expected sections      | Output contains `## About`, `## Skills`, and `## Let's Connect` headings    |
| should include mock repo data in featured projects   | Output mentions `nest-base` and `angular-base` from the mocked API response |
| should include language distribution from mock repos | Output contains `TypeScript` and a `pie title` Mermaid chart block          |

[↑ Menú](#menú)

---

## Architecture

```mermaid
graph LR
    mock["HttpService mock\n(fixed GitHubRepo list)"]
    service["ReadmeService\n(apps/readme)"]
    fs["writeFileSync mock\n(no disk I/O)"]
    tests["readme-generation.spec.ts\n5 assertions"]

    mock --> service
    service --> fs
    tests --> service
    tests --> fs
```

`NestFactory.createApplicationContext` starts the full DI graph; `HttpService.get` is spied on after the app boots so all injectable dependencies resolve normally. The mock isolation keeps tests fast and deterministic — no network calls, no file writes.

[↑ Menú](#menú)

---

## Running Tests

```bash
# From this workspace
pnpm run test:unit

# From monorepo root — delegates via --if-present
pnpm run test:unit
```

[↑ Menú](#menú)

---

## Scripts

See [`package.json`](package.json) for available scripts. Echo scripts follow the [quality gates convention](../../docs/quality-gates.md).

[↑ Menú](#menú)

---

## Workspace Dependencies

| Dependency   | Workspace                                            | Role                                    |
| ------------ | ---------------------------------------------------- | --------------------------------------- |
| Tests target | [apps/readme/README.md](../../apps/readme/README.md) | NestJS README generation app under test |

[↑ Menú](#menú)
