// Shared page behaviour for the LEARNcraft design system:
// drawer menu, language menu, theme toggle, and one-time storage key migration.
// Bound by markup (classes and data attributes), so pages need no inline JS.
// Every binding does nothing if its element is missing.

(function () {
    'use strict';

    const LANG_KEY = 'learncraft_language';
    const THEME_KEY = 'learncraft_theme';
    const LANGS = ['en', 'ru', 'uz'];

    function storage(fn) {
        try {
            return fn(window.localStorage);
        } catch (e) {
            return null; // storage blocked: behave as a fresh visitor
        }
    }

    // Older pages saved language and theme under other keys. Copy them once, then remove them.
    function migrateStorage() {
        storage((ls) => {
            const oldLang = (ls.getItem('preferredLanguage') || ls.getItem('selectedLanguage') || '').toLowerCase();
            if (!ls.getItem(LANG_KEY) && LANGS.includes(oldLang)) ls.setItem(LANG_KEY, oldLang);

            const oldTheme = ls.getItem('theme');
            if (!ls.getItem(THEME_KEY) && (oldTheme === 'light' || oldTheme === 'dark')) {
                ls.setItem(THEME_KEY, oldTheme);
                if (window.LearnCraftTheme) window.LearnCraftTheme.set(oldTheme);
            }

            ['preferredLanguage', 'selectedLanguage', 'languageDisplay', 'theme'].forEach((k) => ls.removeItem(k));
        });
    }

    const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

    function initDrawer() {
        const toggle = document.querySelector('[data-lc-drawer-toggle][aria-controls]');
        const drawer = toggle && document.getElementById(toggle.getAttribute('aria-controls'));
        if (!drawer) return;

        const openLabel = toggle.getAttribute('aria-label') || 'Open menu';

        function setOpen(open, { restoreFocus = true } = {}) {
            drawer.hidden = !open;
            toggle.setAttribute('aria-expanded', String(open));
            toggle.setAttribute('aria-label', open ? 'Close menu' : openLabel);
            document.documentElement.style.overflow = open ? 'hidden' : '';
            if (open) {
                const first = drawer.querySelector(FOCUSABLE);
                if (first) first.focus();
            } else if (restoreFocus) {
                toggle.focus();
            }
        }

        toggle.addEventListener('click', () => setOpen(drawer.hidden));

        document.addEventListener('keydown', (e) => {
            if (drawer.hidden) return;
            if (e.key === 'Escape') {
                e.preventDefault();
                setOpen(false);
                return;
            }
            if (e.key !== 'Tab') return;
            // Keep focus inside the drawer and its toggle while open.
            const items = [toggle, ...drawer.querySelectorAll(FOCUSABLE)];
            const first = items[0];
            const last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        });

        drawer.addEventListener('click', (e) => {
            if (e.target.closest('a')) setOpen(false, { restoreFocus: false });
        });

        window.matchMedia('(min-width: 1024px)').addEventListener('change', (mq) => {
            if (mq.matches && !drawer.hidden) setOpen(false, { restoreFocus: false });
        });
    }

    function initLanguageMenu() {
        const button = document.querySelector('.lc-lang');
        const menu = button && document.getElementById(button.getAttribute('aria-controls'));
        if (!menu) return;
        const options = [...menu.querySelectorAll('.lc-lang__option[data-lang]')];
        if (!options.length) return;

        function current() {
            const saved = storage((ls) => ls.getItem(LANG_KEY));
            return LANGS.includes(saved) ? saved : 'en';
        }

        function render(lang) {
            button.textContent = lang.toUpperCase();
            const name = options.find((o) => o.dataset.lang === lang)?.textContent.trim() || lang;
            button.setAttribute('aria-label', `Language: ${name}`);
            options.forEach((o) => o.setAttribute('aria-selected', String(o.dataset.lang === lang)));
        }

        function open() {
            menu.hidden = false;
            button.setAttribute('aria-expanded', 'true');
            const selected = options.find((o) => o.getAttribute('aria-selected') === 'true') || options[0];
            selected.focus();
        }

        function close({ restoreFocus = true } = {}) {
            menu.hidden = true;
            button.setAttribute('aria-expanded', 'false');
            if (restoreFocus) button.focus();
        }

        function choose(lang) {
            if (window.LearnCraftI18n && typeof window.LearnCraftI18n.setLanguage === 'function') {
                window.LearnCraftI18n.setLanguage(lang);
            } else {
                storage((ls) => ls.setItem(LANG_KEY, lang));
            }
            render(lang);
            close();
        }

        button.addEventListener('click', () => (menu.hidden ? open() : close()));
        button.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' && menu.hidden) {
                e.preventDefault();
                open();
            }
        });

        menu.addEventListener('click', (e) => {
            const option = e.target.closest('.lc-lang__option[data-lang]');
            if (option) choose(option.dataset.lang);
        });

        menu.addEventListener('keydown', (e) => {
            const i = options.indexOf(document.activeElement);
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const step = e.key === 'ArrowDown' ? 1 : -1;
                options[(i + step + options.length) % options.length].focus();
            } else if (e.key === 'Home' || e.key === 'End') {
                e.preventDefault();
                options[e.key === 'Home' ? 0 : options.length - 1].focus();
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (i > -1) choose(options[i].dataset.lang);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                close();
            } else if (e.key === 'Tab') {
                close({ restoreFocus: false });
            }
        });

        document.addEventListener('click', (e) => {
            if (!menu.hidden && !menu.contains(e.target) && e.target !== button) close({ restoreFocus: false });
        });

        render(current());
    }

    function initThemeToggle() {
        const toggles = document.querySelectorAll('[data-lc-theme-toggle]');
        if (!toggles.length || !window.LearnCraftTheme) return;

        function render() {
            const light = window.LearnCraftTheme.getCurrent() === 'light';
            toggles.forEach((t) => t.setAttribute('aria-pressed', String(light)));
        }

        toggles.forEach((t) => t.addEventListener('click', () => {
            window.LearnCraftTheme.toggle();
            render();
        }));
        render();
    }

    function init() {
        migrateStorage();
        initDrawer();
        initLanguageMenu();
        initThemeToggle();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
