# app-readme

Aplicacion standalone de NestJS que genera el `README.md` del perfil de GitHub
a partir de `profile.json`.

No usa nest-commander ni CLI interactivo. Corre una sola vez, genera el archivo
y termina.

## Tabla de contenidos

- [Descripcion](#descripcion)
- [Tech stack](#tech-stack)
- [Arquitectura](#arquitectura)
- [Flujo de datos](#flujo-de-datos)
- [Scripts](#scripts)

## Descripcion

`@virgenherrera/app-readme` es una aplicacion NestJS standalone que genera el
archivo `README.md` de la raiz del monorepo. Usa `NestFactory.createApplicationContext`
para levantar el contenedor de inyeccion de dependencias sin iniciar un servidor
HTTP, ejecuta el pipeline de renderizado y escribe el resultado a disco.

La fuente de verdad es `packages/profile/profile.json`, que contiene los datos
del perfil profesional (nombre, headline, experiencia, skills, links). Estos
datos se combinan con informacion en tiempo real de la API de GitHub (repositorios,
lenguajes, estrellas) para generar un README dinamico con badges, tablas, diagramas
Mermaid y secciones de proyectos destacados.

## Tech stack

| Tecnologia | Uso |
| --- | --- |
| NestJS 11 | Contenedor IoC, inyeccion de dependencias |
| @nestjs/axios | Cliente HTTP para la API de GitHub |
| RxJS | Streams reactivos en las llamadas HTTP |
| Zod 4 | Validacion de respuestas de la API de GitHub |
| tsx | Ejecucion directa de TypeScript sin transpilacion |
| @virgenherrera/profile | Paquete workspace con los datos del perfil |

## Arquitectura

### Arbol de archivos

```text
apps/readme/src/
  main.ts                    # Bootstrap: crea contexto NestJS y ejecuta generate()
  app.module.ts              # Modulo raiz: registra HttpModule y providers
  readme.service.ts          # Orquestador: lee profile, fetcha GitHub, escribe README
  github/
    github.schemas.ts        # Schemas Zod para la respuesta de GitHub API
    github.service.ts        # Servicio: fetch de repos, agregacion de lenguajes
    parse-repo-url.ts        # Utilidad: extrae username de GitHub del package.json
    index.ts                 # Barrel export
  mermaid/
    timeline.ts              # Genera diagrama Mermaid timeline de experiencia laboral
    languages.ts             # Genera diagrama Mermaid pie chart de lenguajes
    index.ts                 # Barrel export
  render/
    render.service.ts        # Servicio: compone todas las secciones del markdown
    sections.ts              # Funciones puras que renderizan cada seccion
```

### Como funciona

1. `main.ts` crea un `ApplicationContext` de NestJS (sin servidor HTTP)
2. Obtiene el `ReadmeService` del contenedor de IoC via `app.get()`
3. `ReadmeService.generate()` orquesta todo el pipeline
4. Al finalizar, cierra el contexto con `app.close()`

### Servicios y responsabilidades

- **ReadmeService** -- Orquestador principal. Lee `profile.json` via el paquete
  `@virgenherrera/profile`, extrae el username de GitHub del `package.json` raiz,
  coordina el fetch de datos y delega el renderizado a `RenderService`.
- **GitHubService** -- Cliente HTTP que consulta la API de GitHub. Usa
  `@nestjs/axios` con RxJS. Filtra repos fork y archivados. Agrega lenguajes.
  Ordena repos por estrellas y fecha de actualizacion. Soporta `GITHUB_TOKEN`
  como variable de entorno para autenticacion.
- **RenderService** -- Compositor de markdown. Recibe el profile, repos y
  lenguajes, invoca funciones puras de `sections.ts` y generadores de diagramas
  Mermaid, y une todo en un string final.

## Flujo de datos

```text
profile.json
    |
    v
getProfile()  ------>  ReadmeService.generate()
                            |
                            |--- parseGitHubUsername(root package.json)
                            |
                            v
                       GitHubService.fetchRepos(username)
                            |
                            |--- Zod valida respuesta de GitHub API
                            |--- Filtra repos (no fork, no archived)
                            |
                            v
                       GitHubService.aggregateLanguages(repos)
                       GitHubService.getTopRepos(repos)
                            |
                            v
                       RenderService.render(profile, topRepos, languages)
                            |
                            |--- renderHeader()       -> badges y titulo
                            |--- renderSummary()      -> seccion About
                            |--- buildTimelineDiagram() -> Mermaid timeline
                            |--- renderSkills()       -> tabla de skills
                            |--- buildLanguagePieChart() -> Mermaid pie chart
                            |--- renderFeaturedProjects() -> tabla de repos
                            |--- renderCTA()          -> links de contacto
                            |--- renderFooter()       -> footer con creditos
                            |
                            v
                       writeFileSync(REPO_ROOT/README.md)
```

## Scripts

| Script | Comando | Descripcion |
| --- | --- | --- |
| start | `tsx src/main.ts` | Ejecuta la generacion del README |
| test:static | `eslint && prettier --check` | Lint y formato del codigo |
| test:types | `tsc --noEmit` | Verificacion de tipos sin emitir |
| test | `test:static + test:types` | Ejecuta todas las verificaciones |
| bumpDependencies | `pnpm dlx npm-check-updates` | Chequea actualizaciones de dependencias |
