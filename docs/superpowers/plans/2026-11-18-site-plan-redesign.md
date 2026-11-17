# LEARNcraft "Site plan" Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair the front-end breakage from commit `3c39a43`, then move every learner-facing page onto one accessible, mobile-first "Site plan" design system.

**Architecture:** Plain static HTML pages share one stylesheet (`css/style.css`: tokens + `lc-` prefixed components) and one behaviour script (`js/site.js`: drawer, theme, language menu). A Playwright check script (`npm run check`) is the test suite: generic checks for every page plus per-page expectations, written first and made to pass task by task.

**Tech Stack:** HTML, CSS custom properties, vanilla JS (ES2020, no bundler), Node 26 / npm 11 for dev tooling only, `playwright`, `html-validate`, `stylelint` + `stylelint-config-standard`.

**Spec:** `docs/superpowers/specs/2026-11-18-site-plan-redesign-design.md`

## Global Constraints

- Front-end only. Do not change `bot.py`, `requirements.txt`, `admin/`, `utils/`, or the logic inside `js/auth.js` and `js/access-control.js`.
- Branch `fix/frontend-polish`. One commit per task, messages ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never push.
- No framework, no bundler, no build step for the site. `npm run dev` stays `python3 -m http.server 8000`.
- Tokens, exactly: `--c-bg #0B0B0B`, `--c-surface #151515`, `--c-surface-2 #1F1F1F`, `--c-border #2E2E2E`, `--c-text #F2F2F2`, `--c-text-muted #A3A3A3`, `--c-accent #F5C400`, `--c-on-accent #0B0B0B`, `--c-danger #F87171`, `--c-success #4ADE80`, `--c-focus #F5C400`. No other yellow anywhere in learner pages.
- Fonts: IBM Plex Sans 400/500/600/700 and IBM Plex Mono 400/500 from Google Fonts with `display=swap`. Base 16px, 17px from 768px, body line-height 1.6. Radius 6px. Borders 1px.
- Breakpoints `min-width: 768px` and `min-width: 1024px` only. Touch targets ≥ 44×44px. No horizontal scroll from 320px up.
- Motion 150–250ms ease-out; everything non-essential off under `prefers-reduced-motion: reduce`.
- Contrast ≥ 4.5:1 (≥ 3:1 for text ≥ 24px, or ≥ 18.66px bold). Visible `:focus-visible` ring. Zoom never blocked.
- No invented numbers, testimonials, people, credentials or features. No emoji used as icons; inline Lucide SVGs with `aria-hidden="true"` when decorative.
- Keep existing element IDs and `data-*` attributes used by inline scripts unless the script is updated in the same commit.
- Storage keys: language `learncraft_language` (from `js/i18n.js`), theme `learncraft_theme` (from `js/theme.js`). Legacy keys `preferredLanguage`, `selectedLanguage`, `languageDisplay`, `theme` are read once for migration, then removed.

## Review Focus

1. **Russian and Uzbek text is longer than English.** Nav, buttons and cards must not overflow or clip at 375px when `learncraft_language` is `ru` or `uz`. Test: Task 1 check runs every page a second time in `ru` at 375px (overflow check only).
2. **Light mode.** Every page must pass contrast with `learncraft_theme = light`. Test: Task 1 check runs the contrast check in light mode on every page.
3. **First load with no storage and no Telegram.** Opening a page in a normal browser with empty localStorage must show content immediately (no gate, no error). Test: generic page-error and "main is visible" checks run with a fresh context.
4. **Keyboard-only use of the menu.** Tab to the burger, open the drawer, reach every link, Escape closes and focus returns. Test: Task 3 `drawer keyboard` and `language menu keyboard` checks.
5. **Narrowest phones (320px).** Test: Task 1 overflow check runs at 320×640 as well as 375×812.

---

## File Structure

| File | Responsibility |
|---|---|
| `tests/serve.mjs` (create) | Tiny static file server on a free port for the check run (`node:http`, `node:fs`). |
| `tests/pages.mjs` (create) | The in-scope page list and per-page expectation functions. |
| `tests/checks.mjs` (create) | Generic checks: page errors, overflow, leaked CSS, img alt, viewport, landmarks, contrast. |
| `tests/check.mjs` (create) | Runner: starts server, runs generic + page checks per viewport/theme/language, prints a table, exits non-zero on failure. Supports `--only <substring>`. |
| `tests/fixtures/components.html` (create) | Every `lc-` component on one page, so component CSS and `site.js` are tested before pages use them. |
| `.htmlvalidate.json`, `.stylelintrc.json` (create) | Lint configs. |
| `package.json` (modify) | `check`, `lint` scripts and devDependencies. |
| `.gitignore` (modify) | `.playwright-mcp/`, `test-results/`, `playwright-report/`. |
| `css/style.css` (rewrite in stages) | Tokens, base, components, page sections, light mode. |
| `js/site.js` (create) | Drawer, theme toggle, language menu, storage-key migration. |
| `js/theme.js` (modify) | Early theme apply on `<html>` without touching `body` before it exists. |
| In-scope HTML pages (modify) | Markup moved onto `lc-` components; inline `<style>` removed once its rules live in `style.css`. |
| `docs/superpowers/notes/2026-11-18-handoff.md` (create, Task 9) | Duplicate-page list, i18n keys needing human translation, removed claims. |

---

### Task 1: Check and lint tooling, failing baseline

**Files:**
- Create: `tests/serve.mjs`, `tests/pages.mjs`, `tests/checks.mjs`, `tests/check.mjs`, `.htmlvalidate.json`, `.stylelintrc.json`
- Modify: `package.json`, `.gitignore`; add `.claude/launch.json` (already on disk, untracked)

**Interfaces:**
- Produces: `PAGES: Array<{ path: string, name: string, expect?: (page) => Promise<string[]> }>` exported from `tests/pages.mjs`. Each `expect` returns a list of failure messages (empty = pass). Later tasks add `expect` functions here.
- Produces: generic checks in `tests/checks.mjs`, each `async (page, ctx) => string[]`: `pageErrors`, `noHorizontalOverflow`, `noLeakedCss`, `imagesHaveAlt`, `viewportAllowsZoom`, `hasLandmarks`, `namedControls`, `noEmojiIcons`, `contrast`.
- Produces: `npm run check [-- --only <substring>]`, `npm run lint`.

- [ ] **Step 1: Add devDependencies and scripts**

`npm install -D playwright html-validate stylelint stylelint-config-standard`, then `npx playwright install chromium`. Scripts: `"check": "node tests/check.mjs"`, `"lint": "html-validate index.html pages courses learning articles study && stylelint css/style.css"`. Add the three ignore lines to `.gitignore`.

- [ ] **Step 2: Write the server and page list**

`tests/serve.mjs` exports `startServer(root: string) => Promise<{ url: string, close(): Promise<void> }>`, serving files from the repo root with correct content types for html/css/js/png/jpg/svg/json, port 0.

`tests/pages.mjs` lists every in-scope page from the spec's "Pages in scope" section (index, 10 `pages/`, 11 `courses/` entries counting roadmap/civil-roadmap/6 stages/choose-field/learn/practice, `learning/lesson.html`, `study/civil-foundations.html`, 15 `articles/`), plus `tests/fixtures/components.html` (added in Task 3; skip it in the runner if the file does not exist).

- [ ] **Step 3: Write the generic checks**

Rules each check enforces:
- `pageErrors`: any `pageerror` event, or a console `error` whose text is not a failed network request to `telegram.org`.
- `noHorizontalOverflow`: `documentElement.scrollWidth > clientWidth`; message names the widest offending element (`tag#id.class`, its right edge).
- `noLeakedCss`: a visible text node outside `pre, code, style, script` that matches `/[.#]?[a-z-]+\s*\{[^}]*:[^}]*;/i`.
- `imagesHaveAlt`: `img:not([alt])`.
- `viewportAllowsZoom`: `meta[name=viewport]` exists and its content has neither `user-scalable=no` nor `maximum-scale=1`.
- `hasLandmarks`: exactly one `h1`; one `main`; at least one `header` or `nav`.
- `namedControls`: every visible `a[href]`, `button` and `[role=button]` has a non-empty accessible name (text, `aria-label` or `aria-labelledby`).
- `noEmojiIcons`: no visible text matching `/\p{Extended_Pictographic}/u` outside `.lc-prose` (article body text is left alone).
- `contrast`: for each visible element with a direct non-whitespace text node, compute WCAG contrast of its colour against the first non-transparent ancestor background (fallback `--c-bg`); fail below 4.5 (3.0 for large text). Report at most 5 per page.

- [ ] **Step 4: Write the runner**

`tests/check.mjs` runs, for each page: generic checks at 375×812 (dark, `en`), 1440×900 (dark, `en`), `contrast` again at 375×812 with `learncraft_theme=light`, and `noHorizontalOverflow` at 320×640 and at 375×812 with `learncraft_language=ru`. Storage is set with `context.addInitScript` before navigation; each run uses a fresh browser context. Then the page's `expect`. Prints `PASS`/`FAIL` per page with messages, a summary count, exit code 1 on any failure. `--only` filters `PAGES` by `path` substring.

- [ ] **Step 5: Run and record the baseline**

Run: `npm run check`
Expected: FAIL. At minimum `index.html` fails `pageErrors` and `noLeakedCss`; `pages/about.html` fails `noLeakedCss` and `viewportAllowsZoom`; `courses/roadmap.html` fails `pageErrors` (theme.js). Save the summary lines into the commit message body.

Run: `npm run lint`
Expected: runs (failures are fine); confirm both tools execute.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .gitignore .htmlvalidate.json .stylelintrc.json tests .claude/launch.json
git commit -m "Add page check and lint tooling with failing baseline"
```

---

### Task 2: Stop the breakage

**Files:**
- Modify: `index.html` (lines 3589–3699 leaked block, 3702–3714 splash/welcome markup, splash CSS in the head `<style>`, `startExperience`/`checkIntroStatus`/`typeWriterHandwritten` and the intro `DOMContentLoaded` block in the inline scripts, `.lang-option` handler near line 4839)
- Modify: `js/theme.js`
- Modify: `pages/about.html`, `pages/ai-usage.html` (restore `<head>` from commit `bc7fa88`), `pages/registration.html` (unclosed `<style>`), `pages/auth.html` (`auth.css` → `../auth.css`)
- Modify: `pages/ask-ai.html`, `learning/lesson.html` (load `access-control.js` as `type="module"`)
- Modify: `pages/support.html`, `pages/login.html`, `pages/about.html` (add `../js/i18n.js`)
- Modify: viewport tags in `pages/registration.html`, `pages/ask-ai.html`, `pages/support.html`, `learning/lesson.html`
- Modify: `css/style.css` (append a `/* === Legacy home (replaced in Task 4) === */` section)
- Test: `tests/pages.mjs`

**Interfaces:**
- Produces: `js/theme.js` sets `document.documentElement.dataset.theme = 'light' | 'dark'` immediately and mirrors `light-mode` on `body` at `DOMContentLoaded`. `window.LearnCraftTheme = { toggle(), getCurrent(), set(theme) }` keeps its current names.

- [ ] **Step 1: Add the failing expectations**

In `tests/pages.mjs`, `index.html` expect: no element `#startupOverlay` or `#welcomeMessage`; `#pageContent` is visible within 500ms of `load`; navbar links are not rendered as default blue underlined links (`getComputedStyle(a).color !== 'rgb(0, 0, 238)'` for `.main-nav a`).

- [ ] **Step 2: Run to see the failures**

Run: `npm run check -- --only index.html` → FAIL on the new expectations plus `pageErrors`, `noLeakedCss`.
Run: `npm run check -- --only pages/about` → FAIL on `noLeakedCss`, `viewportAllowsZoom`, `pageErrors`.

- [ ] **Step 3: Fix the JS errors at their source**

- `js/theme.js`: no `document.body` access before `DOMContentLoaded`; early work only touches `document.documentElement`.
- `index.html` language-option code: read the language from the button's `data-lang` (values `EN`/`RU`/`UZ`, lower-cased), not from `getAttribute('onclick')`.
- Module scripts and missing `i18n.js` includes as listed under Files.

- [ ] **Step 4: Repair broken heads and the leaked CSS**

- `pages/about.html`, `pages/ai-usage.html`: take the `<head>` from `git show bc7fa88:<path>` (charset, viewport, title, fonts, opening `<style>`), keep the current body.
- `pages/registration.html`: close the `<style>` before `</head>`.
- `index.html` 3589–3699: move the stray rules (authority cards and their media/light-mode/animation rules) into the legacy section of `style.css`; delete them from the HTML.
- Restore the rules `3c39a43` deleted from `index.html` but never moved: extract the removed selectors with `git show 3c39a43 -- index.html` and append them, unchanged, to the legacy section. These are temporary and are replaced in Task 4.

- [ ] **Step 5: Remove the splash gate**

Delete the splash and welcome markup, their CSS and scripts, and the `learncraft-intro-shown*` / `learncraft-entered` storage logic. `#pageContent` renders without the `hidden` class.

- [ ] **Step 6: Find and fix the home overflow**

Run `npm run check -- --only index.html`; the overflow message names the element. Fix that element's width/positioning at its rule (no `overflow-x: hidden` on `html`/`body`).

- [ ] **Step 7: Run the checks**

Run: `npm run check -- --only index.html` and `--only pages/` → `pageErrors`, `noLeakedCss`, `viewportAllowsZoom`, overflow, and Task 2 expectations PASS. `contrast` and `hasLandmarks` may still fail (later tasks).

- [ ] **Step 8: Screenshot and commit**

Screenshot home, about, ask-ai at 375 and 1440 and compare to the pre-breakage look (`bc7fa88`). Commit: `Fix broken styles, script errors and remove splash gate`.

---

### Task 3: Design tokens, components and site.js

**Files:**
- Modify: `css/style.css` (new top: font import, tokens, base, components, utilities, light mode; legacy section stays at the bottom)
- Create: `js/site.js`, `tests/fixtures/components.html`
- Test: `tests/pages.mjs`

**Interfaces:**
- Produces CSS classes (all later tasks use only these plus page sections):
  - Layout: `.lc-container` (max-width 1120px, inline padding 16px / 24px from 768px), `.lc-stack` (`--gap`), `.lc-grid-bg`
  - Header: `.lc-header`, `.lc-header__brand`, `.lc-nav`, `.lc-nav__link` (`[aria-current="page"]` styled), `.lc-burger`
  - Drawer: `.lc-drawer` (`[hidden]` when closed), `.lc-drawer__link`
  - Language: `.lc-lang` (button) + `.lc-lang__menu` (`role="listbox"`) + `.lc-lang__option[data-lang="en|ru|uz"]`
  - Text: `.lc-label` (Plex Mono, uppercase, 0.08em tracking, e.g. `01 / FOUNDATIONS`), `.lc-lead`, `.lc-prose`
  - Controls: `.lc-btn`, `.lc-btn--primary` (yellow fill), `.lc-btn--secondary` (1px border), `.lc-btn--ghost`; `.lc-field` (label + input/textarea/select + `.lc-field__hint`)
  - Surfaces: `.lc-card`, `.lc-card--link`, `.lc-stage` (stage card), `.lc-progress` (`style="--value: 0.33"`, has `role="progressbar"` with `aria-valuenow`)
  - Feedback: `.lc-alert`, `.lc-alert--error`, `.lc-alert--success` (icon + text)
  - Footer: `.lc-footer`
  - Theme: dark is `:root`; light is `:root[data-theme="light"]` and `body.light-mode` (both, for legacy pages).
- Produces `js/site.js` behaviour, bound by data attributes so pages need no inline JS:
  - `[data-lc-drawer-toggle][aria-controls]` toggles the drawer, sets `aria-expanded`, Escape closes, focus returns to the toggle, focus is kept inside while open.
  - `[data-lc-theme-toggle]` calls `window.LearnCraftTheme.toggle()` and updates `aria-pressed`.
  - `.lc-lang` opens `.lc-lang__menu`; arrow keys move between options; Enter/click calls `window.LearnCraftI18n?.setLanguage(lang)`, updates the button text to `EN`/`RU`/`UZ`, closes; Escape closes.
  - `migrateStorage()` runs once: copies `preferredLanguage`/`selectedLanguage` → `learncraft_language` and `theme` → `learncraft_theme` if the new key is empty, then removes the legacy keys and `languageDisplay`.

- [ ] **Step 1: Write the fixture and its failing expectations**

`tests/fixtures/components.html` uses every class above (header with drawer + language menu + theme toggle, buttons, field with error alert, card, stage card with progress 2/6, footer), links `../../css/style.css` and `../../js/{theme,i18n,site}.js`. Expectations: `drawer keyboard` (Tab to `.lc-burger`, Enter → drawer visible and `aria-expanded="true"`, Escape → hidden and `document.activeElement` is the burger); `language menu keyboard` (Enter opens, ArrowDown + Enter picks `RU`, button text `RU`, `localStorage.learncraft_language === 'ru'`); `focus ring` (focused `.lc-btn` has non-`none` outline or box-shadow); `touch targets` (every `a, button, input` in the fixture ≥ 44px tall at 375px); `progress` (`.lc-progress` has `aria-valuenow="2"` and `aria-valuemax="6"`).

- [ ] **Step 2: Run to see it fail**

Run: `npm run check -- --only fixtures` → FAIL (no styles, no `site.js`).

- [ ] **Step 3: Write the tokens, base and components in `style.css`**

Values from Global Constraints. Base sets `color-scheme`, font stack `"IBM Plex Sans", system-ui, sans-serif`, `:focus-visible { outline: 2px solid var(--c-focus); outline-offset: 2px; }`, the reduced-motion block, and `env(safe-area-inset-*)` padding on `.lc-header`, `.lc-footer`. Light mode swaps only `--c-bg #FAFAF7`, `--c-surface #FFFFFF`, `--c-surface-2 #F1F1EC`, `--c-border #D9D9D2`, `--c-text #141414`, `--c-text-muted #52524E`; accent stays a fill, and any text that was `--c-accent` uses `--c-text` in light mode.

- [ ] **Step 4: Write `js/site.js`**

Interfaces above. Runs on `DOMContentLoaded`; every binding no-ops if its element is missing.

- [ ] **Step 5: Verify Uzbek glyphs**

In the fixture, render `Oʻzbek, gʻisht` in Plex Sans and Plex Mono; screenshot at 2× and confirm `ʻ` (U+02BB) is drawn by Plex, not a fallback font (compare to `'`). If Plex lacks it, note it in the handoff file (Task 9); do not change fonts.

- [ ] **Step 6: Run checks and lint**

Run: `npm run check -- --only fixtures` → PASS. `npm run lint` → no stylelint errors in the new sections.

- [ ] **Step 7: Commit**

`Add design tokens, shared components and site.js`

---

### Task 4: Home page

**Files:**
- Modify: `index.html`
- Modify: `css/style.css` (add `/* === Page: home === */`; delete the legacy section and every rule in the head `<style>` that the new markup no longer uses)
- Test: `tests/pages.mjs`

**Interfaces:**
- Consumes: Task 3 classes and `site.js`.
- Keeps IDs used by inline scripts: `userAccount`, `userMenu`, `userEmail`, `userCircle`, `signInBtn`, `logoutBtn`, `sidebarAdminLink`, `chatMessages`, `chatInput`, `pricing`, `themeToggle`.

Section order (mobile first): header → hero (`01 / CIVIL ENGINEERING` label, h1, lead, primary "Start stage 1" → `courses/civil-stage1.html`, secondary "View roadmap" → `courses/roadmap.html`, `.lc-grid-bg`) → "What the 6 stages cover" (six `.lc-stage` cards using the exact titles: Foundations, Core Civil Concepts, Field Specialization, Practical Application, Professional Skills, Advanced & Career Prep, each linking to its `courses/civil-stageN.html`) → Ask AI → pricing (prices unchanged) → footer.

- [ ] **Step 1: Write the failing expectations**

`index.html` expect: no text `$85k`, `8% Growth`, `$145k`, `thousands`, `licensed engineers`; six `.lc-stage` cards whose headings equal the six titles in order and whose links resolve (HEAD 200 via the test server); footer contains no link text `CMS`, `SEO`, `Plugins`, `Templates`, `Collaborate`, `Publish` and no `href` equal to a bare social homepage (`https://instagram.com`, `https://linkedin.com`, `https://tiktok.com`, `https://x.com`, `https://youtube.com`); no element with `font-family` containing `Brush Script`.

- [ ] **Step 2: Run to see it fail**

Run: `npm run check -- --only index.html` → FAIL on the new expectations.

- [ ] **Step 3: Rebuild the markup and page CSS, one section at a time**

Order: header/drawer → hero → stages → Ask AI → pricing → footer. After each section, move only that section's rules out of the head `<style>`, run `npm run check -- --only index.html`, and screenshot 375/1440 before starting the next. Replace the stat cards and the "Why Trust LEARNcraft" section (its claims are unverified; record the removed text in the handoff file in Task 9). Navbar and drawer use `.lc-header`/`.lc-drawer` with `data-lc-*` attributes; remove the old burger/sidebar/lang inline handlers that `site.js` now covers. Inline scripts for auth state and the Ask AI chat keep working against the kept IDs.

- [ ] **Step 4: Run checks**

Run: `npm run check -- --only index.html` → PASS (all generic checks including `contrast` and `hasLandmarks`).

- [ ] **Step 5: Screenshot and commit**

Screenshot 375 and 1440, dark and light. Commit: `Redesign home page on the Site plan system`.

---

### Task 5: Roadmap and civil stages

**Files:**
- Modify: `courses/roadmap.html`, `courses/civil-roadmap.html`, `courses/civil-stage1.html` … `civil-stage6.html`
- Modify: `css/style.css` (`/* === Page: roadmap + stages === */`)
- Test: `tests/pages.mjs`

**Interfaces:**
- Consumes: `.lc-stage`, `.lc-progress`, `.lc-label`, header/footer markup from Task 4 (copy it exactly).
- Consumes: `js/progress.js` as-is for progress values; `.lc-progress` gets `--value` and `aria-valuenow` from it.

- [ ] **Step 1: Failing expectations** — for all 8 pages: header and footer markup identical to home (compare `outerHTML` of `.lc-header` with `aria-current` removed); each stage page has `h1` text equal to `Stage N — <title>`; a "Back to roadmap" link to `courses/roadmap.html`; roadmap shows six `.lc-stage` entries with `.lc-label` text `01`…`06`.
- [ ] **Step 2: Run** `npm run check -- --only courses/` → FAIL.
- [ ] **Step 3: Rebuild markup; move remaining inline CSS into the page section; delete the inline `<style>` blocks.**
- [ ] **Step 4: Run** `npm run check -- --only courses/` → PASS for these 8 pages.
- [ ] **Step 5: Screenshot 375/1440 and commit** `Move roadmap and civil stages onto shared components`.

---

### Task 6: Lesson and Ask AI

**Files:**
- Modify: `learning/lesson.html`, `pages/ask-ai.html`
- Modify: `css/style.css` (`/* === Page: lesson === */`, `/* === Page: ask-ai === */`)
- Test: `tests/pages.mjs`

**Interfaces:**
- Consumes: `.lc-prose`, `.lc-field`, `.lc-btn--primary`, `.lc-alert--error`.
- Keeps: every ID that `js/access-control.js` and the inline chat scripts query (read them from each file before editing).

- [ ] **Step 1: Failing expectations** — lesson at 375×812: the floating chat button's bounding box does not intersect any `.lc-prose p, li` box, and it sits ≥ `env(safe-area-inset-bottom) + 16px` from the bottom; ask-ai: Send button background equals `--c-accent`; the "please log in" message is a `.lc-alert--error` with `role="alert"` and an SVG icon, no `⚠️`.
- [ ] **Step 2: Run** `npm run check -- --only lesson` and `--only ask-ai` → FAIL.
- [ ] **Step 3: Rebuild markup and page CSS; lesson content gets bottom padding equal to the chat button height + 16px.**
- [ ] **Step 4: Run** both → PASS.
- [ ] **Step 5: Screenshot and commit** `Redesign lesson and Ask AI pages`.

---

### Task 7: Articles

**Files:**
- Modify: all 15 `articles/*.html`
- Modify: `css/style.css` (`/* === Page: article === */`)
- Test: `tests/pages.mjs`

**Interfaces:**
- Consumes: `.lc-prose`, `.lc-label`, header/footer.
- Produces: one article skeleton: header → `main.lc-container` → `.lc-label` (`ARTICLE / <field>`) → `h1` → `.lc-lead` subtitle → `.lc-prose` body (existing headings and paragraphs unchanged) → "Explore more topics" `.lc-btn--secondary` → footer.

- [ ] **Step 1: Failing expectation** — every article: no inline `<style>`; `main .lc-prose` exists; prose `max-width` ≤ 72ch; all articles share identical computed `font-size` and `line-height` for `.lc-prose p`.
- [ ] **Step 2: Run** `npm run check -- --only articles/` → FAIL.
- [ ] **Step 3: Apply the skeleton to all 15 files (body text untouched); delete inline styles.**
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Screenshot two articles at 375/1440; commit** `Unify article pages on one layout`.

---

### Task 8: Remaining learner pages

**Files:**
- Modify: `pages/auth.html`, `pages/login.html`, `pages/registration.html`, `pages/settings.html`, `pages/support.html`, `pages/community.html`, `pages/about.html`, `pages/ai-usage.html`, `pages/debug-help.html`, `courses/choose-field.html`, `courses/learn.html`, `courses/practice.html`, `study/civil-foundations.html`
- Modify: `css/style.css` (one page section each where needed)
- Test: `tests/pages.mjs`

**Interfaces:**
- Consumes: `.lc-field`, `.lc-alert`, `.lc-card`, header/footer.
- Keeps: form `id`/`name` attributes and IDs used by `js/auth.js` and inline scripts.

- [ ] **Step 1: Failing expectations** — forms on auth/login/registration/settings/support: every `input, select, textarea` (except `type=hidden|submit|checkbox`) has an associated visible `<label>`; no green (`hue 90–150°`, saturation > 40%) backgrounds; settings has no text `John Doe` and its name input `value` is empty; no inline `<style>` on these pages.
- [ ] **Step 2: Run** `npm run check -- --only pages/` (plus the three `courses/` and the `study/` page) → FAIL.
- [ ] **Step 3: Rebuild each page on shared components, one file per edit; delete inline styles.**
- [ ] **Step 4: Run** → PASS for all 13 pages.
- [ ] **Step 5: Screenshot each at 375/1440; commit** `Move auth, settings and info pages onto shared components`.

---

### Task 9: Copy pass, handoff notes, full verification

**Files:**
- Modify: visible English copy in in-scope pages (no facts or features changed)
- Create: `docs/superpowers/notes/2026-11-18-handoff.md`
- Test: full `npm run check`, `npm run lint`

- [ ] **Step 1: Copy pass** — load the humanizer and unslop (writing) skills; rewrite headings, leads, buttons and empty states. Where a changed string has a `data-i18n` key, leave the key and list it in the handoff file for Russian/Uzbek translation.
- [ ] **Step 2: Handoff file** — sections: *Duplicate/old pages* (root `auth.html` vs `pages/auth.html`, root `registration.html` vs `pages/registration.html`, `pages/login.html` vs `pages/auth.html`, `admin/*-old.html`, `admin/registered-emails-old-backup.html`, `admin/test-admin-analytics.html`) with what links to each (grep result); *Removed claims* (exact text of removed stats and trust section); *i18n keys needing translation*; *Uzbek glyph result* from Task 3; *Social links* (need real account URLs).
- [ ] **Step 3: Full run** — `npm run check` → all in-scope pages PASS. `npm run lint` → no errors (warnings listed in the handoff file). `grep -rnE "outline:\s*(none|0)" css/style.css index.html pages courses learning articles study` → every hit is paired with a `:focus-visible` replacement in the same rule set, otherwise remove it.
- [ ] **Step 4: Admin smoke** — open `admin/admin.html` (it links `style.css`) at 1440; if the new base styles broke it, add a scoped fix under `/* === Admin compatibility === */` only.
- [ ] **Step 5: Review** — run `code-review` on the branch diff and `code-simplifier` on `css/style.css` and `js/site.js`; apply fixes; re-run Step 3.
- [ ] **Step 6: Commit** `Copy pass and handoff notes for the redesign`. Do not push.
