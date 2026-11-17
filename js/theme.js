// Global theme management. Loaded in <head> on most pages, so it must not touch
// document.body until the DOM is ready. The early pass only sets <html data-theme>,
// which the stylesheet uses to avoid a flash of the wrong theme.

(function () {
    'use strict';

    const THEME_KEY = 'learncraft_theme';

    function readTheme() {
        try {
            return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
        } catch (e) {
            return 'dark';
        }
    }

    function saveTheme(theme) {
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (e) {
            // Storage blocked (private mode): the theme still applies for this page view.
        }
    }

    function applyTheme(theme) {
        document.documentElement.dataset.theme = theme;
        if (document.body) document.body.classList.toggle('light-mode', theme === 'light');
    }

    applyTheme(readTheme());
    document.addEventListener('DOMContentLoaded', () => applyTheme(readTheme()));
    window.addEventListener('pageshow', () => applyTheme(readTheme()));

    window.LearnCraftTheme = {
        // Returns true when the new theme is light (kept from the previous API).
        toggle() {
            const next = this.getCurrent() === 'light' ? 'dark' : 'light';
            this.set(next);
            return next === 'light';
        },
        getCurrent() {
            return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
        },
        set(theme) {
            const value = theme === 'light' ? 'light' : 'dark';
            saveTheme(value);
            applyTheme(value);
        },
    };
})();
