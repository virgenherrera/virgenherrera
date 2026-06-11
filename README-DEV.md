# Developer Guide — virgenherrera

> El [README.md](README.md) es **generado automaticamente** por `tools/readme-generator`.
> No lo edites a mano — edita `libs/profile/src/profile.json` y corre `pnpm generate:readme`.

## Tabla de contenidos

- [Arquitectura](#arquitectura)
- [Echo System (OBLIGATORIO)](#echo-system-obligatorio)
- [Setup](#setup)
- [Variables de entorno](#variables-de-entorno)
- [Scripts](#scripts)
- [Supply Chain](#supply-chain)
- [Dependency Management](#dependency-management)
- [Apps](#apps)
- [Tools](#tools)
- [Libs](#libs)
- [Testing](#testing)
- [CI/CD](#cicd)
- [Crear un package nuevo](#crear-un-package-nuevo)
- [Convenciones](#convenciones)
- [Repos de referencia](#repos-de-referencia)

---

## Arquitectura

```text
virgenherrera/
├── .github/
│   ├── actions/setup/          # Composite action (pnpm + node + install)
│   ├── workflows/ci.yml        # Test en PRs a master
│   └── workflows/cd.yml        # Deploy: README + GH Pages en push a master
├── apps/
│   └── ghpages/                # Angular 22 SSR → portfolio prerenderizado
├── libs/
│   ├── profile/                # Source of truth (profile.json + Zod schema)
│   ├── secrets/                # .env validation con Zod
│   └── ui/                     # Component library (directivas, pipes)
├── tools/
│   ├── readme-generator/       # NestJS standalone → genera README.md
│   └── ghpages-e2e/            # Playwright e2e (desacoplado de Angular)
├── .npmrc                      # save-exact, engine-strict, strict-peer-deps
├── .ncurc.json                 # NCU doctor mode config
├── tsconfig.base.json          # TS 6 strict compartido
├── eslint.config.mjs           # ESLint 10 flat config
├── pnpm-workspace.yaml         # Workspace + supply chain controls
└── .env                        # Secrets (gitignored)
```

**Taxonomia**: `apps/` = deployables, `libs/` = codigo compartido, `tools/` = utilidades de generacion/validacion.

**Stack**: Angular 22, TypeScript 6, pnpm 11, Vitest 4, Playwright, NestJS 11 (tools), Zod 4, Tailwind 4.

**Repos hermanos de referencia**: [`nest-base`](../nest-base) (autoritativo para DX/echo system), [`angular-base`](../angular-base).

---

## Echo System (OBLIGATORIO)

> **ESTA SECCION ES LEY. Ningun agente, script o PR puede violar estos principios.**
> El sistema de ecos viene de [nest-base](../nest-base). En caso de duda, nest-base es la referencia autoritativa.

### Principio

El mismo nombre de script **hace eco** en 4 niveles:

```text
NIVEL 1: Package (ejecuta)     → eslintCheck: "eslint 'src/**/*.ts'"
NIVEL 2: Root (orquesta)       → eslintCheck: "pnpm -r run eslintCheck"
NIVEL 3: CI steps (eco)        → - name: eslintCheck
NIVEL 4: Pre-commit (eco)      → lintStaged && test (que llama test:static → eslintCheck)
```

### Reglas

1. **Root NUNCA ejecuta herramientas directamente.** Solo orquesta via `pnpm -r run` o `pnpm --filter`.
2. **Cada package define sus propios scripts.** El root delega, los packages ejecutan.
3. **Deps comunes viven SOLO en root** (typescript, eslint, prettier, zod, vitest). Los packages las usan sin instalarlas.
4. **Configs globales viven en root** (tsconfig.base.json, eslint.config.mjs, .prettierrc). Los packages extienden.
5. **CI step names = script names.** Si el script se llama `securityCheck`, el step se llama `securityCheck`.
6. **Versiones exact-pinned.** Sin `^`, sin `~`. Forzado por `.npmrc` con `save-exact=true`.

### Scripts por nivel

**Root (orquestadores):**

| Script | Comando | Funcion |
|--------|---------|---------|
| `test` | `cleanup → test:static → test:dynamic → test:e2e → build:app` | Pipeline completo |
| `test:static` | `securityCheck → eslintCheck → prettierCheck` | Checks estaticos |
| `test:dynamic` | `pnpm -r run test:dynamic` | Tests reales (vitest, tsc) |
| `test:e2e` | playwright install + ng build + playwright test | E2E contra build |
| `test:doctor` | Igual que `test` | Gate para NCU doctor mode |
| `build:app` | `pnpm run build:ghpages` | Build de produccion |
| `securityCheck` | `pnpm audit --audit-level high` | Audit de seguridad (workspace) |
| `eslintCheck` | `pnpm -r run eslintCheck` | Delega a packages |
| `prettierCheck` | `pnpm -r run prettierCheck` | Delega a packages |

**Cada package (ejecutores):**

| Script | Ejemplo | Funcion |
|--------|---------|---------|
| `eslintCheck` | `eslint 'src/**/*.ts'` | Lint local |
| `prettierCheck` | `prettier --check 'src/**/*.ts'` | Format check local |
| `test:static` | `pnpm run eslintCheck && pnpm run prettierCheck` | Compone los dos anteriores |
| `test:dynamic` | `vitest run` o `tsc --noEmit` | Test real del package |
| `test` | `pnpm run test:static && pnpm run test:dynamic` | Pipeline local |
| `bumpDependencies` | `pnpm dlx npm-check-updates@17` | NCU doctor (local) |

**CI (ecos):**

```yaml
- name: securityCheck       # = pnpm run securityCheck
- name: eslintCheck         # = pnpm run eslintCheck
- name: prettierCheck       # = pnpm run prettierCheck
- name: test:dynamic        # = pnpm run test:dynamic
- name: test:e2e            # = pnpm run test:e2e
- name: build:app           # = pnpm run build:app
```

### Flujo completo

```text
git commit
  └→ pre-commit hook
       ├→ lintStaged (prettier --write + eslint --fix en staged)
       └→ pnpm run test
            ├→ cleanup
            ├→ test:static
            │    ├→ securityCheck (pnpm audit)
            │    ├→ eslintCheck → pnpm -r run eslintCheck
            │    │    ├→ apps/ghpages:     eslint 'src/**/*.ts'
            │    │    ├→ libs/profile:     eslint 'src/**/*.ts'
            │    │    ├→ libs/secrets:     eslint 'src/**/*.ts'
            │    │    ├→ libs/ui:          eslint 'src/**/*.ts'
            │    │    ├→ tools/readme-gen: eslint 'src/**/*.ts'
            │    │    └→ tools/ghpages-e2e:eslint '**/*.ts'
            │    └→ prettierCheck → (mismo patron)
            ├→ test:dynamic → pnpm -r run test:dynamic
            │    ├→ apps/ghpages:     vitest run (48 tests)
            │    ├→ libs/*:           tsc --noEmit
            │    └→ tools/*:          tsc --noEmit
            ├→ test:e2e → playwright install + build + 19 e2e tests
            └→ build:app → ng build (produccion)
```

---

## Setup

### Requisitos

| Herramienta | Version |
|-------------|---------|
| Node.js     | >=24.15.0 <25 |
| pnpm        | >=11.0.0 <12 |

Ambos se validan por `.npmrc` (`engine-strict=true`) y `package.json` (`engines`).

### Instalacion

```bash
git clone git@github.com:virgenherrera/virgenherrera.git
cd virgenherrera
pnpm install
cp .env.example .env  # editar con datos reales
```

---

## Variables de entorno

| Variable | Tipo | Usado por | Descripcion |
|----------|------|-----------|-------------|
| `PROFILE_EMAIL` | email valido | `generate:recruiter-link` | Email en el link de recruiter |
| `PROFILE_PHONE` | string no vacia | `generate:recruiter-link` | Telefono en el link de recruiter |
| `GITHUB_TOKEN` | string opcional | `generate:readme` | GitHub API (mas rate limit) |

---

## Scripts

Ver [Echo System](#echo-system-obligatorio) para la tabla completa de scripts y su jerarquia.

---

## Supply Chain

Configurado en `.npmrc` y `pnpm-workspace.yaml`:

| Control | Valor | Efecto |
|---------|-------|--------|
| `save-exact=true` | `.npmrc` | Todas las deps se instalan sin `^` |
| `engine-strict=true` | `.npmrc` | Aborta install si Node/pnpm no coincide con `engines` |
| `strict-peer-dependencies=true` | `.npmrc` | Falla si peers no se satisfacen |
| `minimumReleaseAge: 1440` | `pnpm-workspace.yaml` | Bloquea packages publicados hace menos de 24h |
| `allowBuilds` | `pnpm-workspace.yaml` | Whitelist de packages con postinstall permitido |
| `auditConfig.ignoreCves` | `pnpm-workspace.yaml` | CVEs ignorados (actualmente vacio) |

---

## Dependency Management

### Bump routine

```bash
pnpm run bumpDependencies
```

Pipeline: `securityFix → ncu@17 (root, doctor mode) → ncu@17 (cada package, doctor mode) → securityFix`

NCU doctor mode prueba cada dep individualmente: bump → `test:doctor` → si falla, revierte.

Configurado en `.ncurc.json` (root y cada package):
- `"doctor": true` — modo doctor activado
- `"doctorTest": "pnpm run test:doctor"` (root) o `"pnpm run test"` (packages)
- `"reject": ["pnpm"]` — pnpm se bumpa via `pnpm run updatePnpm` (`corepack up`)
- `"enginesNode": true` — respeta `engines.node`

### Bump pnpm

```bash
pnpm run updatePnpm   # corepack up — actualiza packageManager con sha512
```

---

## Apps

### apps/ghpages

Angular 22 portfolio prerenderizado para GitHub Pages. Zoneless, standalone, signals nativos.

**Stack**: Angular 22, native signals, Tailwind CSS 4, jsPDF

Ver detalles en el [README de ghpages](apps/ghpages/README.md).

---

## Tools

### tools/readme-generator

NestJS standalone que genera README.md. Usa native `fetch` (Node 24) para la GitHub API, valida con Zod.

**Stack**: NestJS 11, Zod, native fetch

### tools/ghpages-e2e

E2E tests desacoplados de Angular. Corren contra el build estatico via `http-server`.

**Stack**: Playwright, http-server

---

## Libs

### libs/profile

Source of truth del perfil profesional. `profile.json` + Zod schema + `getProfile()`.

### libs/secrets

Lee `.env`, valida con Zod, exporta tipado. `PROFILE_EMAIL` + `PROFILE_PHONE`.

### libs/ui

Component library compartida. `ScrollRevealDirective` + `FormatDatePipe`.

---

## Testing

```bash
pnpm test   # pipeline completo
```

| Package | test:dynamic | Que corre |
|---------|-------------|-----------|
| apps/ghpages | `vitest run` | 48 unit tests |
| libs/* | `tsc --noEmit` | Type checking |
| tools/readme-generator | `tsc --noEmit` | Type checking |
| tools/ghpages-e2e | `tsc --noEmit` | Type checking |
| (root test:e2e) | `playwright test` | 19 e2e tests |

---

## CI/CD

### CI (`ci.yml`)

Trigger: PRs a `master`. Steps son ecos del echo system:

`securityCheck → eslintCheck → prettierCheck → test:dynamic → test:e2e → build:app`

Cada step echa resultado a `$GITHUB_STEP_SUMMARY`. Usa composite action `.github/actions/setup`.

### CD (`cd.yml`)

Trigger: push a `master`. Stages:

1. **test** — mismo pipeline que CI
2. **build** (parallel) — `build-readme` + `build-ghpages`
3. **tag** — `deploy-YYYY-MM-DD-HHMM`
4. **deploy** (parallel) — `deploy-readme` (auto-commit) + `deploy-ghpages` (GitHub Pages)

---

## Crear un package nuevo

### Tool (como tools/readme-generator)

```bash
mkdir -p tools/mi-tool/src
```

`package.json` (OBLIGATORIO seguir echo system):

```json
{
  "name": "@virgenherrera/tool-mi-tool",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "tsx src/main.ts",
    "eslintCheck": "eslint 'src/**/*.ts'",
    "prettierCheck": "prettier --check 'src/**/*.ts'",
    "test:static": "pnpm run eslintCheck && pnpm run prettierCheck",
    "test:dynamic": "tsc --noEmit",
    "test": "pnpm run test:static && pnpm run test:dynamic",
    "bumpDependencies": "pnpm dlx npm-check-updates@17"
  }
}
```

`.ncurc.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/raineorshine/npm-check-updates/main/src/types/RunOptions.json",
  "doctor": true,
  "doctorTest": "pnpm run test",
  "enginesNode": true,
  "format": ["group"],
  "packageManager": "pnpm",
  "upgrade": true
}
```

`tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "rootDir": "./src", "types": ["node"] },
  "include": ["src/**/*.ts"]
}
```

---

## Convenciones

| Regla | Detalle |
|-------|---------|
| TypeScript | strict, zero `any`, TS 6 requiere `types` explicitos en tsconfig |
| Deps | exact-pinned (`save-exact=true`), NUNCA `^` ni `~` |
| Echo system | Scripts con mismos nombres en package → root → CI (ver seccion) |
| Module resolution | `bundler` |
| Package manager | pnpm 11 strict, `packageManager` con sha512 |
| Commits | conventional commits (`tipo(scope): descripcion`) |
| ESM | `"type": "module"` en todos los packages |
| Validacion | Zod 4 para schemas, env vars, API responses |
| Supply chain | 24h quarantine, allowBuilds whitelist, pnpm audit |
| Referencia | nest-base es autoritativo para DX patterns |

---

## Repos de referencia

| Repo | Path | Que tomar |
|------|------|-----------|
| **nest-base** | `../nest-base` | **Autoritativo**: echo system, supply chain, NCU doctor, CI patterns, pre-commit |
| angular-base | `../angular-base` | Angular patterns, Vitest config, budgets (verificar contra nest-base si hay discrepancia) |

> **IMPORTANTE**: Si angular-base y nest-base difieren, nest-base gana. angular-base puede haber sido modificado incorrectamente.

[Volver arriba](#developer-guide--virgenherrera)
