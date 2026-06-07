// Cross-platform test entrypoint.
//
// Node 20's `node --test` only auto-discovers JavaScript-extension files and does
// not expand globs on Windows, so a `./tests/**/*.test.ts` script silently finds
// nothing. Instead we recursively collect every `*.test.ts` under this directory
// and import it: node:test registers and runs those tests automatically, and sets
// a non-zero exit code if any fail.

import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Force test isolation BEFORE any test file (and therefore the config/connection
// singletons) is imported: DB-backed tests run against a throwaway in-memory
// database, and logging is quieted so test output stays readable. config.ts caches
// these on first import, so they must be set here, not inside a test.
process.env.DATABASE_PATH = ':memory:';
process.env.LOG_LEVEL ??= 'error';

const testsDir = dirname(fileURLToPath(import.meta.url));

function collectTestFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTestFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.test.ts')) {
      files.push(full);
    }
  }
  return files;
}

const testFiles = collectTestFiles(testsDir);

if (testFiles.length === 0) {
  console.error('No *.test.ts files found under', testsDir);
  process.exit(1);
}

for (const file of testFiles) {
  await import(pathToFileURL(file).href);
}
