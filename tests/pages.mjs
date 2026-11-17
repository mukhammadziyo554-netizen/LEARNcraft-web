// In-scope learner pages (spec: "Pages in scope").
// `expect(page, ctx)` returns extra failure messages for that page; later plan tasks add them.

const page = (path, expect, opts = {}) => ({ path, name: path.replace(/\.html$/, ''), expect, ...opts });

// Owner decision: these pages require sign-in. Checked signed in; signed-out visits must land on the login page.
const GATED = { signedIn: true };
function gated(expect, loginPath) {
  return async (tab, ctx) => {
    const out = await expect(tab, ctx);
    const probe = await tab.context().browser().newContext();
    const anon = await probe.newPage();
    await anon.goto(tab.url(), { waitUntil: 'load' }).catch(() => {});
    await anon.waitForTimeout(300);
    if (!anon.url().endsWith(loginPath)) out.push(`signed-out visit ends on ${anon.url()}, expected ${loginPath}`);
    await probe.close();
    return out;
  };
}

// Task 2: the splash gate is gone and the home page renders straight away with a styled nav.
async function homeRendersWithoutGate(tab) {
  return tab.evaluate(() => {
    const out = [];
    for (const id of ['startupOverlay', 'welcomeMessage']) {
      if (document.getElementById(id)) out.push(`#${id} still exists`);
    }
    const content = document.querySelector('main') || document.getElementById('pageContent');
    if (!content) out.push('no <main> or #pageContent');
    else {
      const cs = getComputedStyle(content);
      if (content.classList.contains('hidden') || cs.display === 'none' || parseFloat(cs.opacity) === 0) {
        out.push('page content is not visible after load');
      }
    }
    const blue = [...document.querySelectorAll('.lc-nav a, .main-nav a')].filter((a) => getComputedStyle(a).color === 'rgb(0, 0, 238)');
    if (blue.length) out.push(`${blue.length} nav link(s) render as unstyled default blue`);
    return out;
  });
}

// Task 4: home page content is true, stages match the real stage pages, footer has no filler.
const STAGE_TITLES = [
  'Foundations', 'Core Civil Concepts', 'Field Specialization',
  'Practical Application', 'Professional Skills', 'Advanced & Career Prep',
];
const BANNED_TEXT = ['$85k', '$75k', '8% Growth', '$145k', '$140k', '94%', 'thousands', 'licensed engineers', 'All systems operational'];
const FILLER_LINKS = ['CMS', 'SEO', 'Plugins', 'Templates', 'Collaborate', 'Publish', 'Affiliates', 'Creators', 'Components'];
const BARE_SOCIAL = ['https://instagram.com', 'https://linkedin.com', 'https://tiktok.com', 'https://x.com', 'https://youtube.com'];

async function homePage(tab, ctx) {
  const out = await homeRendersWithoutGate(tab);
  const found = await tab.evaluate(({ banned, filler, social }) => {
    const text = document.body.innerText;
    return {
      banned: banned.filter((t) => text.toLowerCase().includes(t.toLowerCase())),
      stages: [...document.querySelectorAll('.lc-stage')].map((s) => ({
        title: s.querySelector('.lc-stage__title')?.textContent.trim(),
        href: s.getAttribute('href'),
      })),
      filler: [...document.querySelectorAll('footer a')].map((a) => a.textContent.trim()).filter((t) => filler.includes(t)),
      deadLinks: [...document.querySelectorAll('footer a, header a, .lc-drawer a')].filter((a) => a.getAttribute('href') === '#').length,
      social: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href').replace(/\/$/, '')).filter((h) => social.includes(h)),
      script: [...document.querySelectorAll('body *')].filter((el) => /Brush Script/i.test(getComputedStyle(el).fontFamily)).length,
      lc: document.body.classList.contains('lc'),
    };
  }, { banned: BANNED_TEXT, filler: FILLER_LINKS, social: BARE_SOCIAL });

  if (!found.lc) out.push('body is not opted in to the design system (class="lc")');
  for (const t of found.banned) out.push(`unsourced or invented text still on the page: "${t}"`);
  if (found.stages.length !== 6) out.push(`expected 6 .lc-stage cards, found ${found.stages.length}`);
  found.stages.forEach((s, i) => {
    if (s.title !== STAGE_TITLES[i]) out.push(`stage ${i + 1} title is "${s.title}", expected "${STAGE_TITLES[i]}"`);
    if (s.href !== `courses/civil-stage${i + 1}.html`) out.push(`stage ${i + 1} links to "${s.href}"`);
  });
  for (const s of found.stages) {
    if (!s.href) continue;
    const res = await tab.request.fetch(`${ctx.url}/${s.href}`, { method: 'HEAD' });
    if (res.status() !== 200) out.push(`stage link ${s.href} returns ${res.status()}`);
  }
  for (const t of found.filler) out.push(`template filler link in footer: "${t}"`);
  if (found.deadLinks) out.push(`${found.deadLinks} header/footer/drawer link(s) point to "#"`);
  for (const h of found.social) out.push(`social link to a bare homepage: ${h}`);
  if (found.script) out.push(`${found.script} element(s) still use Brush Script`);

  // chat: whole-word keyword match, and user text is never parsed as HTML
  const chat = await tab.evaluate(async () => {
    const ask = async (q) => {
      const input = document.getElementById('chatInput');
      input.value = q;
      document.getElementById('chatForm').requestSubmit();
      await new Promise((r) => setTimeout(r, 900));
      const msgs = [...document.querySelectorAll('#chatMessages .chat-msg--ai .chat-msg__text')];
      return msgs[msgs.length - 1].textContent;
    };
    const greeting = await ask('what is this thing');
    const beam = await ask('explain a beam');
    await ask('<img src=x onerror="window.__xss=1">');
    return { greeting, beam, injected: !!document.querySelector('#chatMessages img'), xss: !!window.__xss };
  });
  if (/^(hey|hello|hi)\b/i.test(chat.greeting)) out.push(`chat: "what is this thing" got the greeting: "${chat.greeting.slice(0, 40)}"`);
  if (!/beam/i.test(chat.beam)) out.push(`chat: "explain a beam" did not get the beam answer: "${chat.beam.slice(0, 40)}"`);
  if (chat.injected || chat.xss) out.push('chat: user text was rendered as HTML');

  // saved language is applied on load, and English comes back unchanged
  await tab.evaluate(() => localStorage.setItem('learncraft_language', 'ru'));
  await tab.reload();
  const ru = await tab.$eval('h1', (h) => h.textContent.trim());
  if (!/[а-яё]/i.test(ru)) out.push(`language: with learncraft_language=ru the h1 is "${ru}"`);
  await tab.focus('.lc-lang');
  await tab.keyboard.press('Enter');
  await tab.keyboard.press('Home');
  await tab.keyboard.press('Enter');
  const en = await tab.$eval('h1', (h) => h.textContent.trim());
  if (en !== 'Learn Civil Engineering with AI') out.push(`language: switching back to English gives h1 "${en}"`);
  await tab.evaluate(() => localStorage.removeItem('learncraft_language'));

  // drawer offers sign-in on phones (the header button is hidden below 768px)
  if (!(await tab.$('.lc-drawer a[href="pages/login.html"]'))) out.push('drawer has no sign-in link');
  return out;
}

// Task 5: roadmap and stage pages share the home header/footer, show real saved progress only.
async function chromeSignature(tab) {
  return tab.evaluate(() => {
    const links = (sel) => [...document.querySelectorAll(sel)].map((a) => `${a.textContent.trim()} -> ${a.href.replace(/#.*$/, '')}`);
    return {
      header: links('.lc-header a, .lc-drawer a').join('\n'),
      footer: links('.lc-footer a').join('\n'),
    };
  });
}

async function sharedChrome(tab, ctx) {
  const out = [];
  const home = await tab.context().newPage();
  await home.goto(`${ctx.url}/index.html`);
  const want = await chromeSignature(home);
  await home.close();
  const got = await chromeSignature(tab);
  if (!(await tab.evaluate(() => document.body.classList.contains('lc')))) out.push('body is not opted in (class="lc")');
  if (got.header !== want.header) out.push('header/drawer links differ from the home page');
  if (got.footer !== want.footer) out.push('footer links differ from the home page');
  return out;
}

const FAKE_PROGRESS = ['34%', '4 days', 'Study Streak', 'Weekly Completion'];

function stagePage(n) {
  return async (tab, ctx) => {
    const out = await sharedChrome(tab, ctx);
    const info = await tab.evaluate((fake) => ({
      h1: document.querySelector('h1')?.textContent.trim(),
      back: !!document.querySelector('a[href="roadmap.html"]'),
      fake: fake.filter((t) => document.body.innerText.includes(t)),
      unlabeled: [...document.querySelectorAll('input[type="checkbox"]')]
        .filter((c) => !c.labels?.length && !c.getAttribute('aria-label')).length,
      boxes: document.querySelectorAll('input[type="checkbox"][data-task]').length,
    }), FAKE_PROGRESS);
    const title = `Stage ${n} — ${STAGE_TITLES[n - 1]}`;
    if (info.h1 !== title) out.push(`h1 is "${info.h1}", expected "${title}"`);
    if (!info.back) out.push('no link back to roadmap.html');
    for (const t of info.fake) out.push(`made-up progress text on the page: "${t}"`);
    if (info.unlabeled) out.push(`${info.unlabeled} checkbox(es) without a label`);
    if (!info.boxes) out.push('no trackable checkboxes (input[data-task])');
    else {
      // progress survives a reload
      await tab.locator('input[type="checkbox"][data-task]').first().check();
      const before = await tab.$eval('[data-stage-progress]', (p) => p.getAttribute('aria-valuenow')).catch(() => null);
      await tab.reload();
      const after = await tab.evaluate(() => ({
        checked: document.querySelector('input[type="checkbox"][data-task]').checked,
        now: document.querySelector('[data-stage-progress]')?.getAttribute('aria-valuenow'),
      }));
      if (before !== '1') out.push(`progress bar shows ${before} after ticking one box, expected 1`);
      if (!after.checked || after.now !== '1') out.push('ticked progress is not kept after reload');
      await tab.evaluate(() => localStorage.removeItem('learncraft_stage_progress'));
    }
    return out;
  };
}

async function roadmapPage(tab, ctx) {
  const out = await sharedChrome(tab, ctx);
  const info = await tab.evaluate(() => ({
    stages: [...document.querySelectorAll('.lc-stage')].map((s) => ({
      title: s.querySelector('.lc-stage__title')?.textContent.trim(),
      label: s.querySelector('.lc-label')?.textContent.trim(),
      href: s.getAttribute('href'),
      status: s.querySelector('.lc-stage__meta')?.textContent.trim(),
    })),
  }));
  if (info.stages.length !== 6) out.push(`expected 6 .lc-stage entries, found ${info.stages.length}`);
  info.stages.forEach((s, i) => {
    const nn = String(i + 1).padStart(2, '0');
    if (s.title !== STAGE_TITLES[i]) out.push(`stage ${i + 1} title "${s.title}"`);
    if (!s.label?.includes(nn)) out.push(`stage ${i + 1} label "${s.label}" lacks ${nn}`);
    if (s.href !== `civil-stage${i + 1}.html`) out.push(`stage ${i + 1} links to "${s.href}"`);
    if (s.status !== 'Not started') out.push(`stage ${i + 1} status "${s.status}" with no saved progress`);
  });
  // saved progress shows up
  await tab.evaluate(() => localStorage.setItem('learncraft_stage_progress', JSON.stringify({ 2: { done: ['a', 'b'], total: 35 } })));
  await tab.reload();
  const s2 = await tab.$eval('.lc-stage:nth-of-type(1)', () => document.querySelectorAll('.lc-stage')[1].querySelector('.lc-stage__meta')?.textContent.trim()).catch(() => null);
  if (s2 !== '2 of 35 done') out.push(`stage 2 status with saved progress is "${s2}", expected "2 of 35 done"`);
  await tab.evaluate(() => localStorage.removeItem('learncraft_stage_progress'));
  return out;
}

// Task 6: lesson and Ask AI.
async function lessonPage(tab, ctx) {
  const out = await sharedChrome(tab, ctx);
  const src = await (await tab.request.fetch(`${ctx.url}/learning/lesson.html`)).text();
  if (/great question|Let me explain that in detail/i.test(src)) out.push('fake canned chat replies are still in the page');
  const info = await tab.evaluate(() => {
    const prose = document.querySelector('main .lc-prose');
    const textBoxes = prose ? [...prose.querySelectorAll('p, li, pre')].map((el) => el.getBoundingClientRect()) : [];
    const fixed = [...document.querySelectorAll('body *')].filter((el) => {
      const cs = getComputedStyle(el);
      return (cs.position === 'fixed' || cs.position === 'sticky') && el.getClientRects().length && !el.closest('.lc-header, .lc-drawer, [hidden]');
    }).map((el) => ({ who: el.className, r: el.getBoundingClientRect() }));
    const overlaps = fixed.filter((f) => textBoxes.some((t) => !(f.r.right <= t.left || f.r.left >= t.right || f.r.bottom <= t.top || f.r.top >= t.bottom)));
    return {
      prose: !!prose,
      overlaps: overlaps.map((o) => o.who),
      askLink: !!document.querySelector('a[href="../pages/ask-ai.html"]:not(.lc-nav__link):not(.lc-drawer__link):not(.lc-footer a)'),
      inlinePx: [...document.querySelectorAll('[style*="color"]')].length,
    };
  });
  if (!info.prose) out.push('lesson body is not in main .lc-prose');
  for (const o of info.overlaps) out.push(`fixed element "${o}" covers lesson text`);
  if (!info.askLink) out.push('no link from the lesson to Ask AI');
  if (info.inlinePx) out.push(`${info.inlinePx} element(s) with inline colour styles`);
  return out;
}

async function askAiPage(tab, ctx) {
  const out = await sharedChrome(tab, ctx);
  const info = await tab.evaluate(() => {
    const send = document.querySelector('#chatForm [type="submit"], .send-btn');
    const accent = getComputedStyle(document.body).getPropertyValue('--c-accent').trim();
    const alert = document.querySelector('#chatMessages .lc-alert--error');
    return {
      sendBg: send && getComputedStyle(send).backgroundColor,
      accent,
      alert: alert && { role: alert.getAttribute('role'), svg: !!alert.querySelector('svg'), text: alert.textContent.trim() },
      emoji: /[⚠⏰📦👑]/u.test(document.getElementById('chatMessages')?.textContent || ''),
      label: !!document.querySelector('label[for="userInput"]'),
      slogans: /Answers that actually teach|From confusion to clarity/.test(document.body.innerText),
    };
  });
  if (info.sendBg !== 'rgb(245, 196, 0)') out.push(`send button background is ${info.sendBg}, expected the accent yellow`);
  if (!info.alert) out.push('signed-out notice is not an .lc-alert--error in the chat');
  else {
    if (info.alert.role !== 'alert') out.push('signed-out notice has no role="alert"');
    if (!info.alert.svg) out.push('signed-out notice has no icon');
    if (!/log in|sign in/i.test(info.alert.text)) out.push(`signed-out notice text: "${info.alert.text}"`);
  }
  if (info.emoji) out.push('emoji used as status icons in the chat');
  if (!info.label) out.push('question input has no visible label');
  if (info.slogans) out.push('slogan filler still on the page');
  return out;
}

// Task 7: all articles share one layout.
async function articlePage(tab, ctx) {
  const out = await sharedChrome(tab, ctx);
  const info = await tab.evaluate(() => {
    const prose = document.querySelector('main .lc-prose');
    const p = prose?.querySelector('p');
    const cs = p && getComputedStyle(p);
    return {
      styleTags: document.querySelectorAll('body style, head style').length,
      prose: !!prose,
      maxWidthCh: prose ? prose.getBoundingClientRect().width / parseFloat(getComputedStyle(prose).fontSize) : 0,
      pFont: cs && `${cs.fontSize}/${cs.lineHeight}`,
      back: !!document.querySelector('main a[href="../courses/learn.html"]'),
    };
  });
  if (info.styleTags) out.push(`${info.styleTags} inline <style> block(s)`);
  if (!info.prose) out.push('article body is not in main .lc-prose');
  if (info.maxWidthCh > 40) out.push(`prose is ${info.maxWidthCh.toFixed(0)}em wide (limit ~40em = 72ch)`);
  if (info.pFont && !['17px/27.2px', '16px/25.6px'].includes(info.pFont)) out.push(`paragraph type ${info.pFont} is not the shared body size`);
  if (!info.back) out.push('no link to the articles list (../courses/learn.html)');
  return out;
}

// Task 8: remaining learner pages share the chrome, label every field, carry no page <style>.
async function infoPage(tab, ctx) {
  const out = await sharedChrome(tab, ctx);
  const info = await tab.evaluate(() => {
    const fields = [...document.querySelectorAll('input, select, textarea')]
      .filter((f) => !['hidden', 'submit', 'button'].includes(f.type) && f.getClientRects().length);
    const unlabeled = fields.filter((f) => {
      if (f.getAttribute('aria-label') || f.getAttribute('aria-labelledby')) return false;
      return !f.labels || ![...f.labels].some((l) => l.textContent.trim() && l.getClientRects().length);
    }).map((f) => f.id || f.name || f.type);
    const green = [...document.querySelectorAll('body *')].filter((el) => {
      const m = getComputedStyle(el).backgroundColor.match(/rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?/);
      if (!m || (m[4] !== undefined && +m[4] === 0)) return false;
      const [r, g, b] = [+m[1] / 255, +m[2] / 255, +m[3] / 255];
      const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
      if (!d) return false;
      const sat = d / (1 - Math.abs(max + min - 1));
      let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h = (h * 60 + 360) % 360;
      return h >= 90 && h <= 150 && sat > 0.4 && !el.closest('.lc-alert--success');
    }).length;
    return {
      styleTags: document.querySelectorAll('style').length,
      unlabeled,
      green,
      johnDoe: /John Doe/.test(document.body.innerText) || [...document.querySelectorAll('input')].some((i) => i.value === 'John Doe'),
    };
  });
  if (info.styleTags) out.push(`${info.styleTags} inline <style> block(s)`);
  for (const f of info.unlabeled.slice(0, 5)) out.push(`field without a visible label: ${f}`);
  if (info.green) out.push(`${info.green} element(s) with a green background (off-brand)`);
  if (info.johnDoe) out.push('placeholder person "John Doe" on the page');
  return out;
}

// Task 3: shared components and site.js behaviour, tested on the component fixture.
async function tabUntil(tab, selector, max = 30) {
  for (let i = 0; i < max; i++) {
    await tab.keyboard.press('Tab');
    if (await tab.evaluate((s) => document.activeElement?.matches(s), selector)) return true;
  }
  return false;
}

async function componentsWork(tab) {
  const out = [];
  const url = tab.url();

  // drawer keyboard
  if (!(await tabUntil(tab, '.lc-burger'))) out.push('drawer keyboard: could not Tab to .lc-burger');
  else {
    await tab.keyboard.press('Enter');
    const open = await tab.evaluate(() => ({
      visible: !document.getElementById('drawer').hidden && !!document.getElementById('drawer').getClientRects().length,
      expanded: document.querySelector('.lc-burger').getAttribute('aria-expanded'),
      focusInside: document.getElementById('drawer').contains(document.activeElement),
    }));
    if (!open.visible) out.push('drawer keyboard: Enter did not show the drawer');
    if (open.expanded !== 'true') out.push(`drawer keyboard: aria-expanded is "${open.expanded}" after opening`);
    if (!open.focusInside) out.push('drawer keyboard: focus did not move into the open drawer');
    await tab.keyboard.press('Escape');
    const closed = await tab.evaluate(() => ({
      hidden: document.getElementById('drawer').hidden,
      focusBack: document.activeElement?.classList.contains('lc-burger'),
    }));
    if (!closed.hidden) out.push('drawer keyboard: Escape did not hide the drawer');
    if (!closed.focusBack) out.push('drawer keyboard: focus did not return to the burger');
  }

  // language menu keyboard
  await tab.focus('.lc-lang');
  await tab.keyboard.press('Enter');
  if (await tab.evaluate(() => document.getElementById('lang-menu').hidden)) out.push('language menu: Enter did not open it');
  await tab.keyboard.press('ArrowDown');
  await tab.keyboard.press('Enter');
  const lang = await tab.evaluate(() => ({
    text: document.querySelector('.lc-lang').textContent.trim(),
    stored: localStorage.getItem('learncraft_language'),
    hidden: document.getElementById('lang-menu').hidden,
  }));
  if (lang.text !== 'RU') out.push(`language menu: button text is "${lang.text}", expected "RU"`);
  if (lang.stored !== 'ru') out.push(`language menu: learncraft_language is "${lang.stored}", expected "ru"`);
  if (!lang.hidden) out.push('language menu: did not close after choosing');

  // theme toggle
  await tab.click('[data-lc-theme-toggle]');
  const theme = await tab.evaluate(() => ({
    html: document.documentElement.dataset.theme,
    pressed: document.querySelector('[data-lc-theme-toggle]').getAttribute('aria-pressed'),
  }));
  if (theme.html !== 'light' || theme.pressed !== 'true') out.push(`theme toggle: data-theme=${theme.html}, aria-pressed=${theme.pressed}`);
  await tab.click('[data-lc-theme-toggle]');

  // focus ring on a keyboard-focused button
  await tab.goto(url);
  if (!(await tabUntil(tab, '.lc-btn'))) out.push('focus ring: could not Tab to an .lc-btn');
  else {
    const ring = await tab.evaluate(() => {
      const cs = getComputedStyle(document.activeElement);
      return { outline: cs.outlineStyle, width: cs.outlineWidth, shadow: cs.boxShadow };
    });
    if ((ring.outline === 'none' || ring.width === '0px') && ring.shadow === 'none') out.push('focus ring: focused .lc-btn has no outline or box-shadow');
  }

  // touch targets (inline prose links are exempt, WCAG 2.5.8)
  const small = await tab.evaluate(() => [...document.querySelectorAll('a, button, input, select, textarea')]
    .filter((el) => el.getClientRects().length && !el.closest('.lc-prose') && !el.classList.contains('lc-skip'))
    .filter((el) => !el.closest('[hidden]'))
    .filter((el) => el.getBoundingClientRect().height < 44)
    .map((el) => `${el.tagName.toLowerCase()}.${el.className} ${Math.round(el.getBoundingClientRect().height)}px`));
  for (const s of small.slice(0, 5)) out.push(`touch target under 44px: ${s}`);

  // progress semantics
  const progress = await tab.evaluate(() => {
    const p = document.querySelector('.lc-progress');
    return p && { now: p.getAttribute('aria-valuenow'), max: p.getAttribute('aria-valuemax'), fill: getComputedStyle(p, '::after').width };
  });
  if (!progress || progress.now !== '2' || progress.max !== '6') out.push(`progress: expected aria-valuenow=2 and aria-valuemax=6, got ${JSON.stringify(progress)}`);

  // storage migration from legacy keys
  await tab.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('preferredLanguage', 'uz');
    localStorage.setItem('languageDisplay', 'UZ');
    localStorage.setItem('theme', 'light');
  });
  await tab.reload();
  const migrated = await tab.evaluate(() => ({
    lang: localStorage.getItem('learncraft_language'),
    theme: localStorage.getItem('learncraft_theme'),
    legacy: ['preferredLanguage', 'selectedLanguage', 'languageDisplay', 'theme'].filter((k) => localStorage.getItem(k) !== null),
  }));
  if (migrated.lang !== 'uz' || migrated.theme !== 'light') out.push(`storage migration: got language=${migrated.lang}, theme=${migrated.theme}`);
  if (migrated.legacy.length) out.push(`storage migration: legacy keys left: ${migrated.legacy.join(', ')}`);
  await tab.evaluate(() => localStorage.clear());

  return out;
}

export const PAGES = [
  page('index.html', homePage),

  page('pages/about.html', infoPage),
  page('pages/ask-ai.html', askAiPage),
  page('pages/ai-usage.html', infoPage),
  page('pages/auth.html', infoPage),
  page('pages/login.html', infoPage),
  page('pages/registration.html'),
  page('pages/settings.html', gated(infoPage, '/pages/login.html'), GATED),
  page('pages/support.html', infoPage),
  page('pages/community.html', gated(infoPage, '/pages/login.html'), GATED),
  page('pages/debug-help.html', infoPage),

  page('courses/roadmap.html', roadmapPage),
  page('courses/civil-roadmap.html', roadmapPage),
  page('courses/civil-stage1.html', stagePage(1)),
  page('courses/civil-stage2.html', stagePage(2)),
  page('courses/civil-stage3.html', stagePage(3)),
  page('courses/civil-stage4.html', stagePage(4)),
  page('courses/civil-stage5.html', stagePage(5)),
  page('courses/civil-stage6.html', stagePage(6)),
  page('courses/choose-field.html', infoPage),
  page('courses/learn.html', infoPage),
  page('courses/practice.html', gated(infoPage, '/pages/login.html'), GATED),

  page('learning/lesson.html', lessonPage),
  page('study/civil-foundations.html', gated(infoPage, '/pages/login.html'), GATED),

  ...[
    'aerospace-engineering', 'architectural-engineering', 'biomedical-engineering',
    'chemical-engineering', 'civil-engineering', 'computer-science',
    'electrical-engineering', 'environmental-engineering', 'industrial-engineering',
    'machine-learning', 'marine-engineering', 'materials-science',
    'mechanical-engineering', 'mechatronics', 'nuclear-engineering',
  ].map((slug) => page(`articles/${slug}.html`, articlePage)),

  // Component fixture, added in Task 3. The runner skips it until the file exists.
  page('tests/fixtures/components.html', componentsWork),
];
