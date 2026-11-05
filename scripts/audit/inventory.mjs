import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PROJECTS, PROJECT_IDS } from '../../lib/projects.mjs';
const json = async file => JSON.parse(await readFile(file, 'utf8'));
const inventory = await json('docs/migration/pages.json');
const site = await json('.generated/site-inputs.json');
const actualRoutes = new Set(['/', ...PROJECT_IDS.map(id => PROJECTS[id].overviewPath)]);
for (const id of PROJECT_IDS) {
  const actual = site.pages[id].map(slug => `${PROJECTS[id].docsBase}/${slug ? slug + '/' : ''}`).sort();
  assert.deepEqual(inventory.pages[id].map(page => page.path).sort(), actual, `${id}: inventory must name the exact staged pages`);
  assert.equal(inventory.counts[id], actual.length);
  for (const page of actual) {
    actualRoutes.add(page);
    const parts = page.split('/').filter(Boolean);
    for (let i = 2; i < parts.length; i++) actualRoutes.add('/' + parts.slice(0, i).join('/') + '/');
  }
  actualRoutes.add(`${PROJECTS[id].docsBase}/`);
}
assert.deepEqual([...actualRoutes].sort(), [...inventory.siteRoutes].sort(), 'Route inventory must include precisely the pages, landings and folder indexes');
const legacy = await json('docs/migration/legacy-urls.json');
const history = await json('docs/migration/historical-paths.json');
const kinds = new Set(['migrated', 'redirected', 'intentionally-excluded', 'unresolved', 'retained']);
for (const row of [...legacy, ...history.paths, ...history.nonPagePatterns]) {
  assert.ok(kinds.has(row.classification), `Missing classification: ${JSON.stringify(row)}`);
  assert.ok(row.reason?.trim(), `Missing decision reason: ${JSON.stringify(row)}`);
}
assert.equal(legacy.length, 235, 'Preserve the original URL inventory, including origin-specific duplicates');
assert.equal(history.paths.length, 151);
assert.equal(new Set(history.paths.map(row => row.oldPath)).size, 151);
console.log(JSON.stringify({ pages: inventory.counts, routes: actualRoutes.size, legacy: Object.fromEntries(Object.entries(Object.groupBy(legacy, r => r.classification)).map(([k,v]) => [k,v.length])), historicalPaths: history.paths.length, nonPagePatterns: history.nonPagePatterns.length }));
