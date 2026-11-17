// Generic checks run on every page. Each check returns a list of failure messages (empty = pass).

const MAX_REPORTS = 5;

// Shared in-page helpers, injected before each check that needs them.
const HELPERS = `
  window.__lc = window.__lc || {
    visible(el) {
      if (!el.getClientRects().length) return false;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden') return false;
      for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
        if (parseFloat(getComputedStyle(n).opacity) === 0) return false;
        if (n.getAttribute('aria-hidden') === 'true') return false;
      }
      return true;
    },
    describe(el) {
      let s = el.tagName.toLowerCase();
      if (el.id) s += '#' + el.id;
      if (typeof el.className === 'string' && el.className.trim()) s += '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.');
      return s;
    },
    textNodes(skipSelector) {
      const out = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let t = walker.nextNode(); t; t = walker.nextNode()) {
        const el = t.parentElement;
        if (!el || !t.nodeValue.trim()) continue;
        if (el.closest('script, style, noscript, template, textarea, pre, code' + (skipSelector ? ', ' + skipSelector : ''))) continue;
        if (!this.visible(el)) continue;
        out.push(t);
      }
      return out;
    },
  };
`;

async function inPage(page, fn, arg) {
  await page.addScriptTag({ content: HELPERS });
  return page.evaluate(fn, arg);
}

export const CHECKS = {
  async pageErrors(page, ctx) {
    return ctx.errors.slice(0, MAX_REPORTS);
  },

  async noHorizontalOverflow(page) {
    return inPage(page, () => {
      const docEl = document.documentElement;
      const limit = docEl.clientWidth;
      if (docEl.scrollWidth <= limit + 1) return [];
      let worst = null;
      for (const el of document.body.querySelectorAll('*')) {
        const r = el.getBoundingClientRect();
        if (r.width && r.right > limit + 1 && (!worst || r.right > worst.right)) worst = { el, right: r.right };
      }
      const who = worst ? `${__lc.describe(worst.el)} right edge ${Math.round(worst.right)}px` : 'unknown element';
      return [`page is ${docEl.scrollWidth - limit}px wider than the ${limit}px viewport (widest: ${who})`];
    });
  },

  async noLeakedCss(page) {
    return inPage(page, () => {
      const rule = /[.#]?[a-z-]+\s*\{[^}]*:[^}]*;/i;
      return __lc.textNodes()
        .filter((t) => rule.test(t.nodeValue))
        .slice(0, 5)
        .map((t) => `CSS shown as text in ${__lc.describe(t.parentElement)}: "${t.nodeValue.trim().slice(0, 60)}…"`);
    });
  },

  async imagesHaveAlt(page) {
    return page.$$eval('img:not([alt])', (imgs) =>
      imgs.slice(0, 5).map((i) => `img without alt: ${i.getAttribute('src')?.slice(0, 60)}`));
  },

  async viewportAllowsZoom(page) {
    const content = await page.$eval('meta[name="viewport"]', (m) => m.content).catch(() => null);
    if (content === null) return ['no <meta name="viewport">'];
    const out = [];
    if (/user-scalable\s*=\s*(no|0)/i.test(content)) out.push(`viewport blocks zoom: "${content}"`);
    if (/maximum-scale\s*=\s*1(\.0*)?(\D|$)/i.test(content)) out.push(`viewport caps zoom at 1: "${content}"`);
    return out;
  },

  async hasLandmarks(page) {
    return page.evaluate(() => {
      const out = [];
      const h1 = document.querySelectorAll('h1').length;
      if (h1 !== 1) out.push(`expected exactly one <h1>, found ${h1}`);
      const main = document.querySelectorAll('main').length;
      if (main !== 1) out.push(`expected exactly one <main>, found ${main}`);
      if (!document.querySelector('header, nav')) out.push('no <header> or <nav>');
      return out;
    });
  },

  async namedControls(page) {
    return inPage(page, () => {
      const nameOf = (el) => {
        if (el.getAttribute('aria-label')?.trim()) return true;
        const ids = el.getAttribute('aria-labelledby');
        if (ids && ids.split(/\s+/).some((id) => document.getElementById(id)?.textContent.trim())) return true;
        if (el.textContent.trim()) return true;
        if (el.getAttribute('title')?.trim()) return true;
        if ([...el.querySelectorAll('img[alt]')].some((i) => i.alt.trim())) return true;
        return false;
      };
      return [...document.querySelectorAll('a[href], button, [role="button"]')]
        .filter((el) => __lc.visible(el) && !nameOf(el))
        .slice(0, 5)
        .map((el) => `control without an accessible name: ${__lc.describe(el)}`);
    });
  },

  async noEmojiIcons(page) {
    return inPage(page, () => {
      const emoji = /(?![©®™‼⁉])\p{Extended_Pictographic}/u;
      return __lc.textNodes('.lc-prose')
        .filter((t) => emoji.test(t.nodeValue))
        .slice(0, 5)
        .map((t) => `emoji in ${__lc.describe(t.parentElement)}: "${t.nodeValue.trim().slice(0, 40)}"`);
    });
  },

  async contrast(page) {
    return inPage(page, () => {
      const parse = (c) => {
        const m = c.match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const [r, g, b, a = 1] = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
        return { r, g, b, a };
      };
      const lum = ({ r, g, b }) => {
        const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const blend = (top, under) => ({
        r: top.r * top.a + under.r * (1 - top.a),
        g: top.g * top.a + under.g * (1 - top.a),
        b: top.b * top.a + under.b * (1 - top.a),
        a: 1,
      });
      // Background behind an element; null if an image or gradient makes it unknowable.
      const backgroundOf = (el) => {
        const layers = [];
        for (let n = el; n; n = n.parentElement) {
          const cs = getComputedStyle(n);
          if (cs.backgroundImage !== 'none') return null;
          const bg = parse(cs.backgroundColor);
          if (bg && bg.a > 0) { layers.push(bg); if (bg.a >= 1) break; }
        }
        let color = { r: 255, g: 255, b: 255, a: 1 }; // browser canvas
        for (const layer of layers.reverse()) color = blend(layer, color);
        return color;
      };
      const seen = new Set();
      const out = [];
      for (const t of __lc.textNodes()) {
        const el = t.parentElement;
        if (seen.has(el)) continue;
        seen.add(el);
        const cs = getComputedStyle(el);
        const bg = backgroundOf(el);
        const fg0 = parse(cs.color);
        if (!bg || !fg0) continue;
        const fg = blend(fg0, bg);
        const [hi, lo] = [lum(fg), lum(bg)].sort((a, b) => b - a);
        const ratio = (hi + 0.05) / (lo + 0.05);
        const size = parseFloat(cs.fontSize);
        const large = size >= 24 || (size >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
        const need = large ? 3 : 4.5;
        if (ratio < need) {
          const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
          out.push(`contrast ${ratio.toFixed(2)}:1 < ${need} in ${__lc.describe(el)} "${t.nodeValue.trim().slice(0, 30)}" (${hex(fg)} on ${hex(bg)})`);
          if (out.length >= 5) break;
        }
      }
      return out;
    });
  },
};

// Navigate to url, collect errors, run the named checks. Returns { checkName: messages[] }.
export async function runChecks(page, url, names, { settleMs = 600 } = {}) {
  const ctx = { errors: [] };
  page.on('pageerror', (e) => ctx.errors.push(`uncaught: ${e.message.split('\n')[0]}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const where = m.location()?.url || '';
    if (where.includes('telegram.org')) return;
    ctx.errors.push(`console: ${m.text().split('\n')[0].slice(0, 120)}${where ? ` (${where.replace(/^https?:\/\/[^/]+/, '')})` : ''}`);
  });
  page.on('requestfailed', (r) => {
    if (r.url().includes('telegram.org')) return;
    ctx.errors.push(`request failed: ${r.url().replace(/^https?:\/\/[^/]+/, '')}`);
  });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(settleMs);
  const results = {};
  for (const name of names) results[name] = await CHECKS[name](page, ctx);
  return results;
}
