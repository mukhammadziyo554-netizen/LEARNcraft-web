// Runs the generic checks and per-page expectations on every in-scope page.
// Usage: npm run check [-- --only <substring>]
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';
import { CHECKS, runChecks } from './checks.mjs';
import { PAGES } from './pages.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const ALL = Object.keys(CHECKS);

// Each run: viewport, stored theme/language, which checks. Review Focus 1, 2, 3 and 5 live here.
const RUNS = [
  { id: 'phone', viewport: [375, 812], checks: ALL, expect: true },
  { id: 'desktop', viewport: [1440, 900], checks: ALL },
  { id: 'phone-light', viewport: [375, 812], storage: { learncraft_theme: 'light' }, checks: ['contrast'] },
  { id: 'phone-320', viewport: [320, 640], checks: ['noHorizontalOverflow'] },
  { id: 'phone-ru', viewport: [375, 812], storage: { learncraft_language: 'ru' }, checks: ['noHorizontalOverflow'] },
];
const WORKERS = 4;

const onlyIdx = process.argv.indexOf('--only');
const only = onlyIdx > -1 ? process.argv[onlyIdx + 1] : null;
const pages = PAGES
  .filter((p) => !only || p.path.includes(only))
  .filter((p) => existsSync(`${ROOT}/${p.path}`));

if (!pages.length) { console.error(`no pages match --only "${only}"`); process.exit(2); }

const server = await startServer(ROOT);
const browser = await chromium.launch();

async function checkPage(p) {
  const failures = [];
  for (const run of RUNS) {
    const context = await browser.newContext({ viewport: { width: run.viewport[0], height: run.viewport[1] } });
    if (run.storage) {
      await context.addInitScript((s) => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, run.storage);
    }
    const tab = await context.newPage();
    try {
      const results = await runChecks(tab, `${server.url}/${p.path}`, run.checks);
      for (const [check, msgs] of Object.entries(results)) for (const m of msgs) failures.push(`[${run.id}] ${check}: ${m}`);
      if (run.expect && p.expect) for (const m of await p.expect(tab, { url: server.url })) failures.push(`[${run.id}] expect: ${m}`);
    } catch (e) {
      failures.push(`[${run.id}] runner: ${e.message.split('\n')[0]}`);
    }
    await context.close();
  }
  return { path: p.path, failures };
}

const queue = [...pages];
const results = [];
await Promise.all(Array.from({ length: WORKERS }, async () => {
  for (let p = queue.shift(); p; p = queue.shift()) results.push(await checkPage(p));
}));

await browser.close();
await server.close();

results.sort((a, b) => pages.findIndex((p) => p.path === a.path) - pages.findIndex((p) => p.path === b.path));
for (const r of results) {
  console.log(`${r.failures.length ? 'FAIL' : 'PASS'} ${r.path}`);
  for (const f of r.failures) console.log(`     ${f}`);
}

const failed = results.filter((r) => r.failures.length);
const byCheck = {};
for (const r of failed) for (const f of r.failures) {
  const key = f.match(/^\[[^\]]+\] (\w+)/)[1];
  byCheck[key] = (byCheck[key] || new Set()).add(r.path);
}
mkdirSync(`${ROOT}/test-results`, { recursive: true });
writeFileSync(`${ROOT}/test-results/check.json`, JSON.stringify(results, null, 2));

console.log('');
for (const [check, set] of Object.entries(byCheck).sort()) console.log(`  ${check}: ${set.size} page(s)`);
console.log(`${results.length - failed.length}/${results.length} pages pass`);
process.exit(failed.length ? 1 : 0);
