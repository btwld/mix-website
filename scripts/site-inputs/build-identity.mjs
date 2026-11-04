import { execFileSync } from 'node:child_process';

/** A source archive may omit .git. Never label that build with an invented SHA. */
export function buildIdentity(root, env = process.env) {
  let checkout;
  let dirty = false;
  try {
    checkout = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    dirty = Boolean(execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: root, encoding: 'utf8' }).trim());
  } catch { /* Managed source archives may omit Git metadata. */ }
  const explicit = env.SITE_COMMIT;
  if (explicit && !/^[0-9a-f]{40}$/.test(explicit)) throw new Error('SITE_COMMIT must be a full source commit SHA');
  if (checkout && explicit && checkout !== explicit) throw new Error('SITE_COMMIT differs from the actual checkout');
  return { commit: checkout ?? explicit ?? null, dirty, identity: checkout ? 'git' : explicit ? 'provided' : 'unavailable' };
}
