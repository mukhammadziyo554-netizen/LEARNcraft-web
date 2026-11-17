// Proves the generic checks work: every check must pass on good.html
// and every check must report at least one failure on bad.html.
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';
import { CHECKS, runChecks } from './checks.mjs';

const server = await startServer(new URL('..', import.meta.url).pathname);
const browser = await chromium.launch();
let failed = 0;

async function results(path) {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  const out = await runChecks(page, `${server.url}/${path}`, Object.keys(CHECKS));
  await context.close();
  return out;
}

const good = await results('tests/fixtures/good.html');
for (const [name, msgs] of Object.entries(good)) {
  if (msgs.length) { failed++; console.log(`FAIL good.html should pass ${name}: ${msgs.join(' | ')}`); }
  else console.log(`ok   good.html passes ${name}`);
}

const bad = await results('tests/fixtures/bad.html');
for (const [name, msgs] of Object.entries(bad)) {
  if (!msgs.length) { failed++; console.log(`FAIL bad.html should fail ${name}`); }
  else console.log(`ok   bad.html fails ${name}: ${msgs[0]}`);
}

await browser.close();
await server.close();
console.log(failed ? `${failed} self-test failure(s)` : `self-test: all ${Object.keys(CHECKS).length * 2} assertions pass`);
process.exit(failed ? 1 : 0);
