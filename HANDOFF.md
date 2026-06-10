# HANDOFF: Refactoring del Monorepo virgenherrera

> **ARCHIVO AUTO-DESTRUCTIBLE**: Cuando todas las fases estén completadas y verificadas, eliminá este archivo con `git rm HANDOFF.md` y commiteá: `chore: remove HANDOFF.md — refactoring complete`. Este archivo NO debe llegar a producción.

## Identidad del Agente

Sos Senku Ishigami. Senior Architect con 15+ años de experiencia. Este monorepo es TU proyecto — ownership al 10 mil millones por ciento. Cada decisión que tomes debe estar respaldada por evidencia y razonamiento técnico. La ciencia nunca miente.

Leé el `CLAUDE.md` de este proyecto ANTES de hacer cualquier cosa. Tu personalidad, lenguaje y reglas están ahí.

## Contexto del Proyecto

**virgenherrera** es un monorepo de portfolio personal desplegado a GitHub Pages. Genera automáticamente el README.md del perfil de GitHub y sirve un sitio Angular con SSR.

### Stack Actual

| Componente | Tecnología | Versión |
|---|---|---|
| Package manager | pnpm workspaces | 10.33.0 |
| Runtime | Node | >=24 |
| Frontend | Angular + SSR | 21.2 |
| State | ngrx/signals | 21.1 |
| Styling | Tailwind CSS | 4.2 |
| Validation | Zod | 4.3 |
| PDF | jsPDF | 4.2 |
| E2E | Playwright | 1.52 |
| Unit tests | Vitest | 3.1 (configurado, sin tests) |
| TypeScript | strict | 5.9.2 |
| Linting | ESLint + Prettier | 9 / 3 |
| README gen | NestJS CLI | 11 |

### Estructura Actual (la que hay que cambiar)

```text
virgenherrera/
  apps/
    ghpages/    → Angular 21 SSR app (portfolio + PDF resume + e2e acoplados)
    readme/     → NestJS CLI (genera README.md) — NO es un app, es una herramienta
  libs/
    profile/    → profile.json + Zod schema (fuente de verdad)
    secrets/    → .env validation con Zod
```

### Estructura Objetivo

```text
virgenherrera/
  apps/
    ghpages/              → ÚNICO deliverable: Angular SSR app (portfolio + PDF)
  libs/
    profile/              → profile.json + Zod schema (fuente de verdad)
    secrets/              → .env validation con Zod
    ui/                   → Component library + Storybook (NUEVO)
  tools/
    readme-generator/     → Movido de apps/readme — crawlea GitHub API, genera README.md
    ghpages-e2e/          → Movido de apps/ghpages/e2e/ — Playwright desacoplado de Angular
```

**Taxonomía del monorepo**:
- **`apps/`** = solo lo que produce outputs deployables (el sitio Angular)
- **`libs/`** = código compartido, fuente de verdad, componentes reutilizables
- **`tools/`** = utilidades que generan artefactos o validan (README generator, e2e)

### Entregables Actuales (NO romper ninguno)

1. **GitHub Pages**: sitio Angular SSR con portfolio, experiencia, proyectos, educación, contacto
2. **README.md auto-generado**: perfil de GitHub con stats, repos destacados, lenguajes
3. **PDF resume**: descarga de CV en PDF desde el sitio (jsPDF)
4. **E2E tests**: SEO, vista privada (email/phone reveal), hero interactivo
5. **CI**: tests en PR. **CD**: test -> build (parallel) -> tag -> deploy (parallel)

## Diagnóstico (Score Actual: 7.9/10)

### Lo que está bien hecho

- Arquitectura standalone + signals + zoneless change detection
- Zod schemas en todas las fronteras de datos
- TypeScript strict con noUncheckedIndexedAccess
- ProfileStore con ngrx/signals y computed properties
- E2E con Playwright y Page Object Model
- SSR-aware con isPlatformBrowser checks
- Canvas particle system con cleanup correcto
- Deferred blocks para lazy loading

### Lo que necesita refactoring

| Gap | Severidad | Detalle |
|---|---|---|
| Estructura de carpetas no refleja responsabilidades | Alta | `apps/readme` es una herramienta, no un app. E2E acoplados a Angular. |
| Cero unit tests (solo e2e) | Alta | ProfileStore, PdfGeneratorService, FormatDatePipe, ScrollRevealDirective |
| E2E acoplados a Angular internals | Alta | Deberían ser black-box contra el build de producción |
| Magic numbers dispersos | Media | stores/, sections/interactive-hero/, pages/portfolio/ |
| PdfGeneratorService con estado mutable | Media | services/pdf-generator.service.ts |
| No component library ni Storybook | Media | Componentes reusables viven dentro del app |
| CI sin npm Dependabot | Baja | .github/dependabot.yml |
| No changelog automático | Baja | .github/workflows/cd.yml |

## Repos de Referencia

Usá estos repos como ejemplo de DX, CI y convenciones. Están en el mismo directorio padre:

- **`../nest-base`** — Echo system en CI, centralización de Node version, dependency bump workflow, testing patterns
- **`../angular-base`** — Angular 22, CI patterns, securityCheck, pnpm 11, performance budgets

Cuando necesites un patrón o convención, buscá primero en estos repos. Si el patrón existe ahí, adaptalo. No inventes de cero.

## Plan de Ejecución

### Fase 1 — Restructuración del Monorepo ✅ COMPLETADA

**Branch**: `refactor/phase-1-structure` → mergeado en `refactor/phase-2-foundation`

**Tareas**:

1. ~~**Crear directorio `tools/`**~~ ✅

2. ~~**Mover `apps/readme/` a `tools/readme-generator/`**~~ ✅
   - ~~Actualizar `package.json` name a `@virgenherrera/tool-readme-generator`~~
   - ~~Actualizar imports relativos internos (REPO_ROOT paths)~~
   - ~~Actualizar scripts del root `package.json` (`generate:readme`, `generate:all`)~~
   - ~~Actualizar CD workflow (`build-readme` job paths)~~

3. ~~**Mover `apps/ghpages/e2e/` a `tools/ghpages-e2e/`**~~ ✅
   - ~~Crear `tools/ghpages-e2e/package.json`~~ ✅
   - ~~Mover `apps/ghpages/playwright.config.ts` a `tools/ghpages-e2e/`~~ ✅
   - ~~Configurar `webServer` para simular GitHub Pages~~ ✅
   - ~~Build de producción ANTES de correr e2e (root `test:e2e`)~~ ✅
   - **Nota**: se usa `ng build --base-href /` para e2e (producción usa `/virgenherrera/`)

4. ~~**Reestructurar los e2e specs en suites claras**~~ ✅
   - ~~`prerender.spec.ts` con validación contra `@virgenherrera/profile`~~ ✅
   - ~~`private-view.spec.ts` (hash válido/inválido, snackbar, PDF)~~ ✅
   - ~~`interactive.spec.ts` (canvas, scroll, mount/unmount)~~ ✅
   - ~~`helpers/` con Page Objects reutilizables~~ ✅

5. ~~**Actualizar `pnpm-workspace.yaml`**~~ ✅

6. ~~**Limpiar `apps/ghpages/`**~~ ✅
   - ~~Eliminar `e2e/`, `playwright.config.ts`, `tsconfig.e2e.json`~~ ✅
   - ~~Eliminar Playwright + http-server de devDependencies~~ ✅
   - ~~Eliminar scripts de e2e~~ ✅

7. ~~**Actualizar CI/CD workflows**~~ ✅

8. ~~**Actualizar root `package.json` scripts**~~ ✅

**Quality Gate**: ✅ TODO PASA
- ~~`pnpm install` sin errores~~ ✅
- ~~`pnpm run test` pasa (incluyendo e2e desacoplados)~~ ✅ (19 e2e + 67 unit)
- ~~`pnpm run build:ghpages` genera output~~ ✅
- ~~`pnpm run generate:readme` funciona desde la nueva ubicación~~ ✅

### Fase 2 — Foundation: Testing y Constantes ✅ COMPLETADA

**Branch**: `refactor/phase-2-foundation`

**Tareas**:

1. ~~**Configurar Vitest para unit tests**~~ ✅
   - ~~`vitest.config.ts` en root y en `apps/ghpages/`~~ ✅
   - ~~`tsconfig.spec.json` para que ESLint reconozca specs~~ ✅
   - ~~`happy-dom` para tests que necesitan DOM~~ ✅
   - Setup file para Angular TestBed no fue necesario — tests cubren funciones puras y comportamiento extraído

2. ~~**Unit tests para ProfileStore**~~ ✅ (14 tests)
   - ~~Test computed properties (summary trimming, experience filtering)~~ ✅
   - ~~Test private view toggle (hash decode + state validation)~~ ✅
   - Snackbar auto-dismiss: la lógica del `setTimeout` vive dentro del hook `onInit` de ngrx/signals (requiere Angular DI). Se testeó `decodeHashPayload` y las funciones puras extractadas.

3. ~~**Unit tests para PdfGeneratorService**~~ ✅ (34 tests)
   - ~~Mock jsPDF~~ ✅
   - ~~Test layout calculations, page breaks, date formatting~~ ✅

4. ~~**Unit tests para FormatDatePipe y ScrollRevealDirective**~~ ✅ (19 tests)
   - ~~Pipe: YYYY-MM → MMM YYYY, null → Present~~ ✅ (9 tests)
   - ~~Directive: IntersectionObserver trigger + style toggle + SSR~~ ✅ (10 tests, testeado via behavioral proxy)

5. ~~**Centralizar magic numbers**~~ ✅
   - ~~`constants/profile.constants.ts`~~ ✅ (SUMMARY_SENTENCES, DESCRIPTION_MAX_LENGTH, MAX_TECHNOLOGIES, SNACKBAR_DISMISS_MS)
   - ~~`constants/particles.constants.ts`~~ ✅ (CONNECTION_DISTANCE, DOT_COUNTs, typewriter speeds, etc.)
   - ~~`constants/scroll.constants.ts`~~ ✅ (FAB_SCROLL_THRESHOLD, HERO_UNMOUNT_THRESHOLD)
   - ~~`constants/index.ts` barrel export~~ ✅

6. ~~**Habilitar npm Dependabot**~~ ✅

**Quality Gate**: ✅ `pnpm run test` pasa — 67 unit tests + 19 e2e + lint + types.

### Fase 3 — Component Library + Storybook (Branch: `refactor/phase-3-ui-library`)

**Objetivo**: Crear `libs/ui` con componentes extraídos y Storybook.

**Tareas**:

1. **Crear `libs/ui/` package**
   - `package.json` con nombre `@virgenherrera/ui`
   - Exports: componentes, directivas, pipes
   - devDependency: `storybook`, `@storybook/angular`

2. **Extraer componentes reusables**
   - `ScrollRevealDirective` -> `libs/ui/src/directives/`
   - `FormatDatePipe` -> `libs/ui/src/pipes/`
   - Evaluar si `PdfButtonComponent` es genérico o específico

3. **Setup Storybook 9**
   - Verificar compatibilidad con Angular 21+ SSR y zoneless
   - Configurar `.storybook/` dentro de `libs/ui/`
   - Stories para cada componente/directiva/pipe extraído
   - Consultar `../angular-base` por si ya tiene Storybook configurado

4. **Actualizar imports en apps/ghpages**
   - Reemplazar imports locales por `@virgenherrera/ui`
   - Verificar que e2e tests siguen pasando

5. **CI step para Storybook**
   - Build de Storybook en CI (validate que compila)
   - Opcional: deploy de Storybook como sub-path o en GitHub Pages separado

**Quality Gate**: E2E tests pasan sin cambios. Storybook se construye sin errores. Stories renderizan correctamente.

### Fase 4 — Refactoring & Patterns (Branch: `refactor/phase-4-patterns`)

**Objetivo**: Refactorizar código con deuda técnica y actualizar Angular + dependencias.

**Tareas**:

1. **Refactorizar PdfGeneratorService**
   - Reemplazar estado mutable (`this.y`, `this.doc`) por builder pattern o accumulator
   - Cada método recibe y retorna un `PdfRenderContext`
   - Más testeable, más funcional

2. **Evaluar NestJS en tools/readme-generator**
   - Si NO se planean más CLIs: reemplazar por plain Node + dependency passing
   - Si se planean más CLIs: mantener NestJS pero documentar la decisión
   - **PREGUNTARLE AL USUARIO antes de ejecutar**

3. **Consolidar scroll animation logic**
   - `PortfolioPage` y `InteractiveHeroSection` tienen scroll handling duplicado
   - Extraer a un servicio compartido o custom signal/directive en `libs/ui`

4. **Extraer `decodeHashPayload`**
   - Mover a utility module independiente del store
   - Unit test dedicado

5. **Dynamic import de jsPDF**
   - Importar jsPDF solo cuando el usuario hace click en el botón PDF
   - Reduce bundle size inicial
   - Verificar que SSR no intente importar jsPDF

6. **Bump Angular y dependencias**
   - Verificar si Angular 22 está disponible y es compatible
   - Consultar `../angular-base` como referencia del upgrade (ya está en Angular 22, pnpm 11)
   - Bump pnpm a 11.x
   - Bump TypeScript según compatibilidad con Angular target

**Quality Gate**: Todos los tests pasan. Bundle size no aumenta. E2E funciona. PDF se genera correctamente.

### Fase 5 — DX & CI/CD Polish (Branch: `refactor/phase-5-dx`)

**Objetivo**: Alinear DX con nest-base y angular-base.

**Tareas**:

1. **Echo system en CI**
   - Consultar `../nest-base/.github/` por el patrón de echo system
   - Los step names del CI DEBEN coincidir con los scripts de package.json
   - Aplicar el mismo patrón

2. **Changelog automático en CD**
   - Agregar generación de CHANGELOG.md en el pipeline de CD
   - Basado en conventional commits

3. **Performance budgets**
   - Agregar budget check para bundle size en CI
   - Consultar `../angular-base/angular.json` por configuración de budgets

4. **Pre-push validation**
   - Verificar que `pnpm run test` corre antes de push
   - Consultar `.husky/` actual y alinear con nest-base

5. **Centralizar Node version**
   - Consultar cómo lo hace nest-base (package.json como fuente de verdad)
   - Aplicar el mismo patrón si aplica

**Quality Gate**: CI pipeline completo pasa. Todos los scripts del echo system coinciden. No hay regresiones en CD.

## Instrucciones de Orquestación

Cada fase es un PR independiente. Usá sub-agentes para paralelizar trabajo dentro de cada fase cuando las tareas sean independientes.

### Patrón de delegación

```text
Fase 1 (Restructuración):
  - Agente 1: Mover apps/readme -> tools/readme-generator + actualizar paths
  - Agente 2: Mover apps/ghpages/e2e -> tools/ghpages-e2e + configurar webServer
  - Agente 3: Reestructurar e2e specs en suites (prerender, private, interactive)
  - (inline): Actualizar pnpm-workspace.yaml, root scripts, CI/CD

Fase 2 (Foundation):
  - Agente 1 (parallel): Configurar Vitest + unit tests para ProfileStore
  - Agente 2 (parallel): Unit tests para PdfGeneratorService
  - Agente 3 (parallel): Unit tests para FormatDatePipe + ScrollRevealDirective
  - Agente 4 (parallel): Centralizar magic numbers
  - (inline): Habilitar npm Dependabot

Fase 3 (UI Library):
  - Agente 1 (sequential): Crear libs/ui scaffold + extraer componentes
  - Agente 2 (sequential, después de 1): Setup Storybook + stories
  - (inline): Actualizar CI

Fase 4 (Refactoring):
  - Agente 1: Refactorizar PdfGeneratorService
  - Agente 2: Consolidar scroll logic + extraer decodeHashPayload
  - Agente 3: Dynamic import de jsPDF
  - Agente 4: Bump Angular + dependencias (consultar angular-base primero)
  - (manual): Evaluar NestJS con el usuario

Fase 5 (DX):
  - Agente único: Aplicar DX patterns de nest-base y angular-base
```

### Reglas para sub-agentes

1. Cada sub-agente recibe como contexto: este HANDOFF.md + los archivos específicos que necesita
2. Cada sub-agente DEBE correr `pnpm run test` antes de reportar como completado
3. Ningún sub-agente modifica archivos fuera de su scope asignado
4. Si un sub-agente encuentra un conflicto con otro, reporta y espera resolución
5. Los sub-agentes hablan en español rioplatense (Senku) en sus reportes

### Validación entre fases

Antes de pasar a la siguiente fase:

1. `pnpm install` sin errores
2. `pnpm run test` pasa sin errores (unit + e2e)
3. `pnpm run build:ghpages` genera output en `apps/ghpages/dist/`
4. `pnpm run generate:readme` funciona correctamente
5. Git status limpio (todo commiteado)
6. Review manual del diff total de la fase

## Pre-vuelo

Antes de arrancar cualquier fase, ejecutá esto para que la laptop no se duerma durante el trabajo:

```bash
caffeinate -dims &
```

Flags: `-d` previene display sleep, `-i` previene idle sleep, `-m` previene disk sleep, `-s` previene system sleep. El `&` lo manda a background. Se muere solo cuando termina la sesión de terminal.

## Notas Finales

- **NUNCA** agregar `Co-Authored-By` ni atribución de IA en commits
- **SIEMPRE** presentar el mensaje de commit al usuario ANTES de commitear
- **NUNCA** usar `cat`/`grep`/`find`/`sed`/`ls` — usar `bat`/`rg`/`fd`/`sd`/`eza`
- **NUNCA** usar `gh` CLI — no está autenticado
- Commits en formato conventional: `type(scope): title`
- Pre-push: correr `pnpm run test` antes de pushear (excepto archivos .md, .github/, .vscode/, .claude/, .husky/)
- Source of truth del perfil: `libs/profile/src/profile.json`

---

*Exactamente como lo calculé. La ciencia nunca miente — 10 mil millones por ciento.*
