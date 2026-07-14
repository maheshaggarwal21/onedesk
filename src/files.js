// Atomic file write: write to a temp file, then rename over the target, so a crash
// mid-write never leaves a half-written ledger (a corrupted money file is the worst
// kind). Windows-safe: rename replaces the target where it can, and falls back to
// unlink+rename where it cannot.

import { writeFileSync, renameSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { dirname } from 'node:path';

export function atomicWrite(path, content) {
  const dir = dirname(path);
  if (dir && !existsSync(dir)) mkdirSync(dir, { recursive: true });
  const tmp = `${path}.tmp-${process.pid}`;
  writeFileSync(tmp, content);
  try {
    renameSync(tmp, path);
  } catch (err) {
    if (existsSync(path)) {
      unlinkSync(path);
      renameSync(tmp, path);
    } else {
      throw err;
    }
  }
}
