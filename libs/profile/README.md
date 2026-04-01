# @virgenherrera/profile

Source of truth del perfil profesional. JSON + validacion con esquema Zod 4.

## Tabla de contenidos

- [Descripcion](#descripcion)
- [Arquitectura](#arquitectura)
- [Convenciones](#convenciones)
- [Exports](#exports)
- [Scripts](#scripts)

## Descripcion

Esta libreria centraliza toda la informacion del perfil profesional en un unico
archivo JSON (`profile.json`) validado en runtime contra un esquema Zod 4. Cualquier
paquete del monorepo que necesite datos del perfil importa desde aca, garantizando
consistencia y type-safety en todo el proyecto.

## Arquitectura

### Esquema (`schema.ts`)

Define la estructura completa del perfil usando Zod 4. Cada seccion del perfil tiene
su propio sub-esquema:

- `linkSchema` -- label, url, icon opcional
- `experienceSchema` -- company, role, fechas, description (array), technologies
- `educationSchema` -- institution, degree, field, fechas
- `certificationSchema` -- name, issuer, date, url opcional
- `skillCategorySchema` -- category + array de skills
- `languageSchema` -- language + proficiency

El esquema raiz `profileSchema` compone todos los sub-esquemas en un objeto unico.

### Datos (`profile.json`)

Archivo JSON que contiene todos los datos del perfil. Se lee desde disco y se valida
contra `profileSchema` en runtime a traves de la funcion `getProfile()`.

### Acceso (`get-profile.ts`)

Funcion `getProfile()` que lee `profile.json` desde el filesystem usando
`node:fs`, parsea el contenido y lo valida con `profileSchema.parse()`. Retorna
un objeto tipado `ProfileData` o lanza un error de validacion si el JSON no cumple
el esquema.

### Tipos exportados

Todos los tipos se infieren directamente del esquema Zod con `z.infer`:

- `ProfileData` -- tipo raiz del perfil completo
- `LinkData` -- enlace con label, url e icon
- `ExperienceData` -- entrada de experiencia laboral
- `EducationData` -- entrada de educacion
- `CertificationData` -- entrada de certificacion
- `SkillCategoryData` -- categoria con array de skills
- `LanguageData` -- idioma con nivel de competencia

## Convenciones

### Array de descripcion (prefijo `*`)

El campo `description` en `ExperienceData` usa un array de strings con una
convencion especial:

- **Sin prefijo** -- El primer elemento es un parrafo introductorio general.
- **Prefijo `*`** -- Los elementos que empiezan con `*` representan viñetas
  (bullet points) con logros o responsabilidades especificas.

Ejemplo:

```json
{
  "description": [
    "Parrafo introductorio que describe el rol general.",
    "*Logro especifico o responsabilidad destacada.",
    "*Otro logro con detalle tecnico."
  ]
}
```

Los consumidores de esta libreria deben interpretar esta convencion para renderizar
correctamente parrafos vs. listas.

### Estructura de skills

Las skills se organizan en categorias usando `SkillCategoryData`:

```json
{
  "category": "Languages",
  "skills": ["JavaScript", "TypeScript", "C#", "PHP"]
}
```

Cada categoria agrupa skills relacionadas. El array `skills` del perfil raiz
contiene multiples categorias como Languages, Backend Frameworks, Frontend
Frameworks, Databases, APIs y Protocols, Cloud y DevOps, ORMs y ODMs, AI e
Integrations.

## Exports

El punto de entrada (`index.ts`) expone:

| Export | Tipo | Descripcion |
| --- | --- | --- |
| `profileSchema` | Zod schema | Esquema de validacion del perfil completo |
| `getProfile` | Funcion | Lee y valida `profile.json`, retorna `ProfileData` |
| `ProfileData` | Type | Tipo inferido del perfil completo |
| `LinkData` | Type | Tipo inferido de un enlace |
| `ExperienceData` | Type | Tipo inferido de una experiencia laboral |
| `EducationData` | Type | Tipo inferido de una entrada educativa |
| `CertificationData` | Type | Tipo inferido de una certificacion |
| `SkillCategoryData` | Type | Tipo inferido de una categoria de skills |
| `LanguageData` | Type | Tipo inferido de un idioma |

## Scripts

| Script | Comando | Descripcion |
| --- | --- | --- |
| `test:static` | `eslint` + `prettier --check` | Linting y formato del codigo |
| `test:types` | `tsc --noEmit` | Verificacion de tipos sin emitir archivos |
| `test` | `test:static` + `test:types` | Ejecuta todas las validaciones |
| `bumpDependencies` | `npm-check-updates` | Verifica actualizaciones de dependencias |
