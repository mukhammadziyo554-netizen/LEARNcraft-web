# LEARNcraft front-end: "Site plan" redesign

Date: 2026-11-18
Branch: `fix/frontend-polish`
Status: design approved in chat, spec awaiting review

## Goal

Fix the front-end breakage introduced by commit `3c39a43` and give the learner-facing site one consistent, accessible, mobile-first design with its own character, instead of the generic "AI template" look it has today.

Success means:

- No page shows raw CSS as text, and no learner page throws a JavaScript error on load.
- Every learner page works at 375px wide with no sideways scrolling, and scales up cleanly to 768px and 1440px.
- All learner pages use one set of design tokens and shared components from `css/style.css`.
- Text contrast is at least 4.5:1, keyboard focus is always visible, and zoom is allowed.
- No invented data, testimonials, people or features anywhere on the site.

## Decisions

Made by the front-end developer in chat:

| Topic | Decision |
|---|---|
| Main device | Phones inside the Telegram mini app. Desktop is a scaled-up version of the phone layout. |
| Direction | "Site plan": black + safety-yellow, IBM Plex Sans / Mono, sections numbered like drawing sheets. |
| Scope | Learner-facing pages only. `admin/` and `utils/` are untouched unless shared CSS breaks them. |
| Career stats | Remove the unsourced "$85k / 8% growth / $145k" cards. |

Assumptions (stated in chat, not objected to):

- Dark is the default theme. The existing light mode stays as an option.
- The "Enter LEARNcraft" splash gate and the typewriter "Welcome" are removed.
- Duplicate and old pages are listed for the developer to decide on. Nothing is deleted without approval.

## Pages in scope

- `index.html`
- `pages/`: `about`, `ask-ai`, `ai-usage`, `auth`, `login`, `registration`, `settings`, `support`, `community`, `debug-help`
- `courses/`: `roadmap`, `civil-roadmap`, `civil-stage1` to `civil-stage6`, `choose-field`, `learn`, `practice`
- `learning/lesson.html`
- `study/civil-foundations.html`
- `articles/*.html` (15 pages)

Out of scope: `admin/`, `utils/`, `bot.py`, `requirements.txt`, any backend, database or API code.

## 1. Visual direction

The site should feel like a civil-engineering drawing set, not a generic SaaS landing page.

**Colour tokens** (dark theme, the default):

| Token | Value | Use |
|---|---|---|
| `--c-bg` | `#0B0B0B` | Page background (matches Telegram header colour already set in `js/webapp-init.js`) |
| `--c-surface` | `#151515` | Cards, panels |
| `--c-surface-2` | `#1F1F1F` | Inputs, raised elements |
| `--c-border` | `#2E2E2E` | Hairlines, card borders |
| `--c-text` | `#F2F2F2` | Body text |
| `--c-text-muted` | `#A3A3A3` | Secondary text (must stay at or above 4.5:1 on `--c-bg`) |
| `--c-accent` | `#F5C400` | The only yellow: primary buttons, progress, key labels |
| `--c-on-accent` | `#0B0B0B` | Text on yellow |
| `--c-danger` | `#F87171` | Errors, always paired with an icon and words |
| `--c-success` | `#4ADE80` | Success states, always paired with an icon and words |
| `--c-focus` | `#F5C400` | Focus ring |

Light theme (`body.light-mode`) swaps background, surface, border and text values. In light mode yellow is used only as a fill behind dark text, never as text colour.

**Typography**

- IBM Plex Sans (400, 500, 600, 700) for headings and body; IBM Plex Mono (400, 500) for labels, stage numbers, units and code. Loaded from Google Fonts with `display=swap`.
- Both families cover Latin and Cyrillic. Uzbek `oʻ` / `gʻ` (U+02BB) must be verified in the browser before rollout; if missing, fall back to `'` for those letters only via the existing translation strings, not by changing fonts.
- Base size 16px on mobile, 17px from 768px. Body line-height 1.6. Headings use a fixed scale token set (`--fs-xs` to `--fs-3xl`).

**Motifs**

- Section labels in Plex Mono, uppercase, numbered: `01 / FOUNDATIONS`.
- A faint blueprint grid background used in at most two places (home hero, roadmap header), never behind body text.
- Square-ish corners (6px radius), 1px borders. No glow, no glassmorphism, no gradients on text.

**Removed**

- Splash overlay, typewriter welcome and the `Brush Script MT` font.
- Emoji used as icons. Replaced with inline SVG icons (Lucide set, copied as inline SVG, no icon font or CDN).
- Purple Send button on Ask AI and the green auth theme.
- Template footer links (CMS, SEO, Plugins, Templates, Collaborate, Publish) and social links that point to generic homepages (`https://instagram.com` etc.). Social links come back only if real account URLs are provided.

**Motion**

- 150–250ms ease-out for hover, press and reveal.
- All non-essential motion disabled under `prefers-reduced-motion: reduce`.

## 2. Code structure

- `css/style.css` holds, in order: font import, tokens, base/reset, layout helpers, shared components (navbar, drawer, language menu, buttons, cards, stage progress, forms, alerts, footer, article prose), utilities, light-mode overrides.
- Page-specific CSS that is still needed moves into `style.css` under a clearly commented page section, one page at a time, as that page is redesigned. Each move is followed by a desktop and mobile screenshot check before commit.
- `js/site.js` (new) owns the navbar drawer, theme toggle and language menu. It runs on `DOMContentLoaded`, never touches `document.body` before it exists, and does nothing if an element is missing.
- `js/theme.js` is fixed so it no longer crashes when loaded in `<head>` (apply theme class to `document.documentElement` early, mirror to `body` on DOM ready), or its job is folded into `site.js`.
- `js/access-control.js` and `js/auth.js` use `export`, so every page that loads them must use `<script type="module">`. Their logic is not changed (it is backend-adjacent).
- `js/i18n.js` must be loaded on every page that calls `LearnCraftI18n`.
- Pages stay plain HTML. No framework, no bundler, no build step. Shared navbar and footer markup is copied from one reference snippet so every page is identical.

## 3. Mobile and Telegram

- Layout is written mobile-first: base styles target 375px, with `min-width` breakpoints at 768px and 1024px.
- Touch targets at least 44×44px with at least 8px between them.
- No horizontal scroll at any width from 320px up.
- `env(safe-area-inset-*)` padding on the navbar, footer and any fixed button.
- Lesson page: the floating chat button sits above the bottom safe area and never covers lesson text (content gets bottom padding equal to the button height plus gap).

## 4. Accessibility

- Semantic landmarks on every page: `header`, `nav`, `main`, `footer`; one `h1` per page; headings in order.
- Global `:focus-visible` ring using `--c-focus`; remove all `outline: none` / `outline: 0` that have no replacement.
- Remove `user-scalable=no` and `maximum-scale=1` from all viewport tags.
- Every form field has a visible `<label>`. Placeholder text is never the only label.
- Errors and success messages use an icon plus text, and are announced with `role="alert"` or `aria-live="polite"`.
- Icon-only buttons get `aria-label`; decorative SVGs get `aria-hidden="true"`.
- Language menu and drawer are keyboard operable (Escape closes, focus returns to the trigger).

## 5. Content

- Home: the career stat cards are replaced by a short "What the 6 civil stages cover" section built from the stage titles that already exist in `courses/civil-stage1.html` to `civil-stage6.html`.
- Footer: links only to pages that exist in the repo.
- Settings: "John Doe" becomes an empty input with a neutral placeholder.
- On-page copy is rewritten for clarity and a natural voice (humanizer / unslop writing skills). Facts and features are not changed or invented. Russian and Uzbek translation keys are kept; if English copy changes, the matching keys in `js/i18n.js` are flagged for the developer rather than machine-translated.
- Pricing section: kept as is (prices are a product decision), only restyled.

## 6. Checks and tooling

Dev-only additions to `package.json` (no effect on the deployed site):

- `npm run check`: a Playwright script that opens every in-scope page at 375×812 and 1440×900 and fails on: uncaught page errors, horizontal overflow, visible text containing CSS rule syntax (`{` … `:` … `;` … `}`) outside `<code>`/`<pre>`, `<img>` without `alt`, and viewport tags that block zoom.
- `npm run lint`: `html-validate` for the in-scope HTML and `stylelint` (standard config, relaxed where needed) for `css/style.css`.
- `npm run dev` stays as is.
- `.playwright-mcp/` and Playwright output folders are added to `.gitignore`.

The check script is written first and committed failing, then each fix step makes more of it pass (TDD at page level).

## 7. Order of work

Each step is its own commit on `fix/frontend-polish`. Nothing is pushed until the developer says so.

1. Add `npm run check` and `npm run lint`; record the failing baseline.
2. Fix current breakage: two-click Enter button (by removing the splash), JS errors, About page head, leaked CSS text, horizontal overflow, and the broken `auth.css` link in `pages/auth.html` (the file exists at the repo root, so the path becomes `../auth.css`).
3. Design tokens and shared components in `style.css`, plus `js/site.js`.
4. Home page.
5. Roadmap, civil-roadmap and the 6 civil stages.
6. Lesson and Ask AI.
7. Articles: one shared article layout for all 15.
8. Auth, login, registration, settings, support, community, about, ai-usage, debug-help, choose-field, learn, practice, study.
9. Copy pass, duplicate-page list for the developer, final desktop + mobile check of every in-scope page.

## Risks

- `index.html` is 5,381 lines with about 95 KB of inline CSS. Moving it in one go is what broke the site last time, so it moves section by section with a screenshot check per section.
- Some inline scripts depend on element IDs and classes. Markup changes keep existing IDs and `data-*` attributes unless the script using them is updated in the same commit.
- Shared CSS might change how `admin/admin.html` looks, since it already links `style.css`. The check covers it at the end; if it breaks, admin gets a scoped fix only.
