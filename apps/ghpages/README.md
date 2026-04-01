# App GHPages

Portfolio SPA de Angular 21 desplegada en GitHub Pages. Aplicacion zoneless con standalone
components, Tailwind CSS v4, `@ngrx/signals` para estado, y prerender estatico para SEO.

## Tabla de contenidos

- [Descripcion](#descripcion)
- [Arquitectura](#arquitectura)
- [Interactive Hero](#interactive-hero)
- [Sistema de privacidad](#sistema-de-privacidad)
- [Generador de PDF](#generador-de-pdf)
- [Estrategia de testing E2E](#estrategia-de-testing-e2e)
- [Scripts](#scripts)
- [Configuracion](#configuracion)

## Descripcion

`@virgenherrera/app-ghpages` es el portfolio personal de Hugo Virgen Herrera. Se construye como
una SPA Angular 21 con las siguientes caracteristicas:

- **Zoneless** -- sin `zone.js`, change detection via signals
- **Standalone components** -- sin `NgModule`, todo autodeclarado
- **Tailwind CSS v4** -- via PostCSS plugin
- **@ngrx/signals** -- store reactivo para el perfil
- **Static prerender** -- `outputMode: "static"` genera HTML en build para SEO
- **GitHub Pages** -- deploy con `baseHref: /virgenherrera/`

## Arquitectura

```text
src/app/
  app.ts                          -- componente raiz
  app.config.ts                   -- configuracion del app (providers)
  app.config.server.ts            -- configuracion server-side
  app.routes.ts                   -- rutas de la app
  app.routes.server.ts            -- rutas para prerender
  app.html                        -- template raiz

  components/
    pdf-button/                   -- boton de descarga PDF (presentational)

  directives/
    scroll-reveal.directive.ts    -- directiva de animacion al hacer scroll

  pages/
    portfolio/                    -- pagina principal del portfolio

  schemas/
    secrets-payload.schema.ts     -- schema Zod para validar el payload privado

  sections/
    about/                        -- seccion "Sobre mi"
    contact/                      -- seccion de contacto
    experience/                   -- seccion de experiencia laboral
    hero/                         -- hero estatico (prerenderizado para SEO)
    interactive-hero/             -- hero interactivo (client-only, canvas 2D)
    projects/                     -- seccion de proyectos

  services/
    pdf-generator.service.ts      -- servicio para generar el CV en PDF (jsPDF)

  stores/
    profile.store.ts              -- signal store con datos del perfil (@ngrx/signals)

  types/
    profile.types.ts              -- tipos TypeScript del perfil
```

### Patron de separacion

- **pages/** -- container components que orquestan secciones
- **sections/** -- bloques visuales del portfolio, cada uno con su template y logica
- **stores/** -- estado reactivo centralizado con `@ngrx/signals`
- **services/** -- logica de negocio (generacion PDF)
- **components/** -- componentes presentacionales reutilizables
- **directives/** -- comportamientos reutilizables (scroll reveal)
- **schemas/** -- validacion de datos con Zod

## Interactive Hero

Seccion full-viewport que funciona como landing interactiva. Se monta exclusivamente en el
cliente (no se prerenderiza) para mantener el HTML estatico limpio para SEO.

### Caracteristicas

- **Canvas 2D con particulas** -- fondo animado con etiquetas de tecnologias flotando
- **Efecto typewriter** -- texto que se escribe letra por letra
- **Fade-out por scroll** -- la seccion se desvanece al scrollear hacia abajo
- **IntersectionObserver** -- monta y desmonta el componente segun visibilidad, liberando
  recursos cuando no esta en pantalla
- **Client-only** -- excluido del prerender, se activa despues del bootstrap de Angular

La inspiracion viene de la energia visual del sitio demo de Zustand: particulas flotantes con
labels tecnologicos sobre un canvas que da vida al landing.

## Sistema de privacidad

Mecanismo de doble vista (publica / privada) basado en el hash de la URL.

### Funcionamiento

1. **Vista publica** (`/`) -- muestra el portfolio con contenido recortado, sin datos de
   contacto privados
2. **Vista privada** (`/#<payload>`) -- el hash contiene un string base64 que codifica un JSON
   con `email` y `phone`
3. El payload se decodifica client-side y se valida con un **schema Zod**
4. Si el payload es valido, se revelan el email, telefono (como link `tel:`) y el boton de
   descarga PDF
5. Si el payload es invalido, se muestra un **snackbar** con el mensaje "Invalid link -- showing
   public version" que se autodismisa despues de unos segundos

### Generacion de links

El script `pnpm generate:link` (via `tsx scripts/generate-link.ts`) genera URLs con el payload
codificado para compartir la vista privada.

## Generador de PDF

Servicio que genera un CV descargable en formato PDF.

- **jsPDF cargado via dynamic import** -- lazy loading para no impactar el bundle inicial
- **Formato ATS-friendly** -- estructura que los sistemas de tracking de aplicantes pueden parsear
- **Texto justificado** -- formato profesional
- **Links clickeables** -- URLs dentro del PDF son interactivos

El boton de descarga solo se habilita en la vista privada (cuando hay payload valido en el hash).

## Estrategia de testing E2E

Los tests E2E estan organizados en 3 suites independientes, cada una con un enfoque distinto.

### Suites

| Suite | Archivo | Que valida | Necesita browser |
|---|---|---|---|
| SEO / Prerender | `e2e/specs/seo-prerender.spec.ts` | HTML estatico prerenderizado tiene meta tags, titulo, secciones, y excluye contenido client-only y datos privados | No (usa `request` API) |
| Interactive Hero | `e2e/specs/interactive-hero.spec.ts` | Ciclo de vida del hero interactivo: mount, canvas, scroll indicator, unmount al scrollear, remount al volver arriba | Si |
| Private View | `e2e/specs/private-view.spec.ts` | Payload hash revela email/phone/PDF, snackbar en payload invalido, autodismiss del snackbar | Si |

### Patrones

- **Page Object Model (POM)** -- `HeroPage` y `PortfolioPage` en `e2e/pages/` encapsulan
  locators y acciones
- **AAA (Arrange-Act-Assert)** -- cada test sigue la estructura de tres fases con comentarios
  explicitos
- **Escenarios tipados** -- `const enum` en `e2e/scenarios.ts` define los nombres de test como
  `SeoScenario`, `HeroScenario`, y `PrivateScenario`, garantizando consistencia y que los
  nombres se inlineen en compile time

### Suite SEO: sin browser

La suite de SEO usa la `request` API de Playwright para hacer un GET al HTML prerenderizado.
No levanta ningun browser -- valida el HTML crudo como lo veria un crawler de buscador.

## Scripts

| Script | Comando | Descripcion |
|---|---|---|
| `start` | `ng serve` | Servidor de desarrollo |
| `build` | `ng build` | Build de produccion (prerender incluido) |
| `watch` | `ng build --watch --configuration development` | Build en modo watch |
| `test:static` | `eslint + prettier --check` | Lint y formato sobre `src/` y `e2e/` |
| `test:e2e` | `ng build --configuration development && playwright test` | Build dev + tests E2E |
| `test` | `test:static + test:e2e` | Pipeline completo de validacion |
| `generate:link` | `tsx scripts/generate-link.ts` | Genera URL con payload privado codificado |
| `serve:ssr` | `http-server dist/app-ghpages/browser -p 8080` | Sirve el build estatico localmente |
| `cleanup` | `rimraf .angular dist test-results playwright-report` | Limpia artefactos de build y test |
| `bumpDependencies` | `pnpm dlx npm-check-updates` | Checkea actualizaciones de dependencias |

## Configuracion

### Tailwind CSS v4

Configurado via `.postcssrc.json` con el plugin `@tailwindcss/postcss`. Tailwind v4 no usa
`tailwind.config.js` -- la configuracion va en el CSS directamente.

### Angular

`angular.json` define el proyecto `app-ghpages` con:

- **outputMode: static** -- prerender de rutas en build time
- **baseHref: /virgenherrera/** -- para GitHub Pages (solo en produccion)
- **Budgets** -- initial bundle max warning 500kB, max error 1.5MB
- **Schematics** -- skipTests en todos los generadores (los tests son E2E con Playwright)

### Playwright

`playwright.config.ts` configura las suites E2E. Los tests corren contra el build estatico
servido con `http-server`.
