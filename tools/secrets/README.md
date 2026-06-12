# @virgenherrera/secrets

Libreria de validacion de variables de entorno usando dotenv + Zod 4.
Carga el archivo `.env` desde la raiz del monorepo, valida las variables
requeridas con un schema de Zod y exporta una configuracion tipada.

## Tabla de contenidos

- [Descripcion](#descripcion)
- [Arquitectura](#arquitectura)
- [Variables de entorno](#variables-de-entorno)
- [Exports](#exports)
- [Scripts](#scripts)

## Descripcion

`@virgenherrera/secrets` es una libreria interna del monorepo que centraliza
la carga y validacion de secretos sensibles (email de perfil, telefono de
perfil). Garantiza que las variables de entorno requeridas esten presentes y
tengan el formato correcto antes de que cualquier otro paquete las consuma.

## Arquitectura

El flujo de carga y validacion funciona asi:

1. **Carga de `.env`**: La funcion `getSecrets` invoca `dotenv.config()` para
   cargar las variables desde el archivo `.env` ubicado en la raiz del
   monorepo (tres niveles arriba de `src/`). Opcionalmente acepta un path
   personalizado.
2. **Validacion con Zod**: Las variables cargadas en `process.env` se extraen
   y se pasan por `secretsSchema.safeParse()`. El schema define las reglas de
   validacion para cada variable.
3. **Resultado tipado**: Si la validacion es exitosa, `getSecrets` retorna un
   objeto tipado `SecretsData`. Si falla, lanza un `Error` con un listado
   detallado de las variables invalidas o faltantes.

```text
.env (raiz del repo)
       |
       v
  dotenv.config()
       |
       v
  process.env
       |
       v
  secretsSchema.safeParse()
       |
  OK --+--> SecretsData (objeto tipado)
       |
  FAIL +--> Error con detalle de variables faltantes
```

## Variables de entorno

| Variable | Descripcion | Requerida | Validacion |
| --- | --- | --- | --- |
| `PROFILE_EMAIL` | Email del perfil profesional | Si | Formato email valido (`z.email()`) |
| `PROFILE_PHONE` | Telefono del perfil profesional | Si | String no vacio (`z.string().min(1)`) |

Estas variables deben definirse en el archivo `.env` en la raiz del monorepo.

## Exports

El paquete expone los siguientes elementos desde su entry point (`src/index.ts`):

| Export | Tipo | Descripcion |
| --- | --- | --- |
| `getSecrets` | Funcion | Carga `.env`, valida y retorna `SecretsData`. Acepta un `envPath` opcional. |
| `secretsSchema` | Objeto Zod | Schema de validacion de las variables de entorno. |
| `SecretsData` | Tipo TS | Tipo inferido del schema. Contiene `PROFILE_EMAIL` y `PROFILE_PHONE`. |

## Scripts

| Script | Comando | Descripcion |
| --- | --- | --- |
| `test:static` | `eslint 'src/**/*.ts' && prettier --check 'src/**/*.ts'` | Lint y formato del codigo fuente. |
| `test:types` | `tsc --noEmit` | Chequeo de tipos sin emitir archivos. |
| `test` | `pnpm run test:static && pnpm run test:types` | Ejecuta todas las validaciones estaticas. |
| `bumpDependencies` | `pnpm dlx npm-check-updates` | Busca actualizaciones disponibles de dependencias. |
