// In-scope learner pages (spec: "Pages in scope").
// `expect(page, ctx)` returns extra failure messages for that page; later plan tasks add them.

const page = (path, expect) => ({ path, name: path.replace(/\.html$/, ''), expect });

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

  page('pages/about.html'),
  page('pages/ask-ai.html'),
  page('pages/ai-usage.html'),
  page('pages/auth.html'),
  page('pages/login.html'),
  page('pages/registration.html'),
  page('pages/settings.html'),
  page('pages/support.html'),
  page('pages/community.html'),
  page('pages/debug-help.html'),

  page('courses/roadmap.html'),
  page('courses/civil-roadmap.html'),
  page('courses/civil-stage1.html'),
  page('courses/civil-stage2.html'),
  page('courses/civil-stage3.html'),
  page('courses/civil-stage4.html'),
  page('courses/civil-stage5.html'),
  page('courses/civil-stage6.html'),
  page('courses/choose-field.html'),
  page('courses/learn.html'),
  page('courses/practice.html'),

  page('learning/lesson.html'),
  page('study/civil-foundations.html'),

  ...[
    'aerospace-engineering', 'architectural-engineering', 'biomedical-engineering',
    'chemical-engineering', 'civil-engineering', 'computer-science',
    'electrical-engineering', 'environmental-engineering', 'industrial-engineering',
    'machine-learning', 'marine-engineering', 'materials-science',
    'mechanical-engineering', 'mechatronics', 'nuclear-engineering',
  ].map((slug) => page(`articles/${slug}.html`)),

  // Component fixture, added in Task 3. The runner skips it until the file exists.
  page('tests/fixtures/components.html', componentsWork),
];
