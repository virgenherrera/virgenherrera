# Developer Guide — virgenherrera

> El [README.md](README.md) es **generado automaticamente** por `apps/readme`.
> No lo edites a mano — editá `libs/profile/src/profile.json` y corré `pnpm generate:readme`.

## Tabla de contenidos

- [Arquitectura](#arquitectura)
- [Setup](#setup)
- [Variables de entorno](#variables-de-entorno)
- [Scripts](#scripts)
- [Apps](#apps)
  - [apps/readme](#appsreadme)
  - [apps/ghpages](#appsghpages)
- [Libs](#libs)
  - [libs/profile](#libsprofile)
  - [libs/secrets](#libssecrets)
- [Testing](#testing)
- [CI/CD](#cicd)
- [Crear una app nueva](#crear-una-app-nueva)
- [Convenciones](#convenciones)

---

## Arquitectura

```text
virgenherrera/
├── .github/workflows/
│   ├── ci.yml                # Test en PRs a master
│   └── cd.yml                # Deploy: README + GH Pages en push a master
├── libs/
│   ├── profile/              # Source of truth (profile.json + Zod schema)
│   └── secrets/              # Env validation (.env → Zod → tipado)
├── apps/
│   ├── readme/               # NestJS standalone → genera README.md
│   └── ghpages/              # Angular 21 → portfolio prerenderizado
├── tsconfig.base.json        # TS compartido (strict, bundler, noEmit)
├── eslint.config.mjs         # ESLint flat config (typescript-eslint + prettier)
├── .lintstagedrc.json        # Auto-fix en staged files
├── .husky/pre-commit         # Hook: lint-staged → pnpm test
├── pnpm-workspace.yaml       # Workspace: libs/* + apps/*
└── .env                      # Secrets (gitignored)
```

### Flujo de datos

```text
profile.json ──→ apps/readme ──→ README.md (GitHub profile)
     │
     └─────────→ apps/ghpages ──→ Static HTML (GitHub Pages)
                      │
.env ──→ libs/secrets ──→ generate:recruiter-link ──→ URL con payload base64
                                                         │
                                                         └─→ apps/ghpages decodifica
                                                              email + phone client-side
```

---

## Setup

### Requisitos

| Herramienta | Version |
|-------------|---------|
| Node.js     | >= 24   |
| pnpm        | >= 10   |

### Instalacion

```bash
git clone git@github.com:virgenherrera/virgenherrera.git
cd virgenherrera
pnpm install
cp .env.example .env  # editar con datos reales
```

### Playwright (solo si vas a correr e2e)

```bash
npx playwright install chromium
```

---

## Variables de entorno

El archivo `.env` va en la raiz del repo (gitignored).

| Variable         | Tipo            | Usado por                    | Descripcion                      |
| ---------------- | --------------- | ---------------------------- | -------------------------------- |
| `PROFILE_EMAIL`  | email valido    | `generate:recruiter-link`    | Email en el link de recruiter    |
| `PROFILE_PHONE`  | string no vacia | `generate:recruiter-link`    | Telefono en el link de recruiter |
| `GITHUB_TOKEN`   | string opcional | `generate:readme`            | GitHub API (mas rate limit)      |

`PROFILE_EMAIL` y `PROFILE_PHONE` se validan con Zod via `libs/secrets`.
Estos datos **nunca** se commitean ni se incluyen en el bundle — viajan
codificados en base64 dentro del hash de la URL del recruiter link.

---

## Scripts

### Root

| Script                          | Descripcion                                       |
| ------------------------------- | ------------------------------------------------- |
| `pnpm test`                     | Pipeline completo: cleanup → lint → tests → types |
| `pnpm test:static`              | ESLint + Prettier check                           |
| `pnpm test:types`               | `tsc --noEmit` en todos los packages              |
| `pnpm generate:readme`          | Genera README.md desde profile + GitHub API       |
| `pnpm generate:all`             | Corre todas las apps                              |
| `pnpm generate:recruiter-link`  | Genera URL con secrets encoded para recruiters    |
| `pnpm build:ghpages`            | Build prerenderizado del portfolio                |
| `pnpm cleanup`                  | Borra `coverage/`                                 |

### Scripts de apps/ghpages

| Script          | Descripcion                                                        |
| --------------- | ------------------------------------------------------------------ |
| `start`         | `ng serve` (dev server con HMR)                                    |
| `build`         | `ng build` (prerender estatico)                                    |
| `test`          | lint → build → e2e (Playwright)                                    |
| `test:static`   | ESLint + Prettier en `src/` y `e2e/`                               |
| `test:e2e`      | Build + Playwright tests                                           |
| `serve:ssr`     | Sirve el build estatico con http-server                            |
| `cleanup`       | Borra `.angular/`, `dist/`, `test-results/`, `playwright-report/`  |
| `generate:link` | Genera recruiter URL desde `.env`                                  |

### Scripts de apps/readme

| Script        | Descripcion                       |
| ------------- | --------------------------------- |
| `start`       | NestJS standalone → genera README |
| `test:static` | ESLint + Prettier                 |
| `test:types`  | `tsc --noEmit`                    |
| `test`        | lint + types                      |

---

## Apps

### apps/readme

NestJS standalone app (`NestFactory.createApplicationContext`). Lee `libs/profile`,
consulta la GitHub API via `@nestjs/axios` + RxJS, valida con Zod, genera mermaid
diagrams (timeline + pie chart), y escribe `README.md`.

**Stack**: NestJS, @nestjs/axios, RxJS, Zod

Ver detalles en el [README del proyecto](apps/readme/README.md).

### apps/ghpages

Angular 21 portfolio prerenderizado para GitHub Pages.
Ver detalles en el [README de ghpages](apps/ghpages/README.md).

**Stack**: Angular 21, @ngrx/signals, Tailwind CSS v4, jsPDF, Playwright

**Caracteristicas**:

- **Zoneless** — `provideZonelessChangeDetection()` (sin zone.js)
- **Prerender** — Solo `/` se prerenderiza (HTML estatico)
- **Privacy gate** — URL con hash base64 revela email + telefono
- **Dark/Light toggle** — Class-based con Tailwind `@custom-variant dark`
- **PDF resume** — jsPDF genera PDF ATS-friendly con texto real justificado
- **Tailwind v4** — Requiere `.postcssrc.json` (Angular no lo detecta automaticamente)
- **Scroll reveal** — `ScrollRevealDirective` con IntersectionObserver (cada item individualmente)
- **Lazy hydration** — `@defer (on viewport)` para experience y projects
- **Public/Private views** — public trimmed (2 oraciones, 150 chars), private completo con fade-in
- **FAB CTA** — boton flotante LinkedIn en vista publica (aparece tras scroll)

**Formato de descriptions** (`profile.json`):

```json
"description": [
  "Parrafo introductorio del rol.",
  "*Logro 1 con metricas cuantificables.",
  "*Logro 2 con impacto tecnico.",
  "Parrafo de cierre opcional."
]
```

Items con `*` se renderizan como bullets, sin `*` como parrafos.

**Privacidad via URL**:

```bash
# Generar link para recruiters
pnpm generate:recruiter-link

# Resultado ejemplo:
# https://virgenherrera.github.io/virgenherrera/#eyJlbWFp...
```

El hash contiene `{ email, phone }` en base64. El `ProfileStore` decodifica,
valida con Zod, y revela los datos. Hash invalido → snackbar + vista publica.

**E2E tests** (Playwright):

```text
e2e/
├── scenarios.ts              # Const enums: SeoScenario, HeroScenario, PrivateScenario
├── pages/
│   ├── hero.page.ts          # POM del hero interactivo (canvas, scroll helpers)
│   └── portfolio.page.ts     # POM del portfolio (secciones, contacto, navegacion)
└── specs/
    ├── seo-prerender.spec.ts # SEO: HTML crudo sin JS (como un crawler)
    ├── interactive-hero.spec.ts # Hero: lifecycle client-only (mount/unmount/canvas)
    └── private-view.spec.ts  # Privacidad: payload base64, email, phone, snackbar
```

Los e2e estan divididos en **3 suites alineadas a la arquitectura**:

| Suite | Archivo | Que valida |
| ----- | ------- | ---------- |
| SEO / Prerender | `seo-prerender.spec.ts` | HTML prerenderizado es SEO-ready. Usa `request` API (HTTP GET crudo, sin JS) para simular un crawler. Valida meta tags, titulo, secciones, y que NO haya contenido client-only ni datos privados |
| Interactive Hero | `interactive-hero.spec.ts` | Lifecycle del hero interactivo (solo existe en browser). Mount post-bootstrap, canvas, scroll indicator, unmount via IntersectionObserver, remount al volver |
| Private View | `private-view.spec.ts` | Sistema de privacidad via hash base64. Email/phone revelados, boton PDF habilitado, snackbar en hash invalido, auto-dismiss del snackbar |

**Patrones**:

- **POM (Page Object Model)**: `PortfolioPage` y `HeroPage` con getter-based locators
- **AAA (Arrange, Act, Assert)**: Todos los tests siguen este patron con comentarios explicitos
- **Const enum scenarios**: Centralizados en `e2e/scenarios.ts` — los tests se leen como `test(Scenario.Name, ...)`
- **Scroll helpers**: `scrollToPortfolio()`, `scrollToContact()` en PortfolioPage; `scrollPastHero()`, `scrollToTop()` en HeroPage — scroll basado en elementos, no pixeles arbitrarios

Reportes: HTML (`playwright-report/`) + JUnit XML (`test-results/junit.xml`).

---

## Libs

### libs/profile

Source of truth del perfil profesional.

- `profile.json` — datos publicos (nombre, headline, experiencia, skills)
- `schema.ts` — Zod schema que valida e infiere tipos
- `getProfile()` — lee + valida + retorna tipado

**Importante**: `getProfile()` usa `readFileSync` — solo funciona en Node.js.
Para Angular (browser), importar `profile.json` directo con `resolveJsonModule`.

Ver detalles en el [README de profile](libs/profile/README.md).

### libs/secrets

Lee `.env`, valida con Zod, exporta tipado.

- `PROFILE_EMAIL` + `PROFILE_PHONE`
- `getSecrets(envPath?)` — valida y retorna o tira error descriptivo

Ver detalles en el [README de secrets](libs/secrets/README.md).

---

## Testing

### Pipeline completo

```bash
pnpm test
```

Ejecuta en orden: cleanup → eslint + prettier → tests por package → tsc types.

Cada package define su propio `test` script:

| Package      | Pipeline                              |
| ------------ | ------------------------------------- |
| libs/*       | `test:static` → `test:types`          |
| apps/readme  | `test:static` → `test:types`          |
| apps/ghpages | `test:static` → `build` → `test:e2e`  |

### Pre-commit hook

Husky intercepta cada commit:

1. **lint-staged** — prettier + eslint --fix en staged files
2. **pnpm test** — pipeline completo

Si falla, el commit se bloquea.

---

## CI/CD

### CI (`ci.yml`)

- **Trigger**: PRs a `master`
- **Que hace**: pnpm install → Playwright install → `pnpm test`
- **Artifacts**: Playwright report en caso de fallo

### CD (`cd.yml`)

- **Trigger**: push a `master`
- **Jobs**:
  1. **test** — mismo pipeline que CI
  2. **generate-readme** — genera y auto-commitea README.md (si cambió)
  3. **deploy-ghpages** — build + deploy via `actions/deploy-pages`

**Nota**: habilitar Pages en repo settings → Source: GitHub Actions.

---

## Crear una app nueva

### tsx app (como apps/readme)

```bash
mkdir -p apps/mi-app/src
```

`package.json`:

```json
{
  "name": "@virgenherrera/app-mi-app",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "tsx src/main.ts",
    "test:static": "eslint 'src/**/*.ts' && prettier --check 'src/**/*.ts'",
    "test:types": "tsc --noEmit",
    "test": "pnpm run test:static && pnpm run test:types"
  },
  "dependencies": {
    "@virgenherrera/profile": "workspace:*"
  }
}
```

`tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "rootDir": "./src" },
  "include": ["src/**/*.ts"]
}
```

### Angular app (como apps/ghpages)

```bash
pnpm dlx @angular/cli@latest new mi-app --directory apps/mi-app --package-manager pnpm --ssr --skip-git --skip-tests
```

Post-scaffold:

1. Renombrar package a `@virgenherrera/app-mi-app`
2. tsconfig.json extiende `../../tsconfig.base.json`
3. tsconfig.app.json agrega `noEmit: false`, `allowImportingTsExtensions: false`
4. Crear `.postcssrc.json` para Tailwind
5. Crear `eslint.config.mjs` local (root ignora apps/ghpages/)
6. Agregar scripts estandar: `test:static`, `test:e2e`, `test`, `cleanup`

---

## Convenciones

| Regla | Detalle |
|-------|---------|
| TypeScript | strict, cero `any` |
| Module resolution | `bundler` (unificado para tsx + Angular) |
| Package manager | pnpm strict |
| Commits | conventional commits (`tipo(scope): descripcion`) |
| ESM | `"type": "module"` en todos los packages |
| Validacion | Zod 4 para schemas, env vars, API responses |
| Datos sensibles | `.env` gitignored, nunca en JSON ni en el bundle |
| E2E | Playwright con POM (getter locators) + AAA pattern |
| CI/CD | GitHub Actions (ci.yml para PRs, cd.yml para deploy) |

[Volver arriba](#developer-guide--virgenherrera)
