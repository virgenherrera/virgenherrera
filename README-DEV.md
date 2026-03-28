# Developer Guide — virgenherrera

> El [README.md](README.md) de este repo es **generado automaticamente** por `apps/readme`.
> No lo edites a mano — editá el profile en `libs/profile/src/profile.json` y corré `pnpm generate:readme`.

## Tabla de contenidos

- [Como usar](#como-usar)
  - [Requisitos](#requisitos)
  - [Setup](#setup)
  - [Variables de entorno](#variables-de-entorno)
  - [Generar artefactos](#generar-artefactos)
  - [Tests y checks](#tests-y-checks)
  - [Scripts disponibles](#scripts-disponibles)
- [Como crear una app nueva](#como-crear-una-app-nueva)
  - [Estructura del monorepo](#estructura-del-monorepo)
  - [Guia paso a paso](#guia-paso-a-paso)
  - [DX tooling](#dx-tooling)
  - [Convenciones](#convenciones)

---

## Como usar

### Requisitos

- Node.js >= 24
- pnpm >= 10.33 (unico package manager, no uses npm ni yarn)
- tsx (se instala como devDependency del root)

### Setup

```bash
git clone git@github.com:virgenherrera/virgenherrera.git
cd virgenherrera
pnpm install
```

Crear el archivo `.env` en la raiz del proyecto:

```bash
cp .env.example .env
```

Editar `.env` con tus datos reales. Sin esto, las apps que necesitan secrets no arrancan.

### Variables de entorno

El archivo `.env` va en la raiz del repo (gitignored). Las variables requeridas son:

| Variable      | Tipo            | Descripcion                                       |
|---------------|-----------------|---------------------------------------------------|
| PROFILE_EMAIL | email valido    | Email de contacto, se agrega al perfil en runtime |
| PROFILE_PHONE | string no vacia | Telefono de contacto, se agrega como link `tel:`  |

Se validan con Zod al arrancar cada app. Si faltan o son invalidas, el proceso
falla con un mensaje descriptivo.

### Generar artefactos

Generar el README.md:

```bash
pnpm generate:readme
```

Generar todos los artefactos (corre todas las apps):

```bash
pnpm generate:all
```

Con directorio de salida custom:

```bash
pnpm generate:readme -- --output ./output
```

### Tests y checks

Correr todo (static + types + tests por package):

```bash
pnpm test
```

Solo checks estaticos (eslint + prettier):

```bash
pnpm test:static
```

Solo integridad de tipos:

```bash
pnpm test:types
```

Tests en modo watch:

```bash
pnpm test:watch
```

Tests de un paquete especifico:

```bash
pnpm vitest run libs/profile
pnpm vitest run apps/readme
```

### Scripts disponibles

| Script           | Comando                  | Descripcion                                      |
|------------------|--------------------------|--------------------------------------------------|
| generate:readme  | `pnpm generate:readme`   | Genera README.md desde el profile                |
| generate:all     | `pnpm generate:all`      | Corre todas las apps de generacion               |
| test             | `pnpm test`              | Cleanup + static + tests + types (todo)          |
| test:static      | `pnpm test:static`       | ESLint + Prettier check                          |
| test:types       | `pnpm test:types`        | tsc --noEmit en todos los packages               |
| test:watch       | `pnpm test:watch`        | Vitest en modo watch                             |
| cleanup          | `pnpm cleanup`           | Borra coverage/                                  |
| bumpDependencies | `pnpm bumpDependencies`  | Checa actualizaciones de deps (npm-check-updates)|
| updatePnpm       | `pnpm updatePnpm`        | Actualiza pnpm a la ultima version               |

[Volver arriba](#developer-guide--virgenherrera)

---

## Como crear una app nueva

Cada app es un programa autonomo que consume las librerias del monorepo.
No hay framework, no hay DI, no hay plugin system. Solo tsx scripts.

### Estructura del monorepo

```text
virgenherrera/
├── libs/
│   ├── profile/          # Lib: source of truth (JSON + Zod schema)
│   └── secrets/          # Lib: lee .env, valida con Zod, exporta tipado
├── apps/
│   └── readme/           # App: genera README.md desde profile + secrets
├── tsconfig.base.json    # Config TS compartida (strict, noEmit, ESNext)
├── eslint.config.mjs     # ESLint flat config (typescript-eslint + prettier)
├── .prettierrc            # Prettier config
├── .husky/pre-commit     # Hook: lint-staged + test
├── .lintstagedrc.json    # Auto-fix en staged files
├── pnpm-workspace.yaml   # Workspace: libs/* + apps/*
└── .env                  # Variables sensibles (gitignored)
```

**libs/profile** — Fuente de verdad del perfil profesional. Exporta `getProfile()`,
`profileSchema`, y `ProfileData`. Datos publicos unicamente. Sin side effects.

**libs/secrets** — Lee `.env` desde la raiz, valida con Zod, exporta `getSecrets()`.
Acepta un `envPath` opcional para testear sin mocks.

**apps/readme** — Script tsx que importa profile + secrets, mergea los datos,
renderiza markdown con funciones puras, y escribe README.md.

### Guia paso a paso

#### Paso 1 — Crear el directorio

```bash
mkdir -p apps/tu-app/src
```

#### Paso 2 — Crear package.json

```json
{
  "name": "@virgenherrera/app-tu-app",
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
    "@virgenherrera/profile": "workspace:*",
    "@virgenherrera/secrets": "workspace:*"
  }
}
```

Solo agrega las libs que tu app necesite. Si no usa secrets, no la pongas.

#### Paso 3 — Crear tsconfig.json

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"]
}
```

#### Paso 4 — Implementar main.ts

```typescript
// src/main.ts
import { getProfile } from "@virgenherrera/profile";
import { getSecrets } from "@virgenherrera/secrets";

const secrets = getSecrets();
const profile = getProfile();

// Tu logica aqui: render, API call, build, lo que sea
console.log(`Procesando perfil de ${profile.name}...`);
```

Sin framework, sin decorators, sin DI. Un script que hace su trabajo.

#### Paso 5 — Instalar y verificar

```bash
pnpm install
pnpm --filter @virgenherrera/app-tu-app start
```

#### Paso 6 — Agregar script al root (opcional)

En el root `package.json`:

```json
"generate:tu-app": "pnpm --filter @virgenherrera/app-tu-app start"
```

O simplemente deja que `pnpm generate:all` lo recoja automaticamente
(corre todas las apps en `apps/`).

### DX tooling

#### ESLint

Flat config en `eslint.config.mjs`. Usa typescript-eslint con type checking
y prettier integrado. Las reglas principales:

- `@typescript-eslint/no-floating-promises`: error
- `eol-last`, `linebreak-style`: unix/LF
- `max-len`: 150
- `newline-before-return`: error

#### Prettier

Config en `.prettierrc`. Double quotes, trailing commas, LF.

#### Husky + lint-staged

El pre-commit hook corre automaticamente:

1. `lint-staged` — aplica prettier + eslint --fix a los archivos staged
2. `pnpm test` — corre todos los checks

Si falla, el commit se bloquea con un mensaje descriptivo.

#### Actualizar dependencias

```bash
pnpm bumpDependencies
```

Esto usa `npm-check-updates` para mostrar que deps tienen nuevas versiones.
Despues de actualizar, correr `pnpm install && pnpm test` para verificar.

### Convenciones

- **TypeScript strict**: modo estricto, cero `any`. Sin excepciones.
- **Pure TS**: se ejecuta con `tsx`. Sin compilacion, sin `dist/`.
- **pnpm strict**: unico package manager.
- **ESM**: todos los paquetes son `"type": "module"`. Imports con extension `.ts`.
- **Conventional commits**: `tipo(scope): descripcion`.
- **Zod 4**: para validacion de schemas y env vars.
- **libs = reutilizables**: datos y logica compartida entre apps (y potencialmente entre repos).
- **apps = autonomas**: cada app es un script independiente con su propio entry point.
- **Datos sensibles**: siempre en `.env`, nunca en JSON ni en el repo.
- **No frameworks en apps**: tsx puro. Sin NestJS, sin DI, sin decorators.

[Volver arriba](#developer-guide--virgenherrera)
