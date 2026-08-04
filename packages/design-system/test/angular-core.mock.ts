/**
 * Minimal Angular core stubs for pure-logic unit tests.
 *
 * Decorator factories return identity functions so decorated classes
 * remain plain constructable classes. This avoids loading Angular's
 * ESM bundles (fesm2022/*.mjs) inside Jest's CJS module system.
 *
 * Only add exports here that are actually referenced by tested source
 * files — keep the surface minimal.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return */
const identity = (target: any) => target;
const decoratorFactory = (_config?: any) => identity;

export const Pipe = decoratorFactory;
export const Injectable = decoratorFactory;
export const Directive = decoratorFactory;
export const Component = decoratorFactory;
