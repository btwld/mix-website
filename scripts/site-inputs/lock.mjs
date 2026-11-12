// Shape checks shared by the producer packer and the website prebuild.
export const INPUT_NAMES = ['mix-previews', 'remix-docs', 'naked-ui-docs'];
const OPTIONAL_INPUT_NAMES = ['showcase', 'fortal-site'];

const COMMIT = /^[0-9a-f]{40}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const REPOSITORY = /^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/;
// Release assets are the only supported artifact origin; the hash, not the
// host, is what makes an input trustworthy, but a fixed origin keeps the lock
// reviewable and stops a typo from silently pointing at someone else's file.
const ARTIFACT_URL = /^https:\/\/github\.com\/btwld\/mix-website\/releases\/download\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+\.tar\.gz$/;

function fail(message) {
  throw new Error(message);
}

function checkSource(source, where) {
  if (!source || typeof source !== 'object') fail(`${where}: missing source`);
  if (!REPOSITORY.test(source.repository ?? '')) fail(`${where}: source.repository must be owner/name`);
  if (!COMMIT.test(source.commit ?? '')) fail(`${where}: source.commit must be a full 40-character commit SHA`);
}

export function validateSiteInputMetadata(metadata) {
  if (metadata?.schemaVersion !== 1) fail('site-input.json: unsupported schemaVersion');
  if (![...INPUT_NAMES, ...OPTIONAL_INPUT_NAMES].includes(metadata.name)) fail(`site-input.json: unknown input name ${JSON.stringify(metadata.name)}`);
  checkSource(metadata.source, `site-input.json (${metadata.name})`);
  return metadata;
}

export function validateLock(lock) {
  if (lock?.version !== 1) fail('sources.lock.json: unsupported version');
  if (!lock.inputs || typeof lock.inputs !== 'object') fail('sources.lock.json: missing inputs');
  for (const name of INPUT_NAMES) {
    if (!(name in lock.inputs)) fail(`sources.lock.json: missing input ${name}`);
  }
  for (const [name, input] of Object.entries(lock.inputs)) {
    const where = `sources.lock.json inputs.${name}`;
    if (![...INPUT_NAMES, ...OPTIONAL_INPUT_NAMES].includes(name)) fail(`${where}: unknown input`);
    checkSource(input.source, where);
    if (!input.producer) fail(`${where}: missing producer provenance`);
    {
      if (input.producer.repository !== 'btwld/mix-website' || !COMMIT.test(input.producer.commit ?? '')) fail(`${where}: producer must name a full mix-website commit`);
      if (input.producer.script !== `scripts/site-inputs/produce/${name}.sh`) fail(`${where}: unexpected producer script`);
    }
    const artifact = input.artifact;
    if (!artifact || typeof artifact !== 'object') fail(`${where}: missing artifact`);
    if (!ARTIFACT_URL.test(artifact.url ?? '')) fail(`${where}: artifact.url must be a btwld/mix-website release asset (.tar.gz)`);
    if (!SHA256.test(artifact.sha256 ?? '')) fail(`${where}: artifact.sha256 must be 64 lowercase hex characters`);
    if (!Number.isSafeInteger(artifact.size) || artifact.size <= 0) fail(`${where}: artifact.size must be a positive integer`);
  }
  return lock;
}

/** Release tag and asset names are addressed by input and source commit. */
export function releaseCoordinates(name, commit, repository = 'btwld/mix-website') {
  const short = commit.slice(0, 12);
  const tag = `site-input-${name}-${short}`;
  const file = `${name}-${short}.tar.gz`;
  return { tag, file, url: `https://github.com/${repository}/releases/download/${tag}/${file}` };
}
