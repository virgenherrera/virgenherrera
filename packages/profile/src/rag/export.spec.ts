/**
 * NOTE: `export.ts` is a CLI script whose `main()` function is private
 * (not exported). It reads the real filesystem via `parseContent()` and
 * `buildProfileGraph()`, then writes `profile-snapshot.json`.
 *
 * Full execution testing would require mocking the filesystem with `memfs`
 * AND replicating the full content directory structure — this is already
 * covered by `parser.spec.ts` and `link-resolver.spec.ts`.
 *
 * This spec validates:
 * - The module can be imported without side effects (the `main()` call is
 *   gated behind `require.main === module`)
 * - The `serializeGraph` internal function's output shape is validated
 *   indirectly via the `profileSnapshotSchema` in `schema.spec.ts`
 */

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return */
describe('UT: rag/export @critical', () => {
  class should {
    static readonly importWithoutSideEffects =
      'import without executing main or writing files';
    static readonly notExecuteMainOnImport =
      'not execute main() when imported as a module';
  }

  describe('module loading', () => {
    it(`${should.importWithoutSideEffects}`, () => {
      // The module gates execution behind `require.main === module`.
      // Importing it in a test context must NOT trigger file writes.
      // This test verifies the guard works — if it didn't, the import
      // would throw (attempting to read a non-existent content dir from
      // the test environment's __dirname).
      expect(() => require('./export')).not.toThrow();
    });

    it(`${should.notExecuteMainOnImport}`, () => {
      // When loaded via require() in tests, require.main points to
      // the Jest runner, NOT this module. The `main()` function should
      // never execute.
      const writeFileSync = jest.spyOn(
        require('node:fs'),
        'writeFileSync',
      ) as jest.SpyInstance;

      // Clear any cached module to force re-evaluation
      const modulePath = require.resolve('./export');
      delete require.cache[modulePath];

      require('./export');

      // writeFileSync should NOT have been called by the module load
      expect(writeFileSync).not.toHaveBeenCalledWith(
        expect.stringContaining('profile-snapshot.json'),
        expect.any(String),
      );

      writeFileSync.mockRestore();
    });
  });
});
